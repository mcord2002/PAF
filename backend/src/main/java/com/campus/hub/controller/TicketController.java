package com.campus.hub.controller;

import com.campus.hub.dto.ticket.AssignTicketRequest;
import com.campus.hub.dto.ticket.CommentRequest;
import com.campus.hub.dto.ticket.CommentResponse;
import com.campus.hub.dto.ticket.RejectTicketRequest;
import com.campus.hub.dto.ticket.TicketAttachmentResponse;
import com.campus.hub.dto.ticket.TicketCreateRequest;
import com.campus.hub.dto.ticket.TicketResponse;
import com.campus.hub.dto.ticket.TicketStatusUpdateRequest;
import com.campus.hub.security.SecurityUtils;
import com.campus.hub.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

	private final TicketService ticketService;
	private final SecurityUtils securityUtils;

	public TicketController(TicketService ticketService, SecurityUtils securityUtils) {
		this.ticketService = ticketService;
		this.securityUtils = securityUtils;
	}

	@PostMapping
	@PreAuthorize("hasAnyRole('USER','ADMIN')")
	public TicketResponse create(@Valid @RequestBody TicketCreateRequest request) {
		return ticketService.create(securityUtils.currentUser(), request);
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public List<TicketResponse> list(@RequestParam(required = false, defaultValue = "mine") String scope) {
		return ticketService.listFor(securityUtils.currentUser(), scope);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public TicketResponse get(@PathVariable Long id) {
		return ticketService.get(securityUtils.currentUser(), id);
	}

	@PatchMapping("/{id}/assign")
	@PreAuthorize("hasRole('ADMIN')")
	public TicketResponse assign(@PathVariable Long id, @Valid @RequestBody AssignTicketRequest request) {
		return ticketService.assign(securityUtils.currentUser(), id, request);
	}

	@PatchMapping("/{id}/status")
	@PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
	public TicketResponse updateStatus(@PathVariable Long id, @Valid @RequestBody TicketStatusUpdateRequest request) {
		return ticketService.updateStatus(securityUtils.currentUser(), id, request);
	}

	@PatchMapping("/{id}/reject")
	@PreAuthorize("hasRole('ADMIN')")
	public TicketResponse reject(@PathVariable Long id, @Valid @RequestBody RejectTicketRequest request) {
		return ticketService.reject(securityUtils.currentUser(), id, request);
	}

	@GetMapping("/{id}/attachments")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public List<TicketAttachmentResponse> listAttachments(@PathVariable Long id) {
		return ticketService.listAttachments(securityUtils.currentUser(), id);
	}

	@PostMapping(path = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public TicketAttachmentResponse uploadAttachment(
			@PathVariable Long id,
			@RequestPart("file") MultipartFile file) throws IOException {
		return ticketService.addAttachment(securityUtils.currentUser(), id, file);
	}

	@GetMapping("/{id}/attachments/{attachmentId}/file")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id, @PathVariable Long attachmentId) throws IOException {
		TicketService.ResourceWithStream payload = ticketService.downloadAttachment(securityUtils.currentUser(), id, attachmentId);
		String encoded = URLEncoder.encode(payload.filename(), StandardCharsets.UTF_8).replace("+", "%20");
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encoded + "\"")
				.contentType(MediaType.parseMediaType(payload.contentType()))
				.body(payload.resource());
	}

	@GetMapping("/{id}/comments")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public List<CommentResponse> listComments(@PathVariable Long id) {
		return ticketService.listComments(securityUtils.currentUser(), id);
	}

	@PostMapping("/{id}/comments")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public CommentResponse addComment(@PathVariable Long id, @Valid @RequestBody CommentRequest request) {
		return ticketService.addComment(securityUtils.currentUser(), id, request);
	}

	@PutMapping("/comments/{commentId}")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public CommentResponse updateComment(@PathVariable Long commentId, @Valid @RequestBody CommentRequest request) {
		return ticketService.updateComment(securityUtils.currentUser(), commentId, request);
	}

	@DeleteMapping("/comments/{commentId}")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public void deleteComment(@PathVariable Long commentId) {
		ticketService.deleteComment(securityUtils.currentUser(), commentId);
	}
}
