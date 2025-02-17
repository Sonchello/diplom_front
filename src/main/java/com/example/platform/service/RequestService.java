package com.example.platform.service;

import com.example.platform.model.Request;
import com.example.platform.model.User;
import com.example.platform.repository.RequestRepository;
import com.example.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RequestService {
    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Request createRequest(Long userId, Request request) {
        try {
            System.out.println("Creating request for userId: " + userId);

            if (userId == null || userId == 0) {
                throw new RuntimeException("Invalid userId: " + userId);
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        System.out.println("User not found for id: " + userId);
                        return new RuntimeException("User not found for id: " + userId);
                    });

            System.out.println("Found user: " + user.getId() + ", " + user.getEmail());

            request.setUser(user);
            request.setCreationDate(LocalDateTime.now());
            request.setStatus("ACTIVE");

            if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
                throw new RuntimeException("Description is required");
            }
            if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
                throw new RuntimeException("Category is required");
            }

            Request savedRequest = requestRepository.save(request);
            System.out.println("Request saved successfully with id: " + savedRequest.getId());
            return savedRequest;
        } catch (Exception e) {
            System.err.println("Error in createRequest: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error creating request: " + e.getMessage());
        }
    }

    public List<Request> getActiveRequests() {
        return requestRepository.findByStatus("ACTIVE");
    }

    @Transactional
    public void deleteRequest(Long requestId, Long userId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own requests");
        }

        requestRepository.delete(request);
    }

    @Transactional
    public Request updateRequestStatus(Long requestId, String status, Long userId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own requests");
        }

        request.setStatus(status);
        return requestRepository.save(request);
    }

    @Transactional
    public void respondToRequest(Long userId, Long requestId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getUser().getId().equals(userId)) {
            throw new RuntimeException("You cannot help your own request");
        }

        if (!request.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("This request is no longer active");
        }

        if (request.getHelpers() != null && request.getHelpers().stream()
                .anyMatch(helper -> helper.getId().equals(userId))) {
            throw new RuntimeException("You have already helped with this request");
        }

        user.getHelpedRequests().add(request);
        request.setStatus("COMPLETED");
        userRepository.save(user);
        requestRepository.save(request);
    }

    public List<Request> getUserRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return requestRepository.findByUserId(userId);
    }

    public List<Request> getHelpedRequestsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getHelpedRequests();
    }

    public List<Request> filterRequests(String category, String urgency, String status, Double maxDistance, 
                                      Double userLat, Double userLon) {
        List<Request> requests = requestRepository.findAll();
        
        return requests.stream()
                .filter(request -> {
                    boolean matches = true;
                    
                    if (category != null && !category.equals("all")) {
                        matches = matches && request.getCategory().equals(category);
                    }
                    
                    if (urgency != null && !urgency.equals("all")) {
                        matches = matches && request.getUrgency().equals(urgency);
                    }
                    
                    if (status != null) {
                        matches = matches && request.getStatus().equals(status);
                    }
                    
                    if (maxDistance != null && userLat != null && userLon != null) {
                        double distance = calculateDistance(userLat, userLon, 
                                request.getLatitude(), request.getLongitude());
                        matches = matches && distance <= maxDistance;
                    }
                    
                    return matches;
                })
                .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Радиус Земли в километрах

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}