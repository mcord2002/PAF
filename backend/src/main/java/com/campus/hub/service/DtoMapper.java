package com.campus.hub.service;

// Import DTO classes (used to send data to frontend)
import com.campus.hub.dto.booking.BookingResponse;
import com.campus.hub.dto.notification.NotificationResponse;
import com.campus.hub.dto.resource.ResourceResponse;
import com.campus.hub.dto.ticket.CommentResponse;
import com.campus.hub.dto.ticket.TicketAttachmentResponse;
import com.campus.hub.dto.ticket.TicketResponse;

// Import entity classes (database models)
import com.campus.hub.entity.BookableResource;
import com.campus.hub.entity.Booking;
import com.campus.hub.entity.HubNotification;
import com.campus.hub.entity.IncidentTicket;
import com.campus.hub.entity.TicketAttachment;
import com.campus.hub.entity.TicketComment;
import com.campus.hub.entity.User;

// Utility class for converting Entities -> DTOs
public final class DtoMapper {

    // Private constructor to prevent object creation (utility class)
    private DtoMapper() {
    }

    // Convert BookableResource entity to ResourceResponse DTO
    public static ResourceResponse toResource(BookableResource r) {
        return new ResourceResponse(
                r.getId(), // Resource ID
                r.getName(), // Resource name
                r.getType(), // Resource type (enum)
                r.getCapacity(), // Capacity
                r.getLocation(), // Location
                r.getAvailabilityWindows(), // Availability info
                r.getStatus()); // Current status
    }

    // Convert Booking entity to BookingResponse DTO
    public static BookingResponse toBooking(Booking b) {

        // Get related requester (User)
        User req = b.getRequester();

        // Get related resource
        BookableResource res = b.getResource();

        return new BookingResponse(
                b.getId(), // Booking ID
                req.getId(), // Requester ID
                req.getFullName(), // Requester name
                toResource(res), // Nested resource DTO
                b.getStartAt(), // Start time
                b.getEndAt(), // End time
                b.getPurpose(), // Purpose
                b.getExpectedAttendees(), // Expected attendees
                b.getStatus(), // Booking status
                b.getAdminReason(), // Admin reason (if rejected)
                b.getReviewedBy() != null ? b.getReviewedBy().getId() : null, // Reviewer ID (nullable)
                b.getReviewedAt(), // Review timestamp
                b.getCreatedAt()); // Creation timestamp
    }

    // Convert IncidentTicket entity to TicketResponse DTO
    public static TicketResponse toTicket(IncidentTicket t) {
        return new TicketResponse(
                t.getId(), // Ticket ID
                t.getReporter().getId(), // Reporter ID
                t.getReporter().getFullName(), // Reporter name
                t.getAssignee() != null ? t.getAssignee().getId() : null, // Assignee ID (nullable)
                t.getAssignee() != null ? t.getAssignee().getFullName() : null, // Assignee name (nullable)
                t.getResource() != null ? toResource(t.getResource()) : null, // Related resource (nullable)
                t.getLocationText(), // Location description
                t.getCategory(), // Ticket category
                t.getDescription(), // Issue description
                t.getPriority(), // Priority level
                t.getStatus(), // Ticket status
                t.getContactEmail(), // Contact email
                t.getContactPhone(), // Contact phone
                t.getResolutionNotes(), // Resolution notes (if resolved)
                t.getRejectionReason(), // Rejection reason (if rejected)
                t.getCreatedAt(), // Created timestamp
                t.getUpdatedAt()); // Last updated timestamp
    }

    // Convert TicketAttachment entity to TicketAttachmentResponse DTO
    public static TicketAttachmentResponse toAttachment(TicketAttachment a) {
        return new TicketAttachmentResponse(
                a.getId(), // Attachment ID
                a.getOriginalFileName(), // Original file name
                a.getContentType(), // MIME type (e.g., image/png)
                a.getSizeBytes(), // File size in bytes
                a.getUploadedBy().getId(), // Uploader user ID
                a.getCreatedAt()); // Upload timestamp
    }

    // Convert TicketComment entity to CommentResponse DTO
    public static CommentResponse toComment(TicketComment c) {
        return new CommentResponse(
                c.getId(), // Comment ID
                c.getTicket().getId(), // Related ticket ID
                c.getAuthor().getId(), // Author user ID
                c.getAuthor().getFullName(), // Author name
                c.getBody(), // Comment text
                c.getCreatedAt(), // Created timestamp
                c.getUpdatedAt()); // Updated timestamp
    }

    // Convert HubNotification entity to NotificationResponse DTO
    public static NotificationResponse toNotification(HubNotification n) {
        return new NotificationResponse(
                n.getId(), // Notification ID
                n.getType(), // Notification type (enum)
                n.getTitle(), // Title
                n.getMessage(), // Message content
                n.getRelatedEntityId(), // Related entity (e.g., booking ID)
                n.isReadFlag(), // Read/unread status
                n.getCreatedAt()); // Created timestamp
    }
}