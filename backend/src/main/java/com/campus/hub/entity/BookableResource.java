package com.campus.hub.entity;

// Importing enum types for resource status and type
import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;

// JPA annotations for mapping class to database
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Marks this class as a JPA entity (table in database)
@Entity

// Specifies the table name in the database
@Table(name = "bookable_resources")
public class BookableResource {

    // Primary key of the table
    @Id

    // Auto-increment ID generation strategy
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Resource name (cannot be null, max length 200)
    @Column(nullable = false, length = 200)
    private String name;

    // Enum stored as STRING in database (e.g., ROOM, LAB, etc.)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ResourceType type;

    // Maximum number of people/resource capacity
    @Column(nullable = false)
    private Integer capacity;

    // Location of the resource (cannot be null, max length 300)
    @Column(nullable = false, length = 300)
    private String location;

    /**
     * Optional field:
     * Can store JSON or plain text describing
     * available time windows (e.g., "9AM-5PM")
     */
    @Column(name = "availability_windows", length = 2000)
    private String availabilityWindows;

    // Status of the resource (default = ACTIVE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ResourceStatus status = ResourceStatus.ACTIVE;

    // Getter for ID
    public Long getId() {
        return id;
    }

    // Setter for ID
    public void setId(Long id) {
        this.id = id;
    }

    // Getter for name
    public String getName() {
        return name;
    }

    // Setter for name
    public void setName(String name) {
        this.name = name;
    }

    // Getter for resource type
    public ResourceType getType() {
        return type;
    }

    // Setter for resource type
    public void setType(ResourceType type) {
        this.type = type;
    }

    // Getter for capacity
    public Integer getCapacity() {
        return capacity;
    }

    // Setter for capacity
    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    // Getter for location
    public String getLocation() {
        return location;
    }

    // Setter for location
    public void setLocation(String location) {
        this.location = location;
    }

    // Getter for availability windows
    public String getAvailabilityWindows() {
        return availabilityWindows;
    }

    // Setter for availability windows
    public void setAvailabilityWindows(String availabilityWindows) {
        this.availabilityWindows = availabilityWindows;
    }

    // Getter for status
    public ResourceStatus getStatus() {
        return status;
    }

    // Setter for status
    public void setStatus(ResourceStatus status) {
        this.status = status;
    }
}