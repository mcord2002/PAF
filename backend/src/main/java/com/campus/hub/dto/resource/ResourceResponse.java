package com.campus.hub.dto.resource;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;

// DTO used to send resource (facility/asset) data to the frontend
public record ResourceResponse(

		// Unique ID of the resource
		Long id,

		// Name of the resource
		String name,

		// Type of resource (LECTURE_HALL, LAB, etc.)
		ResourceType type,

		// Maximum capacity of the resource
		Integer capacity,

		// Physical location of the resource
		String location,

		// Availability schedule (e.g., "Mon-Fri 08:00-17:00")
		String availabilityWindows,

		// Current status (ACTIVE or OUT_OF_SERVICE)
		ResourceStatus status

) {
}