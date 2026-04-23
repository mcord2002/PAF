package com.campus.hub.controller;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import com.campus.hub.dto.resource.ResourceRequest;
import com.campus.hub.dto.resource.ResourceResponse;
import com.campus.hub.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// REST controller for managing facilities and assets (resources)
@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {

	// Service layer to handle business logic related to resources
	private final ResourceService resourceService;

	// Constructor injection
	public ResourceController(ResourceService resourceService) {
		this.resourceService = resourceService;
	}

	// Search and filter resources based on optional parameters
	@GetMapping
	public List<ResourceResponse> search(
			@RequestParam(required = false) String q, // search by name
			@RequestParam(required = false) ResourceType type, // filter by type
			@RequestParam(required = false) Integer minCapacity, // filter by minimum capacity
			@RequestParam(required = false) String location, // filter by location
			@RequestParam(required = false) ResourceStatus status) { // filter by status
		return resourceService.search(q, type, minCapacity, location, status);
	}

	// Get a single resource by its ID
	@GetMapping("/{id}")
	public ResourceResponse get(@PathVariable Long id) {
		return resourceService.get(id);
	}

	// Create a new resource (ADMIN only)
	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse create(@Valid @RequestBody ResourceRequest request) {
		return resourceService.create(request);
	}

	// Update an existing resource by ID (ADMIN only)
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse update(@PathVariable Long id, @Valid @RequestBody ResourceRequest request) {
		return resourceService.update(id, request);
	}

	// Delete a resource by ID (ADMIN only)
	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(@PathVariable Long id) {
		resourceService.delete(id);
	}
}