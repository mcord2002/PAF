package com.campus.hub.dto.resource;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;

public record ResourceResponse(
		Long id,
		String name,
		ResourceType type,
		Integer capacity,
		String location,
		String availabilityWindows,
		ResourceStatus status
) {
}
