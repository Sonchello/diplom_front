package com.example.platform.controller;

import com.example.platform.model.User;
import com.example.platform.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentUser(@RequestParam String email) {
        try {
            System.out.println("Getting current user for email: " + email);
            User user = userService.findByEmail(email);
            System.out.println("Found user: " + user.getId() + ", " + user.getEmail());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.err.println("Error getting current user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}/statistics")
    public Map<String, Object> getStatistics(@PathVariable Long userId) {
        return userService.getStatistics(userId);
    }

    @PutMapping("/{userId}/rating")
    public User updateRating(@PathVariable Long userId, @RequestParam Integer rating) {
        return userService.updateRating(userId, rating);
    }
} 