package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.LoginRequest;
import com.dolvocab.app.dto.request.RegisterRequest;
import com.dolvocab.app.dto.response.AuthResponse;
import com.dolvocab.app.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}
