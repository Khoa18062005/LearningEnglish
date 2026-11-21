package com.dolvocab.app.utils;

import com.dolvocab.app.exception.ResourceNotFoundException;
import org.bson.types.ObjectId;

public final class ObjectIdValidator {

    private ObjectIdValidator() {}

    public static void validate(String id, String resourceName) {
        if (id == null || !ObjectId.isValid(id)) {
            throw new ResourceNotFoundException("Không tìm thấy " + resourceName + " với ID: " + id);
        }
    }

    public static boolean isValid(String id) {
        return id != null && ObjectId.isValid(id);
    }
}
