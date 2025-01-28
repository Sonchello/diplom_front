package com.example.platform.controller;

import com.example.platform.model.Request;
import com.example.platform.model.User;
import com.example.platform.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/{requestId}/respond")
    public ResponseEntity<?> respondToRequest(@RequestParam Long userId, @PathVariable Long requestId) {
        try {
            requestService.respondToRequest(userId, requestId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}/helped")
    public List<Request> getHelpedRequestsByUser(@PathVariable Long userId) {
        return requestService.getHelpedRequestsByUser(userId);
    }
} 