package com.example.platform.model;



import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;

import java.time.LocalDateTime;

import java.util.List;



@Entity

@Table(name = "requests")

public class Request {

    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;



    private String description;

    private Double latitude;

    private Double longitude;

    private String status;

    private String category;

    private String urgency;



    @ManyToOne

    @JoinColumn(name = "user_id")

    @JsonIgnoreProperties({"createdRequests", "helpedRequests"})

    private User user;



    @Column(name = "creation_date")

    private LocalDateTime creationDate;



    @ManyToMany(mappedBy = "helpedRequests")

    @JsonIgnoreProperties("helpedRequests")

    private List<User> helpers;



    public Long getId() {

        return id;

    }



    public void setId(Long id) {

        this.id = id;

    }



    public String getDescription() {

        return description;

    }



    public void setDescription(String description) {

        this.description = description;

    }



    public Double getLatitude() {

        return latitude;

    }



    public void setLatitude(Double latitude) {

        this.latitude = latitude;

    }



    public Double getLongitude() {

        return longitude;

    }



    public void setLongitude(Double longitude) {

        this.longitude = longitude;

    }



    public String getStatus() {

        return status;

    }



    public void setStatus(String status) {

        this.status = status;

    }



    public String getCategory() {

        return category;

    }



    public void setCategory(String category) {

        this.category = category;

    }



    public String getUrgency() {

        return urgency;

    }



    public void setUrgency(String urgency) {

        this.urgency = urgency;

    }



    public User getUser() {

        return user;

    }



    public void setUser(User user) {

        this.user = user;

    }



    public LocalDateTime getCreationDate() {

        return creationDate;

    }



    public void setCreationDate(LocalDateTime creationDate) {

        this.creationDate = creationDate;

    }



    public List<User> getHelpers() {

        return helpers;

    }



    public void setHelpers(List<User> helpers) {

        this.helpers = helpers;

    }



    public String getUserName() {

        return user != null ? user.getName() : "Аноним";

    }

}
