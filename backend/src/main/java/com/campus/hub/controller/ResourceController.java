package com.campus.hub.controller;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import com.campus.hub.dto.resource.ResourceRequest;
import com.campus.hub.dto.resource.ResourceResponse;
import com.campus.hub.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {

	private final ResourceService resourceService;

	public ResourceController(ResourceService resourceService) {
		this.resourceService = resourceService;
	}

	@GetMapping
	public List<ResourceResponse> search(
			@RequestParam(required = false) String q,
			@RequestParam(required = false) ResourceType type,
			@RequestParam(required = false) Integer minCapacity,
			@RequestParam(required = false) String location,
			@RequestParam(required = false) ResourceStatus status) {
		return resourceService.search(q, type, minCapacity, location, status);
	}

	@GetMapping("/{id}")
	public ResourceResponse get(@PathVariable Long id) {
		return resourceService.get(id);
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse create(@Valid @RequestBody ResourceRequest request) {
		return resourceService.create(request);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse update(@PathVariable Long id, @Valid @RequestBody ResourceRequest request) {
		return resourceService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(@PathVariable Long id) {
		resourceService.delete(id);
	}
}
