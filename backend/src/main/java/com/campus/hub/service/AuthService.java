package com.campus.hub.service;

import com.campus.hub.domain.AppRole;
import com.campus.hub.dto.auth.AuthResponse;
import com.campus.hub.dto.auth.GoogleLoginRequest;
import com.campus.hub.dto.auth.LoginRequest;
import com.campus.hub.dto.auth.RegisterRequest;
import com.campus.hub.entity.User;
import com.campus.hub.exception.ApiException;
import com.campus.hub.repository.UserRepository;
import com.campus.hub.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;
	private final GoogleTokenService googleTokenService;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager,
			GoogleTokenService googleTokenService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
		this.googleTokenService = googleTokenService;
	}

	@Transactional
	public AuthResponse register(RegisterRequest req) {
		if (userRepository.existsByEmailIgnoreCase(req.email())) {
			throw new ApiException(HttpStatus.CONFLICT, "EMAIL_IN_USE", "Email is already registered.");
		}
		AppRole requested = req.accountType() != null ? req.accountType() : AppRole.USER;
		Set<AppRole> roles = switch (requested) {
			case TECHNICIAN -> new HashSet<>(Set.of(AppRole.TECHNICIAN));
			case ADMIN -> new HashSet<>(Set.of(AppRole.ADMIN));
			case USER -> new HashSet<>(Set.of(AppRole.USER));
			default -> throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Unsupported account type.");
		};
		User u = new User();
		u.setEmail(req.email().trim().toLowerCase());
		u.setPasswordHash(passwordEncoder.encode(req.password()));
		u.setFullName(req.fullName().trim());
		u.setPhone(req.phone());
		u.setRoles(roles);
		userRepository.save(u);
		String token = jwtService.generateToken(u.getEmail());
		return new AuthResponse(token, new AuthResponse.UserSummary(u.getId(), u.getEmail(), u.getFullName(), u.getRoles()));
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest req) {
		String email = req.email().trim().toLowerCase();
		authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.password()));
		User u = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid credentials"));
		String token = jwtService.generateToken(u.getEmail());
		return new AuthResponse(token, new AuthResponse.UserSummary(u.getId(), u.getEmail(), u.getFullName(), u.getRoles()));
	}

	@Transactional
	public AuthResponse loginWithGoogle(GoogleLoginRequest req) {
		GoogleTokenService.VerifiedGoogleUser googleUser = googleTokenService.verifyIdToken(req.idToken().trim());
		AppRole portalRole = parsePortalRole(req.portal());
		User u = userRepository.findByEmailIgnoreCase(googleUser.email())
				.orElseGet(() -> {
					User fresh = new User();
					fresh.setEmail(googleUser.email());
					fresh.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
					fresh.setFullName(resolveDisplayName(googleUser));
					fresh.setRoles(new HashSet<>(Set.of(portalRole)));
					return userRepository.save(fresh);
				});
		applyPortalRoleIfNeeded(u, portalRole);
		String token = jwtService.generateToken(u.getEmail());
		return new AuthResponse(token, new AuthResponse.UserSummary(u.getId(), u.getEmail(), u.getFullName(), u.getRoles()));
	}

	private static AppRole parsePortalRole(String raw) {
		if (raw == null) {
			return AppRole.USER;
		}
		String v = raw.trim().toUpperCase();
		if (v.isEmpty()) {
			return AppRole.USER;
		}
		return switch (v) {
			case "ADMIN" -> AppRole.ADMIN;
			case "TECHNICIAN", "TECH" -> AppRole.TECHNICIAN;
			case "USER" -> AppRole.USER;
			default -> AppRole.USER;
		};
	}

	private void applyPortalRoleIfNeeded(User u, AppRole portalRole) {
		if (portalRole == AppRole.USER && u.getRoles().contains(AppRole.USER)) {
			return;
		}
		// Portal selection is treated as explicit active-role choice.
		if (!(u.getRoles().size() == 1 && u.getRoles().contains(portalRole))) {
			u.setRoles(new HashSet<>(Set.of(portalRole)));
			userRepository.save(u);
		}
	}

	private String resolveDisplayName(GoogleTokenService.VerifiedGoogleUser googleUser) {
		if (Objects.nonNull(googleUser.fullName()) && !googleUser.fullName().isBlank()) {
			return googleUser.fullName().trim();
		}
		String local = googleUser.email().split("@")[0].replace('.', ' ').replace('_', ' ').trim();
		if (local.isBlank()) {
			return "Campus User";
		}
		String[] parts = local.split("\\s+");
		StringBuilder sb = new StringBuilder();
		for (String p : parts) {
			if (p.isBlank()) {
				continue;
			}
			sb.append(Character.toUpperCase(p.charAt(0)));
			if (p.length() > 1) {
				sb.append(p.substring(1));
			}
			sb.append(' ');
		}
		return sb.toString().trim();
	}
}

//ppRole Enum and Role Entity/Model
//Implement Role Assignment in AuthService

//Integrate JWT Token Generation for OAuth Users 
// After successful OAuth login, generate a JWT token for the user.