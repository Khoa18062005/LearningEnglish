package com.dolvocab.app.utils;

import com.dolvocab.app.exception.ResourceNotFoundException;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ObjectIdValidatorTest {

    @Test
    @DisplayName("ObjectId hợp lệ không ném ngoại lệ")
    void testValidObjectId() {
        String validId = new ObjectId().toHexString();
        assertTrue(ObjectIdValidator.isValid(validId));
        assertDoesNotThrow(() -> ObjectIdValidator.validate(validId, "tài nguyên"));
    }

    @Test
    @DisplayName("ObjectId null hoặc không hợp lệ phải ném ResourceNotFoundException (404)")
    void testInvalidObjectId() {
        assertFalse(ObjectIdValidator.isValid(null));
        assertFalse(ObjectIdValidator.isValid(""));
        assertFalse(ObjectIdValidator.isValid("12345"));
        assertFalse(ObjectIdValidator.isValid("not-a-valid-hex-string"));

        assertThrows(ResourceNotFoundException.class, () -> ObjectIdValidator.validate(null, "từ vựng"));
        assertThrows(ResourceNotFoundException.class, () -> ObjectIdValidator.validate("invalid", "danh mục"));
    }
}
