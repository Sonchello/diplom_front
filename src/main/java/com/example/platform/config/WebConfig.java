package com.example.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String path = uploadDir.startsWith("/") ? uploadDir.substring(1) : uploadDir;
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:./" + path + "/");
    }
} 