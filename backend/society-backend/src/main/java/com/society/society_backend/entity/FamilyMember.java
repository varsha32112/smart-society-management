package com.society.society_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "family_members")
@Getter
@Setter
@NoArgsConstructor
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "resident_id")
    private User resident;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String relation;

    private String phone;
}
