package com.campus.hub.service;

// Import enums for filtering and status handling
import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;

// Import DTOs
import com.campus.hub.dto.resource.ResourceRequest;
import com.campus.hub.dto.resource.ResourceResponse;

// Import entity
import com.campus.hub.entity.BookableResource;

// Custom exception
import com.campus.hub.exception.ApiException;

// Repository and specification for DB queries
import com.campus.hub.repository.BookableResourceRepository;
import com.campus.hub.repository.BookableResourceSpecifications;

// Spring Data and transaction management
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Marks this class as a service layer component
@Service
public class ResourceService {

    // Repository for accessing BookableResource data
    private final BookableResourceRepository resourceRepository;

    // Constructor injection
    public ResourceService(BookableResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // Search resources with filters
    @Transactional(readOnly = true)
    public List<ResourceResponse> search(String q, ResourceType type, Integer minCapacity, String location,
            ResourceStatus status) {

        // Build dynamic query specification using filters
        Specification<BookableResource> spec = BookableResourceSpecifications.filter(q, type, minCapacity, location,
                status);

        // Execute query with sorting by name (ascending)
        return resourceRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "name")).stream()

                // Convert entity to DTO
                .map(DtoMapper::toResource)

                // Collect results as list
                .toList();
    }

    // Get a single resource by ID
    @Transactional(readOnly = true)
    public ResourceResponse get(Long id) {

        // Find resource or throw exception if not found
        BookableResource r = resourceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found"));

        // Convert to DTO
        return DtoMapper.toResource(r);
    }

    // Create a new resource
    @Transactional
    public ResourceResponse create(ResourceRequest req) {

        // Create new entity object
        BookableResource r = new BookableResource();

        // Apply request data to entity
        apply(r, req);

        // Save to database and return DTO
        return DtoMapper.toResource(resourceRepository.save(r));
    }

    // Update existing resource
    @Transactional
    public ResourceResponse update(Long id, ResourceRequest req) {

        // Find existing resource or throw exception
        BookableResource r = resourceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found"));

        // Apply updated values
        apply(r, req);

        // Save updated entity and return DTO
        return DtoMapper.toResource(resourceRepository.save(r));
    }

    // Delete resource by ID
    @Transactional
    public void delete(Long id) {

        // Check if resource exists
        if (!resourceRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found");
        }

        // Delete resource from database
        resourceRepository.deleteById(id);
    }

    // Helper method to map request data to entity
    private static void apply(BookableResource r, ResourceRequest req) {

        // Set name (trim to remove extra spaces)
        r.setName(req.name().trim());

        // Set resource type
        r.setType(req.type());

        // Set capacity
        r.setCapacity(req.capacity());

        // Set location (trimmed)
        r.setLocation(req.location().trim());

        // Set availability info
        r.setAvailabilityWindows(req.availabilityWindows());

        // Set status (default to ACTIVE if null)
        r.setStatus(req.status() != null ? req.status() : ResourceStatus.ACTIVE);
    }

    // Get resource entity directly (used internally)
    @Transactional(readOnly = true)
    public BookableResource require(Long id) {

        // Return resource or throw exception if not found
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found"));
    }
}