package com.campus.hub.repository;

import com.campus.hub.entity.BookableResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BookableResourceRepository extends JpaRepository<BookableResource, Long>, JpaSpecificationExecutor<BookableResource> {
}
