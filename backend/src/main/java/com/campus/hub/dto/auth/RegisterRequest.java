package com.campus.hub.dto.auth;

import com.campus.hub.domain.AppRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@Email @NotBlank String email,
		@NotBlank @Size(min = 8, max = 120) String password,
		@NotBlank @Size(max = 160) String fullName,
		@Size(max = 40) String phone,
		/** Optional self-service account type. */
		AppRole accountType
) {
}

//ppRole Enum and Role Entity/Model