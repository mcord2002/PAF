package com.campus.hub.repository;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import com.campus.hub.entity.BookableResource;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

// Utility class for building dynamic query filters for BookableResource
public final class BookableResourceSpecifications {

	// Private constructor to prevent instantiation (utility class)
	private BookableResourceSpecifications() {
	}

	// Builds a dynamic filter based on optional parameters
	public static Specification<BookableResource> filter(
			String q,                    // search keyword (resource name)
			ResourceType type,          // filter by resource type
			Integer minCapacity,        // filter by minimum capacity
			String locationContains,    // filter by location text
			ResourceStatus status) {    // filter by resource status

		return (root, query, cb) -> {

			// List to collect all filtering conditions
			List<Predicate> parts = new ArrayList<>();

			// Filter by name (case-insensitive search)
			if (q != null && !q.isBlank()) {
				String like = "%" + q.trim().toLowerCase() + "%";
				parts.add(cb.like(cb.lower(root.get("name")), like));
			}

			// Filter by resource type
			if (type != null) {
				parts.add(cb.equal(root.get("type"), type));
			}

			// Filter by minimum capacity
			if (minCapacity != null) {
				parts.add(cb.ge(root.get("capacity"), minCapacity));
			}

			// Filter by location (case-insensitive search)
			if (locationContains != null && !locationContains.isBlank()) {
				String like = "%" + locationContains.trim().toLowerCase() + "%";
				parts.add(cb.like(cb.lower(root.get("location")), like));
			}

			// Filter by resource status (ACTIVE / OUT_OF_SERVICE)
			if (status != null) {
				parts.add(cb.equal(root.get("status"), status));
			}

			// If no filters → return all records
			// Otherwise → combine all conditions with AND
			return parts.isEmpty()
					? cb.conjunction()
					: cb.and(parts.toArray(Predicate[]::new));
		};
	}
}