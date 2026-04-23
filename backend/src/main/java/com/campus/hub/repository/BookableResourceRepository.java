package com.campus.hub.repository;

import com.campus.hub.entity.BookableResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

// Repository interface for accessing BookableResource data from the database
public interface BookableResourceRepository extends JpaRepository<BookableResource, Long>, JpaSpecificationExecutor<BookableResource> {

	// JpaRepository provides basic CRUD operations:
	// - save()
	// - findById()
	// - findAll()
	// - deleteById()
	// - etc.

	// JpaSpecificationExecutor allows advanced dynamic filtering using Specifications:
	// - useful for search functionality (e.g., filter by type, capacity, location, status)
}