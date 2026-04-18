package com.campus.hub.repository;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import com.campus.hub.entity.BookableResource;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class BookableResourceSpecifications {

	private BookableResourceSpecifications() {
	}

	public static Specification<BookableResource> filter(
			String q,
			ResourceType type,
			Integer minCapacity,
			String locationContains,
			ResourceStatus status) {
		return (root, query, cb) -> {
			List<Predicate> parts = new ArrayList<>();
			if (q != null && !q.isBlank()) {
				String like = "%" + q.trim().toLowerCase() + "%";
				parts.add(cb.like(cb.lower(root.get("name")), like));
			}
			if (type != null) {
				parts.add(cb.equal(root.get("type"), type));
			}
			if (minCapacity != null) {
				parts.add(cb.ge(root.get("capacity"), minCapacity));
			}
			if (locationContains != null && !locationContains.isBlank()) {
				String like = "%" + locationContains.trim().toLowerCase() + "%";
				parts.add(cb.like(cb.lower(root.get("location")), like));
			}
			if (status != null) {
				parts.add(cb.equal(root.get("status"), status));
			}
			return parts.isEmpty() ? cb.conjunction() : cb.and(parts.toArray(Predicate[]::new));
		};
	}
}
