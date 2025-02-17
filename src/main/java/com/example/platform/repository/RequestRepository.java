package com.example.platform.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.platform.model.Request;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByUserId(Long userId);
    List<Request> findByStatus(String status);
    
    @Query("SELECT r FROM Request r WHERE r.category = :category")
    List<Request> findByCategory(@Param("category") String category);
    
    @Query("SELECT r FROM Request r WHERE r.urgency = :urgency")
    List<Request> findByUrgency(@Param("urgency") String urgency);
    
    @Query("SELECT r FROM Request r WHERE r.status = :status AND r.category = :category")
    List<Request> findByStatusAndCategory(@Param("status") String status, @Param("category") String category);
    
    @Query("SELECT r FROM Request r WHERE r.user.id = :userId AND r.status = :status")
    List<Request> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    @Query(value = "SELECT * FROM requests r " +
           "WHERE ST_Distance_Sphere(" +
           "    point(r.longitude, r.latitude), " +
           "    point(:lon, :lat)" +
           ") <= :distance", 
           nativeQuery = true)
    List<Request> findNearbyRequests(@Param("lat") double lat, 
                                    @Param("lon") double lon, 
                                    @Param("distance") double distance);
}