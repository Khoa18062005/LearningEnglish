package com.dolvocab.app.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * DataSeeder: Đã tắt tự động tạo dữ liệu mẫu (mock data).
 * Hệ thống sẵn sàng lưu trữ và quản trị dữ liệu thực từ người dùng.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) {
        log.info("LinearVocab DataSeeder: Mock data seeding đã được tắt. Hệ thống sẵn sàng cho dữ liệu thực.");
    }
}
