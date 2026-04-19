package com.campus.hub.service;

// Import enums used in the system
import com.campus.hub.domain.AppRole;
import com.campus.hub.domain.BookingStatus;
import com.campus.hub.domain.NotificationType;
import com.campus.hub.domain.ResourceStatus;

// Import DTOs for request/response handling
import com.campus.hub.dto.booking.BookingCreateRequest;
import com.campus.hub.dto.booking.BookingResponse;
import com.campus.hub.dto.booking.RejectBookingRequest;

// Import entity classes
import com.campus.hub.entity.BookableResource;
import com.campus.hub.entity.Booking;
import com.campus.hub.entity.User;

// Custom exception handling
import com.campus.hub.exception.ApiException;

// Repository interfaces for DB access
import com.campus.hub.repository.BookingRepository;
import com.campus.hub.repository.UserRepository;

// Spring annotations
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Java utilities
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

// Marks this class as a service layer component
@Service
public class BookingService {

    // Statuses that block overlapping bookings
    private static final List<BookingStatus> BLOCKING_STATUSES = List.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    // Dependencies (injected via constructor)
    private final BookingRepository bookingRepository;
    private final ResourceService resourceService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // Constructor injection
    public BookingService(
            BookingRepository bookingRepository,
            ResourceService resourceService,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceService = resourceService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // Create a new booking
    @Transactional
    public BookingResponse create(User requester, BookingCreateRequest req) {

        // Validate end time is after start time
        if (!req.endAt().isAfter(req.startAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RANGE", "End time must be after start time.");
        }

        // Validate start time is not in the past
        if (req.startAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_START", "Start time cannot be in the past.");
        }

        // Fetch resource and check if it's active
        BookableResource resource = resourceService.require(req.resourceId());
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RESOURCE_UNAVAILABLE", "Resource is not bookable.");
        }

        // Check for overlapping bookings
        assertNoOverlap(resource.getId(), req.startAt(), req.endAt(), null);

        // Create new booking object
        Booking b = new Booking();
        b.setRequester(requester);
        b.setResource(resource);
        b.setStartAt(req.startAt());
        b.setEndAt(req.endAt());
        b.setPurpose(req.purpose().trim());
        b.setExpectedAttendees(req.expectedAttendees());
        b.setStatus(BookingStatus.PENDING);

        // Save booking to database
        b = bookingRepository.save(b);

        // Notify admins about new booking
        notifyAdminsOfNewBooking(b);

        // Convert entity to DTO and return
        return DtoMapper.toBooking(b);
    }

    // Get bookings of the logged-in user
    @Transactional(readOnly = true)
    public List<BookingResponse> mine(User user) {
        return bookingRepository.findByRequesterIdOrderByStartAtDesc(user.getId()).stream()
                .map(DtoMapper::toBooking)
                .toList();
    }

    // Admin: list all bookings with optional filters
    @Transactional(readOnly = true)
    public List<BookingResponse> listAll(User admin, BookingStatus status, Long resourceId) {

        // Ensure user is ADMIN
        requireRole(admin, AppRole.ADMIN);

        return bookingRepository.findAll().stream()
                // Filter by status if provided
                .filter(b -> status == null || b.getStatus() == status)

                // Filter by resource if provided
                .filter(b -> resourceId == null || Objects.equals(b.getResource().getId(), resourceId))

                // Sort by latest created first
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())

                // Convert to DTO
                .map(DtoMapper::toBooking)
                .toList();
    }

    // Admin: approve booking
    @Transactional
    public BookingResponse approve(User admin, Long bookingId) {

        // Check admin role
        requireRole(admin, AppRole.ADMIN);

        Booking b = getBooking(bookingId);

        // Only pending bookings can be approved
        if (b.getStatus() != BookingStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE", "Only pending bookings can be approved.");
        }

        // Check overlapping again before approval
        assertNoOverlap(b.getResource().getId(), b.getStartAt(), b.getEndAt(), b.getId());

        // Update booking status and review details
        b.setStatus(BookingStatus.APPROVED);
        b.setReviewedBy(admin);
        b.setReviewedAt(Instant.now());
        b.setAdminReason(null);

        bookingRepository.save(b);

        // Notify user about approval
        notificationService.notifyUser(
                b.getRequester(),
                NotificationType.BOOKING_DECISION,
                "Booking approved",
                "Your booking for " + b.getResource().getName() + " was approved.",
                b.getId());

        return DtoMapper.toBooking(b);
    }

    // Admin: reject booking
    @Transactional
    public BookingResponse reject(User admin, Long bookingId, RejectBookingRequest req) {

        requireRole(admin, AppRole.ADMIN);

        Booking b = getBooking(bookingId);

        // Only pending bookings can be rejected
        if (b.getStatus() != BookingStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE", "Only pending bookings can be rejected.");
        }

        // Update booking status and reason
        b.setStatus(BookingStatus.REJECTED);
        b.setAdminReason(req.reason().trim());
        b.setReviewedBy(admin);
        b.setReviewedAt(Instant.now());

        bookingRepository.save(b);

        // Notify user about rejection
        notificationService.notifyUser(
                b.getRequester(),
                NotificationType.BOOKING_DECISION,
                "Booking rejected",
                "Your booking for " + b.getResource().getName() + " was rejected. Reason: " + req.reason().trim(),
                b.getId());

        return DtoMapper.toBooking(b);
    }

    // Cancel booking (by owner or admin)
    @Transactional
    public BookingResponse cancel(User actor, Long bookingId) {

        Booking b = getBooking(bookingId);

        // Check if user is owner or admin
        boolean owner = Objects.equals(b.getRequester().getId(), actor.getId());
        boolean admin = actor.getRoles().contains(AppRole.ADMIN);

        if (!owner && !admin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot cancel this booking.");
        }

        // Only pending or approved bookings can be cancelled
        if (b.getStatus() != BookingStatus.APPROVED && b.getStatus() != BookingStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE",
                    "Only pending or approved bookings can be cancelled.");
        }

        // Update status to cancelled
        b.setStatus(BookingStatus.CANCELLED);

        bookingRepository.save(b);

        return DtoMapper.toBooking(b);
    }

    // Check overlapping bookings
    private void assertNoOverlap(Long resourceId, Instant start, Instant end, Long excludeId) {

        // Count overlapping bookings from DB
        long count = bookingRepository.countOverlapping(resourceId, BLOCKING_STATUSES, start, end, excludeId);

        if (count > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "SCHEDULE_CONFLICT",
                    "This time range overlaps an existing booking.");
        }
    }

    // Fetch booking or throw exception if not found
    private Booking getBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Booking not found"));
    }

    // Check if user has required role
    private static void requireRole(User u, AppRole role) {
        if (!u.getRoles().contains(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Admin access required.");
        }
    }

    // Notify all admins about new booking request
    private void notifyAdminsOfNewBooking(Booking booking) {

        // Get all admins
        List<User> admins = userRepository.findByRolesContains(AppRole.ADMIN);

        // Send notification to each admin
        for (User admin : admins) {
            notificationService.notifyUser(
                    admin,
                    NotificationType.BOOKING_DECISION,
                    "New booking request",
                    "Booking #" + booking.getId() + " is pending review for " + booking.getResource().getName() + ".",
                    booking.getId());
        }
    }
}