
package com.campus.hub.repository;

import com.campus.hub.domain.BookingStatus;
import com.campus.hub.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

	List<Booking> findByRequesterIdOrderByStartAtDesc(Long requesterId);

	@Query("""
			select count(b) from Booking b
			where b.resource.id = :resourceId
			  and b.status in :statuses
			  and b.startAt < :endAt and b.endAt > :startAt
			  and (:excludeId is null or b.id <> :excludeId)
			""")
	long countOverlapping(
			@Param("resourceId") Long resourceId,
			@Param("statuses") List<BookingStatus> statuses,
			@Param("startAt") Instant startAt,
			@Param("endAt") Instant endAt,
			@Param("excludeId") Long excludeBookingId);

	List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);
}
