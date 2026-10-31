package com.dolvocab.app.service.impl;

import com.dolvocab.app.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@linearvocab.com}")
    private String fromEmail;

    @Value("${app.name:LinearVocab LMS}")
    private String appName;

    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        log.info("==================================================");
        log.info(">>> [OTP NOTIFICATION] Gửi mã OTP tới: {}", toEmail);
        log.info(">>> MÃ OTP 6 CHỮ SỐ LÀ: [ {} ] (Hiệu lực: 3 phút)", otpCode);
        log.info("==================================================");

        if (mailSender == null) {
            log.warn("JavaMailSender chưa được cấu hình. Sử dụng mã OTP trên màn hình log để tiếp tục thử nghiệm.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, appName);
            helper.setTo(toEmail);
            helper.setSubject("[" + appName + "] Mã xác thực đăng ký tài khoản");

            String htmlContent = buildOtpEmailHtml(otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi email OTP thành công tới: {}", toEmail);
        } catch (Exception e) {
            log.error("Không thể gửi email OTP tới {}: {}. Vui lòng kiểm tra lại cấu hình SMTP.", toEmail, e.getMessage());
            // Không rethrow để tránh chặn flow kiểm thử nếu người dùng chưa điền App Password SMTP thật
        }
    }

    private String buildOtpEmailHtml(String otpCode) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
                .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #B91C1C, #E31E24); padding: 28px 24px; text-align: center; color: #FFFFFF; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
                .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
                .body { padding: 32px 28px; text-align: center; }
                .body p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0; }
                .otp-box { margin: 24px auto; padding: 18px 24px; background: #FEF2F2; border: 2px dashed #FCA5A5; border-radius: 14px; display: inline-block; }
                .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #E31E24; font-family: 'Courier New', monospace; }
                .expiry-note { font-size: 13px; color: #DC2626; font-weight: 600; margin-top: 10px; }
                .footer { padding: 18px 24px; background: #F1F5F9; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>LinearVocab LMS</h1>
                  <p>Hệ thống Học & Quản lý Từ vựng Tiếng Anh Tư Duy</p>
                </div>
                <div class="body">
                  <p>Xin chào bạn,<br>Bạn vừa yêu cầu mã xác thực OTP để tiến hành đăng ký tài khoản trên hệ thống <strong>LinearVocab LMS</strong>.</p>
                  <p>Vui lòng sử dụng mã xác thực gồm 6 chữ số dưới đây:</p>
                  
                  <div class="otp-box">
                    <div class="otp-code">""" + otpCode + """
                    </div>
                  </div>
                  
                  <div class="expiry-note">⏱ Mã OTP có hiệu lực trong vòng 3 phút (180 giây).</div>
                  <p style="margin-top: 20px; font-size: 12px; color: #64748B;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                </div>
                <div class="footer">
                  © 2026 LinearVocab LMS. Mọi quyền được bảo lưu.
                </div>
              </div>
            </body>
            </html>
            """;
    }
}
