package com.campus.hub.bootstrap;

import com.campus.hub.domain.AppRole;
import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import com.campus.hub.entity.BookableResource;
import com.campus.hub.entity.User;
import com.campus.hub.repository.BookableResourceRepository;
import com.campus.hub.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@Order(1)
@Profile("!test")
public class DataInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

	private final UserRepository userRepository;
	private final BookableResourceRepository resourceRepository;
	private final PasswordEncoder passwordEncoder;

	public DataInitializer(
			UserRepository userRepository,
			BookableResourceRepository resourceRepository,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.resourceRepository = resourceRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		seedUserIfMissing("admin@campus.edu", "System Admin", Set.of(AppRole.ADMIN));
		seedUserIfMissing("tech@campus.edu", "Alex Technician", Set.of(AppRole.TECHNICIAN));
		seedUserIfMissing("user@campus.edu", "Jamie Student", Set.of(AppRole.USER));
		if (resourceRepository.count() == 0) {
			resourceRepository.save(resource("Alpha Lecture Hall", ResourceType.LECTURE_HALL, 220, "Block A / Floor 2", "Mon–Fri 08:00–18:00"));
			resourceRepository.save(resource("Robotics Lab", ResourceType.LAB, 40, "Block C / Lab Wing", "Mon–Sat 09:00–20:00"));
			resourceRepository.save(resource("Innovation Meeting Room", ResourceType.MEETING_ROOM, 12, "Admin Building / Level 1", "Business hours"));
			resourceRepository.save(resource("4K Projector Kit", ResourceType.EQUIPMENT, 1, "AV Store / Shelf B", "Pickup 09:00–16:00"));
			log.info("Seeded demo bookable resources.");
		}
		log.info("Demo logins (password for all): ChangeMe123!");
	}

	private void seedUserIfMissing(String email, String fullName, Set<AppRole> roles) {
		if (userRepository.existsByEmailIgnoreCase(email)) {
			return;
		}
		User u = new User();
		u.setEmail(email);
		u.setFullName(fullName);
		u.setPasswordHash(passwordEncoder.encode("ChangeMe123!"));
		u.setRoles(roles);
		userRepository.save(u);
		log.info("Seeded user {}", email);
	}

	private static BookableResource resource(String name, ResourceType type, int cap, String loc, String windows) {
		BookableResource r = new BookableResource();
		r.setName(name);
		r.setType(type);
		r.setCapacity(cap);
		r.setLocation(loc);
		r.setAvailabilityWindows(windows);
		r.setStatus(ResourceStatus.ACTIVE);
		return r;
	}
}
//ppRole Enum and Role Entity/Model
//Implement Role Assignment in AuthService