package com.dolvocab.app.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class MongoIndexConfig implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Bắt đầu khởi tạo các MongoDB Indexes...");

            // 1. users
            mongoTemplate.indexOps("users")
                    .ensureIndex(new Index().on("email", Direction.ASC).unique());

            // 2. vocabularies
            mongoTemplate.indexOps("vocabularies")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("_id", Direction.DESC));
            mongoTemplate.indexOps("vocabularies")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("wordLower", Direction.ASC).on("pos", Direction.ASC));
            mongoTemplate.indexOps("vocabularies")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("categoryIds", Direction.ASC));
            mongoTemplate.indexOps("vocabularies")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("noteListIds", Direction.ASC));
            mongoTemplate.indexOps("vocabularies")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("wordFamilyId", Direction.ASC));
            mongoTemplate.indexOps("vocabularies")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("forms.partOfSpeech", Direction.ASC));

            // 3. categories
            mongoTemplate.indexOps("categories")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("nameLower", Direction.ASC).unique());

            // 4. word_families
            mongoTemplate.indexOps("word_families")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("rootWordLower", Direction.ASC).unique());

            // 5. note_folders
            mongoTemplate.indexOps("note_folders")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("sortOrder", Direction.ASC));
            mongoTemplate.indexOps("note_folders")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("code", Direction.ASC));

            // 6. note_lists
            mongoTemplate.indexOps("note_lists")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("sortOrder", Direction.ASC));
            mongoTemplate.indexOps("note_lists")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("folderId", Direction.ASC).on("sortOrder", Direction.ASC));
            mongoTemplate.indexOps("note_lists")
                    .ensureIndex(new Index().on("userId", Direction.ASC).on("codeLower", Direction.ASC));

            // 7. otp_verifications
            mongoTemplate.indexOps("otp_verifications")
                    .ensureIndex(new Index().on("email", Direction.ASC));
            mongoTemplate.indexOps("otp_verifications")
                    .ensureIndex(new Index().on("expiresAt", Direction.ASC).expire(Duration.ZERO));

            log.info("Khởi tạo MongoDB Indexes hoàn tất thành công.");
        } catch (Exception e) {
            log.warn("Không thể tự động khởi tạo một số MongoDB index (vui lòng kiểm tra kết nối MongoDB): {}", e.getMessage());
        }
    }
}
