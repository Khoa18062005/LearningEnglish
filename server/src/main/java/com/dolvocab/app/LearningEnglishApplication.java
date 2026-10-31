package com.dolvocab.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LearningEnglishApplication {

    public static void main(String[] args) {
        SpringApplication.run(LearningEnglishApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("🎉 SERVER BACKEND ĐÃ KHỞI ĐỘNG THÀNH CÔNG VÀ SẴN SÀNG HOẠT ĐỘNG! 🎉");
        System.out.println("👉 Cổng chạy: http://localhost:8080");
        System.out.println("👉 API Từ vựng:   http://localhost:8080/api/v1/vocabularies");
        System.out.println("👉 API Danh mục:  http://localhost:8080/api/v1/categories");
        System.out.println("👉 API Bài đọc:   http://localhost:8080/api/v1/note-lists");
        System.out.println("👉 Kết nối sẵn sàng với Client React tại: http://localhost:5173");
        System.out.println("=".repeat(70) + "\n");
    }
}
