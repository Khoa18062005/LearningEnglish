package com.dolvocab.app.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migration helper to ensure legacy unique constraints on (user_id, word) or word
 * are dropped so that a word can exist in multiple forms (e.g. good (adj) and good (n)).
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseConstraintMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // 1. Drop obsolete uk_user_vocab unique index if present in MySQL
        try {
            jdbcTemplate.execute("ALTER TABLE vocabularies DROP INDEX uk_user_vocab");
            log.info("Migration: Đã gỡ bỏ index uk_user_vocab trên bảng vocabularies để cho phép nhiều dạng từ.");
        } catch (Exception e) {
            log.debug("uk_user_vocab không tồn tại hoặc đã được gỡ bỏ: {}", e.getMessage());
        }

        // 2. Drop obsolete single-column word unique index if present
        try {
            jdbcTemplate.execute("ALTER TABLE vocabularies DROP INDEX word");
            log.info("Migration: Đã gỡ bỏ unique index word trên bảng vocabularies.");
        } catch (Exception e) {
            log.debug("word unique index không tồn tại hoặc đã được gỡ bỏ: {}", e.getMessage());
        }

        // 3. Backfill pos column for older vocabulary rows where pos is null
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE vocabularies v " +
                    "INNER JOIN vocab_forms vf ON v.id = vf.vocab_id " +
                    "SET v.pos = LOWER(vf.part_of_speech) " +
                    "WHERE v.pos IS NULL"
            );
            if (updated > 0) {
                log.info("Migration: Đã đồng bộ pos cho {} từ vựng cũ.", updated);
            }
        } catch (Exception e) {
            log.debug("Không thể backfill pos: {}", e.getMessage());
        }
    }
}
