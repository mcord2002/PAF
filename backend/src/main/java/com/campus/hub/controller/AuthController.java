package com.campus.hub.controller;

import com.campus.hub.dto.auth.AuthResponse;
import com.campus.hub.dto.auth.GoogleLoginRequest;
import com.campus.hub.dto.auth.LoginRequest;
import com.campus.hub.dto.auth.RegisterRequest;
import com.campus.hub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@PostMapping("/google")
	public AuthResponse loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
		return authService.loginWithGoogle(request);
	}
}
