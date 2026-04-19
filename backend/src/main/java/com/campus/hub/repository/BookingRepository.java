package com.campus.hub.repository;

import com.campus.hub.domain.BookingStatus;
import com.campus.hub.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

// Repository interface for accessing Booking data from the database
public interface BookingRepository extends JpaRepository<Booking, Long> {

	// Get all bookings of a specific user, ordered by latest start time
	List<Booking> findByRequesterIdOrderByStartAtDesc(Long requesterId);

	// Custom query to count overlapping bookings for a resource
	@Query("""
			select count(b) from Booking b
			where b.resource.id = :resourceId
			  and b.status in :statuses
			  and b.startAt < :endAt and b.endAt > :startAt
			  and (:excludeId is null or b.id <> :excludeId)
			""")
	long countOverlapping(
			@Param("resourceId") Long resourceId,       // resource to check
			@Param("statuses") List<BookingStatus> statuses, // only consider certain statuses (e.g., PENDING, APPROVED)
			@Param("startAt") Instant startAt,          // new booking start time
			@Param("endAt") Instant endAt,              // new booking end time
			@Param("excludeId") Long excludeBookingId  // exclude current booking (used during update)
	);

	// Get bookings filtered by status, ordered by newest first
	List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);
}