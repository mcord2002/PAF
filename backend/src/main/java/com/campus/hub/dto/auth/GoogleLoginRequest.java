package com.campus.hub.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
		@NotBlank(message = "Google ID token is required.")
		String idToken,
		/**
		 * Optional hint used only when creating a brand-new user on first Google login.
		 * Allowed: USER, ADMIN, TECHNICIAN
		 */
		String portal) {
}
