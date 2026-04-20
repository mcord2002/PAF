package com.campus.hub.repository;

import com.campus.hub.domain.AppRole;
import com.campus.hub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	List<User> findByRolesContains(AppRole role);
}


//Add Backend Endpoints for Role Management
//Create the backend API endpoints for updating and fetching user roles.
