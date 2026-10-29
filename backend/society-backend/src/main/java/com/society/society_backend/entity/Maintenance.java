package com.society.society_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "maintenance")
@Getter
@Setter
@NoArgsConstructor
public class Maintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @Column(name = "bill_month", nullable = false)
    private LocalDate billMonth;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceStatus status = MaintenanceStatus.PENDING;

    @Column(name = "paid_on")
    private LocalDate paidOn;
}
