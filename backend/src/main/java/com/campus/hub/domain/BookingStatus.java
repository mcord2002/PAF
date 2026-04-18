package com.campus.hub.domain;

// Enum representing the different states of a booking
public enum BookingStatus {

    // Booking has been created but not yet reviewed by admin
    PENDING,

    // Booking has been approved by admin
    APPROVED,

    // Booking has been rejected by admin (usually with a reason)
    REJECTED,

    // Booking was cancelled by the user or admin
    CANCELLED
}