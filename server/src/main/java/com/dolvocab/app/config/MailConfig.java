package com.dolvocab.app.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Slf4j
@Configuration
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);

        // Chuẩn hóa email tài khoản gửi
        String cleanUsername = username != null ? username.trim() : "";
        mailSender.setUsername(cleanUsername);

        // Tự động loại bỏ mọi khoảng trắng trong mật khẩu ứng dụng Gmail (Google App Password)
        // Ví dụ: 'uatb bbix lwff mlhb' -> 'uatbbbixlwffmlhb'
        String cleanPassword = password != null ? password.replaceAll("\\s+", "") : "";
        mailSender.setPassword(cleanPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        log.info("Khởi tạo cấu hình JavaMailSender: Host={}, Port={}, Username={}, SSL Trust={}",
                host, port, cleanUsername, host);

        return mailSender;
    }
}
