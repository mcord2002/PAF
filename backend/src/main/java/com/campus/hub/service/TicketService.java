package com.campus.hub.service;

import com.campus.hub.domain.AppRole;
import com.campus.hub.domain.NotificationType;
import com.campus.hub.domain.TicketStatus;
import com.campus.hub.dto.ticket.AssignTicketRequest;
import com.campus.hub.dto.ticket.CommentRequest;
import com.campus.hub.dto.ticket.CommentResponse;
import com.campus.hub.dto.ticket.RejectTicketRequest;
import com.campus.hub.dto.ticket.TicketAttachmentResponse;
import com.campus.hub.dto.ticket.TicketCreateRequest;
import com.campus.hub.dto.ticket.TicketResponse;
import com.campus.hub.dto.ticket.TicketStatusUpdateRequest;
import com.campus.hub.entity.BookableResource;
import com.campus.hub.entity.IncidentTicket;
import com.campus.hub.entity.TicketAttachment;
import com.campus.hub.entity.TicketComment;
import com.campus.hub.entity.User;
import com.campus.hub.exception.ApiException;
import com.campus.hub.repository.IncidentTicketRepository;
import com.campus.hub.repository.TicketAttachmentRepository;
import com.campus.hub.repository.TicketCommentRepository;
import com.campus.hub.repository.UserRepository;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class TicketService {

	public static final int MAX_ATTACHMENTS = 3;

	private final IncidentTicketRepository ticketRepository;
	private final TicketAttachmentRepository attachmentRepository;
	private final TicketCommentRepository commentRepository;
	private final UserRepository userRepository;
	private final ResourceService resourceService;
	private final FileStorageService fileStorageService;
	private final NotificationService notificationService;

	public TicketService(
			IncidentTicketRepository ticketRepository,
			TicketAttachmentRepository attachmentRepository,
			TicketCommentRepository commentRepository,
			UserRepository userRepository,
			ResourceService resourceService,
			FileStorageService fileStorageService,
			NotificationService notificationService) {
		this.ticketRepository = ticketRepository;
		this.attachmentRepository = attachmentRepository;
		this.commentRepository = commentRepository;
		this.userRepository = userRepository;
		this.resourceService = resourceService;
		this.fileStorageService = fileStorageService;
		this.notificationService = notificationService;
	}

	@Transactional
	public TicketResponse create(User reporter, TicketCreateRequest req) {
		IncidentTicket t = new IncidentTicket();
		t.setReporter(reporter);
		if (req.resourceId() != null) {
			BookableResource r = resourceService.require(req.resourceId());
			t.setResource(r);
		}
		t.setLocationText(req.locationText());
		t.setCategory(req.category().trim());
		t.setDescription(req.description().trim());
		t.setPriority(req.priority());
		t.setContactEmail(req.contactEmail());
		t.setContactPhone(req.contactPhone());
		t.setStatus(TicketStatus.OPEN);
		t = ticketRepository.save(t);
		notifyAdminsOfNewTicket(t);
		return DtoMapper.toTicket(t);
	}

	@Transactional(readOnly = true)
	public TicketResponse get(User actor, Long ticketId) {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		return DtoMapper.toTicket(t);
	}

	@Transactional(readOnly = true)
	public List<TicketResponse> listFor(User actor, String scope) {
		if (actor.getRoles().contains(AppRole.ADMIN)) {
			if ("mine".equalsIgnoreCase(scope)) {
				return ticketRepository.findByReporterIdOrderByUpdatedAtDesc(actor.getId()).stream()
						.map(DtoMapper::toTicket)
						.toList();
			}
			if ("assigned".equalsIgnoreCase(scope)) {
				return ticketRepository.findByAssigneeIdOrderByUpdatedAtDesc(actor.getId()).stream()
						.map(DtoMapper::toTicket)
						.toList();
			}
			return ticketRepository.findAll().stream()
					.sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
					.map(DtoMapper::toTicket)
					.toList();
		}
		if (actor.getRoles().contains(AppRole.TECHNICIAN)) {
			return ticketRepository.findByAssigneeIdOrderByUpdatedAtDesc(actor.getId()).stream()
					.map(DtoMapper::toTicket)
					.toList();
		}
		return ticketRepository.findByReporterIdOrderByUpdatedAtDesc(actor.getId()).stream()
				.map(DtoMapper::toTicket)
				.toList();
	}

	@Transactional
	public TicketResponse assign(User admin, Long ticketId, AssignTicketRequest req) {
		requireRole(admin, AppRole.ADMIN);
		IncidentTicket t = loadTicket(ticketId);
		User assignee = userRepository.findById(req.assigneeUserId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Assignee not found"));
		if (!assignee.getRoles().contains(AppRole.TECHNICIAN)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE", "Assignee must be a technician.");
		}
		t.setAssignee(assignee);
		touch(t);
		ticketRepository.save(t);
		notificationService.notifyUser(
				assignee,
				NotificationType.TICKET_STATUS,
				"Ticket assigned",
				"You were assigned ticket #" + t.getId() + ": " + t.getCategory(),
				t.getId());
		return DtoMapper.toTicket(t);
	}

	@Transactional
	public TicketResponse updateStatus(User actor, Long ticketId, TicketStatusUpdateRequest req) {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		TicketStatus next = req.status();
		if (!isTransitionAllowed(actor, t, next)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TRANSITION", "Status transition is not allowed.");
		}
		if (next == TicketStatus.REJECTED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "USE_REJECT_ENDPOINT", "Use the reject endpoint to reject a ticket.");
		}
		t.setStatus(next);
		if (req.resolutionNotes() != null && !req.resolutionNotes().isBlank()) {
			String existing = t.getResolutionNotes() == null ? "" : t.getResolutionNotes();
			String add = req.resolutionNotes().trim();
			t.setResolutionNotes(existing.isEmpty() ? add : existing + "\n" + add);
		}
		touch(t);
		ticketRepository.save(t);
		notifyTicketParticipants(actor, t, "Ticket updated", "Ticket #" + t.getId() + " status is now " + next);
		return DtoMapper.toTicket(t);
	}

	@Transactional
	public TicketResponse reject(User admin, Long ticketId, RejectTicketRequest req) {
		requireRole(admin, AppRole.ADMIN);
		IncidentTicket t = loadTicket(ticketId);
		if (t.getStatus() == TicketStatus.CLOSED || t.getStatus() == TicketStatus.REJECTED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE", "Ticket is already closed or rejected.");
		}
		t.setStatus(TicketStatus.REJECTED);
		t.setRejectionReason(req.reason().trim());
		touch(t);
		ticketRepository.save(t);
		notificationService.notifyUser(
				t.getReporter(),
				NotificationType.TICKET_STATUS,
				"Ticket rejected",
				"Ticket #" + t.getId() + " was rejected. Reason: " + req.reason().trim(),
				t.getId());
		return DtoMapper.toTicket(t);
	}

	@Transactional(readOnly = true)
	public List<TicketAttachmentResponse> listAttachments(User actor, Long ticketId) {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		return attachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
				.map(DtoMapper::toAttachment)
				.toList();
	}

	@Transactional
	public TicketAttachmentResponse addAttachment(User actor, Long ticketId, MultipartFile file) throws IOException {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		long count = attachmentRepository.countByTicketId(ticketId);
		if (count >= MAX_ATTACHMENTS) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "ATTACHMENT_LIMIT", "Maximum of " + MAX_ATTACHMENTS + " attachments per ticket.");
		}
		FileStorageService.StoredFile stored = fileStorageService.saveTicketAttachment(ticketId, file);
		TicketAttachment a = new TicketAttachment();
		a.setTicket(t);
		a.setStoredFileName(stored.storedFileName());
		a.setOriginalFileName(stored.originalFileName());
		a.setContentType(stored.contentType());
		a.setSizeBytes(stored.sizeBytes());
		a.setUploadedBy(actor);
		return DtoMapper.toAttachment(attachmentRepository.save(a));
	}

	@Transactional(readOnly = true)
	public ResourceWithStream downloadAttachment(User actor, Long ticketId, Long attachmentId) throws IOException {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		TicketAttachment a = attachmentRepository.findById(attachmentId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Attachment not found"));
		if (!Objects.equals(a.getTicket().getId(), ticketId)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Attachment not found");
		}
		Path path = fileStorageService.resolveAttachmentPath(ticketId, a.getStoredFileName());
		if (!Files.exists(path)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "FILE_MISSING", "Stored file is missing.");
		}
		InputStream in = Files.newInputStream(path);
		return new ResourceWithStream(new InputStreamResource(in), a.getContentType(), a.getOriginalFileName());
	}

	@Transactional(readOnly = true)
	public List<CommentResponse> listComments(User actor, Long ticketId) {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
				.map(DtoMapper::toComment)
				.toList();
	}

	@Transactional
	public CommentResponse addComment(User actor, Long ticketId, CommentRequest req) {
		IncidentTicket t = loadTicket(ticketId);
		assertCanView(actor, t);
		TicketComment c = new TicketComment();
		c.setTicket(t);
		c.setAuthor(actor);
		c.setBody(req.body().trim());
		c = commentRepository.save(c);
		if (!Objects.equals(t.getReporter().getId(), actor.getId())) {
			notificationService.notifyUser(
					t.getReporter(),
					NotificationType.TICKET_COMMENT,
					"New comment on your ticket",
					"Ticket #" + t.getId() + " has a new comment.",
					t.getId());
		}
		if (t.getAssignee() != null && !Objects.equals(t.getAssignee().getId(), actor.getId())) {
			notificationService.notifyUser(
					t.getAssignee(),
					NotificationType.TICKET_COMMENT,
					"New comment on assigned ticket",
					"Ticket #" + t.getId() + " has a new comment.",
					t.getId());
		}
		return DtoMapper.toComment(c);
	}

	@Transactional
	public CommentResponse updateComment(User actor, Long commentId, CommentRequest req) {
		TicketComment c = commentRepository.findById(commentId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Comment not found"));
		if (!Objects.equals(c.getAuthor().getId(), actor.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You can only edit your own comments.");
		}
		c.setBody(req.body().trim());
		c.setUpdatedAt(Instant.now());
		return DtoMapper.toComment(commentRepository.save(c));
	}

	@Transactional
	public void deleteComment(User actor, Long commentId) {
		TicketComment c = commentRepository.findById(commentId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Comment not found"));
		boolean owner = Objects.equals(c.getAuthor().getId(), actor.getId());
		boolean admin = actor.getRoles().contains(AppRole.ADMIN);
		if (!owner && !admin) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot delete this comment.");
		}
		commentRepository.delete(c);
	}

	public record ResourceWithStream(org.springframework.core.io.Resource resource, String contentType, String filename) {
	}

	private IncidentTicket loadTicket(Long id) {
		return ticketRepository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Ticket not found"));
	}

	private void assertCanView(User actor, IncidentTicket t) {
		boolean reporter = Objects.equals(t.getReporter().getId(), actor.getId());
		boolean assignee = t.getAssignee() != null && Objects.equals(t.getAssignee().getId(), actor.getId());
		boolean admin = actor.getRoles().contains(AppRole.ADMIN);
		if (!(reporter || assignee || admin)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot access this ticket.");
		}
	}

	private boolean isTransitionAllowed(User actor, IncidentTicket t, TicketStatus next) {
		TicketStatus cur = t.getStatus();
		if (cur == next) {
			return true;
		}
		boolean admin = actor.getRoles().contains(AppRole.ADMIN);
		boolean tech = actor.getRoles().contains(AppRole.TECHNICIAN);
		boolean assigneeOk = t.getAssignee() != null && Objects.equals(t.getAssignee().getId(), actor.getId());

		Set<TicketStatus> allowed = allowedTargets(cur);
		if (!allowed.contains(next)) {
			return false;
		}
		if (admin) {
			return true;
		}
		if (tech && assigneeOk) {
			return technicianAllowed(cur, next);
		}
		return false;
	}

	private static boolean technicianAllowed(TicketStatus cur, TicketStatus next) {
		return (cur == TicketStatus.OPEN && next == TicketStatus.IN_PROGRESS)
				|| (cur == TicketStatus.IN_PROGRESS && next == TicketStatus.RESOLVED)
				|| (cur == TicketStatus.IN_PROGRESS && next == TicketStatus.OPEN);
	}

	private static Set<TicketStatus> allowedTargets(TicketStatus cur) {
		return switch (cur) {
			case OPEN -> Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED);
			case IN_PROGRESS -> Set.of(TicketStatus.RESOLVED, TicketStatus.OPEN);
			case RESOLVED -> Set.of(TicketStatus.CLOSED);
			case CLOSED, REJECTED -> Set.of();
		};
	}

	private void notifyTicketParticipants(User actor, IncidentTicket t, String title, String message) {
		if (!Objects.equals(t.getReporter().getId(), actor.getId())) {
			notificationService.notifyUser(t.getReporter(), NotificationType.TICKET_STATUS, title, message, t.getId());
		}
		if (t.getAssignee() != null && !Objects.equals(t.getAssignee().getId(), actor.getId())) {
			notificationService.notifyUser(t.getAssignee(), NotificationType.TICKET_STATUS, title, message, t.getId());
		}
	}

	private static void touch(IncidentTicket t) {
		t.setUpdatedAt(Instant.now());
	}

	private static void requireRole(User u, AppRole role) {
		if (!u.getRoles().contains(role)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Admin access required.");
		}
	}

	
	}
}
