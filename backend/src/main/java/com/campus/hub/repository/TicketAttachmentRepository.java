package com.campus.hub.repository;

import com.campus.hub.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

	long countByTicketId(Long ticketId);

	List<TicketAttachment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
