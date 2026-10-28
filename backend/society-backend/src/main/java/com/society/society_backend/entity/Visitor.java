package com.society.society_backend.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
@Getter
@Setter
@NoArgsConstructor
public class Visitor {@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

    @Column(name = "visitor_name", nullable = false)
    private String visitorName;

    @Column(name = "visitor_phone")
    private String visitorPhone;

    private String purpose;

    @ManyToOne(optional = false)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @ManyToOne(optional = false)
    @JoinColumn(name = "registered_by")
    private User registeredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisitorStatus status = VisitorStatus.PENDING;

    @Column(name = "entry_time")
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
