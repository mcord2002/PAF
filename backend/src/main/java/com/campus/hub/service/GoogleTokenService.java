package com.campus.hub.service;

import com.campus.hub.exception.ApiException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class GoogleTokenService {

	private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

	private final RestClient restClient;
	private final String googleClientId;

	public GoogleTokenService(
			@Value("${campus-hub.oauth.google.client-id:}") String googleClientId) {
		this.restClient = RestClient.builder().baseUrl(TOKEN_INFO_URL).build();
		this.googleClientId = googleClientId;
	}

	public VerifiedGoogleUser verifyIdToken(String idToken) {
		if (!StringUtils.hasText(googleClientId)) {
			throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "GOOGLE_OAUTH_NOT_CONFIGURED",
					"Google OAuth is not configured on the server.");
		}
		TokenInfoResponse tokenInfo;
		try {
			tokenInfo = restClient.get()
					.uri(uriBuilder -> uriBuilder.queryParam("id_token", idToken).build())
					.retrieve()
					.body(TokenInfoResponse.class);
		}
		catch (RestClientException ex) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google ID token.");
		}
		if (tokenInfo == null || !StringUtils.hasText(tokenInfo.email())) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google ID token.");
		}
		if (!tokenInfo.isEmailVerified()) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "UNVERIFIED_GOOGLE_EMAIL", "Google email is not verified.");
		}
		if (!googleClientId.equals(tokenInfo.aud())) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "GOOGLE_AUDIENCE_MISMATCH", "Google token audience mismatch.");
		}
		return new VerifiedGoogleUser(tokenInfo.email().trim().toLowerCase(), tokenInfo.name());
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	private record TokenInfoResponse(
			@JsonProperty("aud") String aud,
			@JsonProperty("email") String email,
			@JsonProperty("email_verified") Object emailVerified,
			@JsonProperty("name") String name) {
		boolean isEmailVerified() {
			if (emailVerified == null) {
				return false;
			}
			if (emailVerified instanceof Boolean b) {
				return b;
			}
			return "true".equalsIgnoreCase(String.valueOf(emailVerified));
		}
	}

	public record VerifiedGoogleUser(String email, String fullName) {
	}
}
