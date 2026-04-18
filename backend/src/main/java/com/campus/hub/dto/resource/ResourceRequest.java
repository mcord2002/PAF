

package com.campus.hub.dto.resource;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResourceRequest(
		@NotBlank @Size(max = 200) String name,
		@NotNull ResourceType type,
		@NotNull @Min(0) Integer capacity,
		@NotBlank @Size(max = 300) String location,
		@Size(max = 2000) String availabilityWindows,
		ResourceStatus status
) {
}
