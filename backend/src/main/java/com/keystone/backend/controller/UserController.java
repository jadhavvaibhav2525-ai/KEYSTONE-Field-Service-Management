package com.keystone.backend.controller;

import com.keystone.backend.entity.User;
import com.keystone.backend.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

private final UserRepository userRepository;
private final PasswordEncoder passwordEncoder;

public UserController(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder) {

    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
}

// GET - Get all users
@GetMapping
public List<User> getAllUsers() {
    return userRepository.findAll();
}

// POST - Create user
@PostMapping
public User createUser(@RequestBody User user) {

    if (userRepository.existsByEmail(user.getEmail())) {
        throw new RuntimeException("Email already exists");
    }

    user.setPassword(
            passwordEncoder.encode(user.getPassword())
    );

    return userRepository.save(user);
}

// PUT - Update user
@PutMapping("/{id}")
public User updateUser(
        @PathVariable Long id,
        @RequestBody User updatedUser) {

    User existingUser = userRepository.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("User not found")
            );

    existingUser.setName(updatedUser.getName());
    existingUser.setEmail(updatedUser.getEmail());
    existingUser.setRole(updatedUser.getRole());
    existingUser.setPhone(updatedUser.getPhone());

    return userRepository.save(existingUser);
}

// DELETE - Delete user
@DeleteMapping("/{id}")
public String deleteUser(@PathVariable Long id) {

    if (!userRepository.existsById(id)) {
        throw new RuntimeException("User not found");
    }

    userRepository.deleteById(id);

    return "User deleted successfully";
}


}
