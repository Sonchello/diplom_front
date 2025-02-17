package com.example.platform.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.platform.model.Request;
import com.example.platform.service.RequestService;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/requests")
public class RequestController {
    @Autowired
    private RequestService requestService;

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("Received payload: " + payload);

            Long userId = Long.parseLong(payload.get("userId").toString());
            System.out.println("Parsed userId: " + userId);

            String description = (String) payload.get("description");
            String category = (String) payload.get("category");
            Double latitude = Double.parseDouble(payload.get("latitude").toString());
            Double longitude = Double.parseDouble(payload.get("longitude").toString());
            String urgency = (String) payload.get("urgency");

            Request request = new Request();
            request.setDescription(description);
            request.setCategory(category);
            request.setLatitude(latitude);
            request.setLongitude(longitude);
            request.setUrgency(urgency);

            Request createdRequest = requestService.createRequest(userId, request);
            return ResponseEntity.ok(createdRequest);
        } catch (Exception e) {
            System.err.println("Error in controller: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating request: " + e.getMessage());
        }
    }

    @GetMapping("/active")
    public List<Request> getActiveRequests() {
        return requestService.getActiveRequests();
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> deleteRequest(
            @PathVariable Long requestId,
            @RequestParam Long userId) {
        try {
            requestService.deleteRequest(requestId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{requestId}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long requestId,
            @RequestParam String status,
            @RequestParam Long userId) {
        try {
            Request updatedRequest = requestService.updateRequestStatus(requestId, status, userId);
            return ResponseEntity.ok(updatedRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{requestId}/help")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> payload) {
        try {
            Long userId = Long.parseLong(payload.get("userId").toString());
            requestService.respondToRequest(userId, requestId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserRequests(@PathVariable Long userId) {
        try {
            List<Request> requests = requestService.getUserRequests(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}/helped")
    public ResponseEntity<?> getHelpedRequestsByUser(@PathVariable Long userId) {
        try {
            List<Request> requests = requestService.getHelpedRequestsByUser(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterRequests(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String urgency,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double maxDistance,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLon) {
        try {
            List<Request> requests = requestService.filterRequests(
                    category, urgency, status, maxDistance, userLat, userLon);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}