package com.campus.hub.domain;

// Enum representing the current status of a resource (facility or asset)
public enum ResourceStatus {

	// Resource is available and can be booked
	ACTIVE,

	// Resource is not available for booking (e.g., maintenance, damage)
	OUT_OF_SERVICE,

	INACTIVE
}