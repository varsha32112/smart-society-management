package com.society.society_backend.entity;

import jakarta.persistence.Table;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
//@Table(name = "flats")
@Table(name = "flats", uniqueConstraints = @UniqueConstraint(columnNames = {"block_name", "flat_number"}))
@Getter
@Setter
@NoArgsConstructor
public class Flat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "block_name", nullable = false)
    private String blockName;

    @Column(name = "flat_number", nullable = false)
    private String flatNumber;

    @Column(name = "floor_no")
    private Integer floorNo;
}
