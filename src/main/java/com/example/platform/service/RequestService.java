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

            // Проверим, есть ли пользователи вообще
            List<User> allUsers = userRepository.findAll();
            System.out.println("Total users in database: " + allUsers.size());
            if (!allUsers.isEmpty()) {
                System.out.println("Example user: ID=" + allUsers.get(0).getId() + ", Email=" + allUsers.get(0).getEmail());
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
    public void respondToRequest(Long userId, Long requestId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        user.getHelpedRequests().add(request);
        userRepository.save(user);
    }

    public List<Request> getHelpedRequestsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getHelpedRequests();
    }
}