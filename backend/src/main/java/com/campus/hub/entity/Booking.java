package com.campus.hub.entity;

// Import enum for booking status (e.g., PENDING, APPROVED, REJECTED)
import com.campus.hub.domain.BookingStatus;

// JPA annotations for ORM mapping
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Java time API for timestamps
import java.time.Instant;

//Entity

// Marks this class as a database entity
@Entity

// Maps this entity to the "bookings" table
@Table(name = "bookings")
public class Booking {

    // Primary key of the booking table
    @Id

    // Auto-generated ID (auto-increment in DB)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many bookings can be made by one user (requester)
    // LAZY = data will be fetched only when needed
    @ManyToOne(fetch = FetchType.LAZY, optional = false)

    // Foreign key column in DB
    @JoinColumn(name = "requester_id")
    private User requester;

    // Many bookings can belong to one resource
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id")
    private BookableResource resource;

    // Booking start time (cannot be null)
    @Column(nullable = false, name = "start_at")
    private Instant startAt;

    // Booking end time (cannot be null)
    @Column(nullable = false, name = "end_at")
    private Instant endAt;

    // Purpose of the booking (e.g., meeting, lecture)
    @Column(nullable = false, length = 500)
    private String purpose;

    // Optional field: expected number of attendees
    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    // Booking status stored as STRING in DB
    // Default value is PENDING
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BookingStatus status = BookingStatus.PENDING;

    // Optional reason given by admin (e.g., rejection reason)
    @Column(name = "admin_reason", length = 1000)
    private String adminReason;

    // Admin (User) who reviewed the booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    // Timestamp when booking was reviewed
    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    // Timestamp when booking was created (default = current time)
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // Getter for ID
    public Long getId() {
        return id;
    }

    // Setter for ID
    public void setId(Long id) {
        this.id = id;
    }

    // Getter for requester
    public User getRequester() {
        return requester;
    }

    // Setter for requester
    public void setRequester(User requester) {
        this.requester = requester;
    }

    // Getter for resource
    public BookableResource getResource() {
        return resource;
    }

    // Setter for resource
    public void setResource(BookableResource resource) {
        this.resource = resource;
    }

    // Getter for start time
    public Instant getStartAt() {
        return startAt;
    }

    // Setter for start time
    public void setStartAt(Instant startAt) {
        this.startAt = startAt;
    }

    // Getter for end time
    public Instant getEndAt() {
        return endAt;
    }

    // Setter for end time
    public void setEndAt(Instant endAt) {
        this.endAt = endAt;
    }

    // Getter for purpose
    public String getPurpose() {
        return purpose;
    }

    // Setter for purpose
    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    // Getter for expected attendees
    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    // Setter for expected attendees
    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    // Getter for booking status
    public BookingStatus getStatus() {
        return status;
    }

    // Setter for booking status
    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    // Getter for admin reason
    public String getAdminReason() {
        return adminReason;
    }

    // Setter for admin reason
    public void setAdminReason(String adminReason) {
        this.adminReason = adminReason;
    }

    // Getter for reviewedBy (admin)
    public User getReviewedBy() {
        return reviewedBy;
    }

    // Setter for reviewedBy
    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    // Getter for reviewedAt timestamp
    public Instant getReviewedAt() {
        return reviewedAt;
    }

    // Setter for reviewedAt
    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    // Getter for createdAt timestamp
    public Instant getCreatedAt() {
        return createdAt;
    }

    // Setter for createdAt
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}