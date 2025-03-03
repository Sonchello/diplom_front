package com.example.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
public class PlatformApplication {

	@Value("${file.upload-dir}")
	private String uploadDir;

	@PostConstruct
	public void init() {
		try {
			String cleanPath = uploadDir.trim(); // удаляем лишние пробелы
			Files.createDirectories(Paths.get(cleanPath));
		} catch (IOException e) {
			throw new RuntimeException("Could not create upload directory: " + e.getMessage());
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(PlatformApplication.class, args);
	}

}
