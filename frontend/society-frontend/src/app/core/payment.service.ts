import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PaymentConfig {
  enabled: boolean;
  keyId: string | null;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
}

export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type CheckoutWindow = { open(): void };
type CheckoutConstructor = new (options: Record<string, unknown>) => CheckoutWindow;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  config() {
    return this.http.get<PaymentConfig>('/api/payments/config');
  }

  createOrder(billId: number) {
    return this.http.post<PaymentOrder>('/api/payments/orders', { billId });
  }

  verify(result: CheckoutResult) {
    return this.http.post<void>('/api/payments/verify', {
      razorpayOrderId: result.razorpay_order_id,
      razorpayPaymentId: result.razorpay_payment_id,
      razorpaySignature: result.razorpay_signature
    });
  }

  reconcile() {
    return this.http.post<{ updated: number }>('/api/payments/reconcile', {});
  }

  // Loads the provider's payment window the first time it is needed.
  private loadCheckoutScript(): Promise<void> {
    const loaded = (window as unknown as { Razorpay?: unknown }).Razorpay;
    if (loaded) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('The payment window could not be loaded. Check your internet connection.'));
      document.body.appendChild(script);
    });
  }

  // Opens the payment window. Resolves with the signed result, or rejects if the person closes it.
  async openCheckout(order: PaymentOrder): Promise<CheckoutResult> {
    await this.loadCheckoutScript();
    const Checkout = (window as unknown as { Razorpay?: CheckoutConstructor }).Razorpay;
    if (!Checkout) {
      throw new Error('The payment window is not available.');
    }

    return new Promise<CheckoutResult>((resolve, reject) => {
      let finished = false;
      const checkout = new Checkout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Smart Society',
        description: order.description,
        theme: { color: '#1f3864' },
        config: {
          display: {
            blocks: {
              preferred: {
                name: 'Pay using UPI',
                instruments: [{ method: 'upi' }]
              }
            },
            sequence: ['block.preferred'],
            preferences: { show_default_blocks: true }
          }
        },
        handler: (result: CheckoutResult) => {
          finished = true;
          resolve(result);
        },
        modal: {
          ondismiss: () => {
            if (!finished) {
              reject(new Error('The payment window was closed. No payment was made.'));
            }
          }
        }
      });
      checkout.open();
    });
  }
}