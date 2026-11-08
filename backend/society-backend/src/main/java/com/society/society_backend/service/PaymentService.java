package com.society.society_backend.service;

import com.society.society_backend.dto.OrderResponse;
import com.society.society_backend.dto.PaymentConfig;
import com.society.society_backend.dto.ReconcileResult;
import com.society.society_backend.dto.VerifyRequest;
import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.entity.Payment;
import com.society.society_backend.entity.PaymentStatus;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.PaymentRepository;
import com.society.society_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final String keyId;
    private final String keySecret;
    private final RestClient razorpay;

    public PaymentService(PaymentRepository paymentRepository,
                          MaintenanceRepository maintenanceRepository,
                          UserRepository userRepository,
                          @Value("${razorpay.key-id:}") String keyId,
                          @Value("${razorpay.key-secret:}") String keySecret) {
        this.paymentRepository = paymentRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.keyId = keyId == null ? "" : keyId.trim();
        this.keySecret = keySecret == null ? "" : keySecret.trim();
        this.razorpay = enabled()
                ? RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeaders(h -> h.setBasicAuth(this.keyId, this.keySecret))
                .build()
                : null;
    }

    public boolean enabled() {
        return !keyId.isBlank() && !keySecret.isBlank();
    }

    public PaymentConfig config() {
        return new PaymentConfig(enabled(), enabled() ? keyId : null);
    }

    // Step 1: the server creates the order, using the amount stored on the bill.
    @Transactional
    public OrderResponse createOrder(Long billId, String residentEmail) {
        requireEnabled();
        User resident = findResident(residentEmail);
        Maintenance bill = maintenanceRepository.findById(billId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found"));

        if (!bill.getFlat().getId().equals(resident.getFlat().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This bill is not for your flat");
        }
        if (bill.getStatus() != MaintenanceStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This bill is already paid");
        }

        long paise = toPaise(bill.getAmount());
        Map<String, Object> request = Map.of("amount", paise, "currency", "INR", "receipt", "bill-" + bill.getId());

        Map<?, ?> response;
        try {
            response = razorpay.post()
                    .uri("/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException e) {
            log.warn("Razorpay order creation failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The payment provider could not be reached. Please try again.");
        }

        String orderId = response == null ? null : (String) response.get("id");
        if (orderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The payment provider did not create an order");
        }

        Payment payment = new Payment();
        payment.setBill(bill);
        payment.setResident(resident);
        payment.setOrderId(orderId);
        payment.setAmount(bill.getAmount());
        payment.setStatus(PaymentStatus.CREATED);
        paymentRepository.save(payment);

        String label = bill.getFlat().getBlockName() + "-" + bill.getFlat().getFlatNumber();
        String description = "Maintenance " + bill.getBillMonth().toString().substring(0, 7) + ", flat " + label;
        return new OrderResponse(orderId, paise, "INR", keyId, description);
    }

    // Step 2: after the payment window closes with success, the server checks the signature.
    @Transactional
    public void verify(VerifyRequest request, String residentEmail) {
        requireEnabled();
        User resident = findResident(residentEmail);
        Payment payment = paymentRepository.findByOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getBill().getFlat().getId().equals(resident.getFlat().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment is not for your flat");
        }

        String expected = signatureFor(keySecret, request.razorpayOrderId(), request.razorpayPaymentId());
        boolean valid = MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                request.razorpaySignature().getBytes(StandardCharsets.UTF_8));
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The payment could not be verified");
        }

        markPaid(payment, request.razorpayPaymentId());
    }

    // Safety net: if the browser was closed after paying, ask the provider about unfinished orders.
    @Transactional
    public ReconcileResult reconcile(String residentEmail) {
        if (!enabled()) {
            return new ReconcileResult(0);
        }
        User resident = findResident(residentEmail);
        int updated = 0;

        for (Payment payment : paymentRepository.findByStatusAndBill_Flat_Id(
                PaymentStatus.CREATED, resident.getFlat().getId())) {
            if (payment.getCreatedAt() != null && payment.getCreatedAt().isBefore(LocalDateTime.now().minusDays(7))) {
                continue;
            }
            String capturedId = capturedPaymentId(payment.getOrderId(), toPaise(payment.getAmount()));
            if (capturedId != null) {
                markPaid(payment, capturedId);
                updated++;
            }
        }
        return new ReconcileResult(updated);
    }

    // ---------- helpers ----------

    static String signatureFor(String secret, String orderId, String paymentId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Could not compute the payment signature", e);
        }
    }

    private void markPaid(Payment payment, String paymentId) {
        if (payment.getStatus() == PaymentStatus.PAID) {
            return;
        }
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentId(paymentId);
        payment.setPaidAt(LocalDateTime.now());

        Maintenance bill = payment.getBill();
        if (bill.getStatus() == MaintenanceStatus.PENDING) {
            bill.setStatus(MaintenanceStatus.PAID);
            bill.setPaidOn(LocalDate.now());
            maintenanceRepository.save(bill);
        } else {
            log.warn("Payment {} was received for bill {} that was already paid: a refund may be needed",
                    paymentId, bill.getId());
        }
        paymentRepository.save(payment);
    }

    private String capturedPaymentId(String orderId, long expectedPaise) {
        try {
            Map<?, ?> response = razorpay.get()
                    .uri("/orders/{id}/payments", orderId)
                    .retrieve()
                    .body(Map.class);
            if (response != null && response.get("items") instanceof List<?> items) {
                for (Object item : items) {
                    if (item instanceof Map<?, ?> entry
                            && "captured".equals(entry.get("status"))
                            && entry.get("amount") instanceof Number amount
                            && amount.longValue() == expectedPaise) {
                        return (String) entry.get("id");
                    }
                }
            }
        } catch (RestClientException e) {
            log.warn("Could not check order {} with the payment provider: {}", orderId, e.getMessage());
        }
        return null;
    }

    private long toPaise(java.math.BigDecimal amount) {
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private void requireEnabled() {
        if (!enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Online payment is not set up yet");
        }
    }

    private User findResident(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getFlat() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No flat is assigned to your account");
        }
        return user;
    }
}