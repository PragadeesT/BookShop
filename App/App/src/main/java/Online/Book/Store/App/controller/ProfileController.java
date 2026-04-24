package Online.Book.Store.App.controller;

import Online.Book.Store.App.model.Order;
import Online.Book.Store.App.model.User;
import Online.Book.Store.App.repository.OrderRepository;
import Online.Book.Store.App.repository.UserRepository;
import Online.Book.Store.App.config.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository  userRepo;
    private final OrderRepository orderRepo;
    private final PasswordEncoder encoder;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ── Helper: extract username from Authorization header ─────────────────
    private String extractUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new RuntimeException("Missing token");
        String token = authHeader.substring(7);
        return JwtUtil.extractUsername(token);
    }

    // ── GET /users/me ─────────────────────────────────────────────────────
    // Returns profile + order stats for the logged-in user
    @GetMapping
    public ResponseEntity<?> getProfile(
            @RequestHeader("Authorization") String authHeader) {

        String username = extractUsername(authHeader);

        return userRepo.findByUsername(username)
                .map(user -> {
                    // Fetch this user's orders
                    List<Order> userOrders = orderRepo.findAll().stream()
                            .filter(o -> o.getUser().getId().equals(user.getId()))
                            .toList();

                    double totalSpent = userOrders.stream()
                            .mapToDouble(Order::getAmount).sum();

                    long delivered = userOrders.stream()
                            .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED).count();

                    // Recent 5 orders
                    List<Map<String, Object>> recentOrders = userOrders.stream()
                            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                            .limit(5)
                            .map(o -> Map.<String, Object>of(
                                    "id",        o.getId(),
                                    "book",      o.getBook().getTitle(),
                                    "amount",    "₹" + Math.round(o.getAmount()),
                                    "status",    capitalise(o.getStatus().name()),
                                    "createdAt", o.getCreatedAt() != null ? o.getCreatedAt().format(FMT) : ""
                            ))
                            .toList();

                    Map<String, Object> profile = new java.util.LinkedHashMap<>();
                    profile.put("id",           user.getId());
                    profile.put("username",      user.getUsername());
                    profile.put("email",         user.getEmail());
                    profile.put("role",          user.getRole() != null ? user.getRole() : "USER");
                    profile.put("totalOrders",   userOrders.size());
                    profile.put("totalSpent",    totalSpent);
                    profile.put("delivered",     delivered);
                    profile.put("recentOrders",  recentOrders);

                    return ResponseEntity.ok(profile);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── PATCH /users/me/password ──────────────────────────────────────────
    // body: { currentPassword, newPassword }
    @PatchMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {

        String username        = extractUsername(authHeader);
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");

        if (currentPassword == null || newPassword == null)
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "currentPassword and newPassword are required"));

        if (newPassword.length() < 6)
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password must be at least 6 characters"));

        return userRepo.findByUsername(username)
                .map(user -> {
                    if (!encoder.matches(currentPassword, user.getPassword()))
                        return ResponseEntity.status(401)
                                .body(Map.of("error", "Current password is incorrect"));

                    user.setPassword(encoder.encode(newPassword));
                    userRepo.save(user);
                    return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
                })
                .orElse(ResponseEntity.status(404)
                        .body(Map.of("error", "User not found")));
    }

    // ── PATCH /users/me/email ─────────────────────────────────────────────
    // body: { email }
    @PatchMapping("/email")
    public ResponseEntity<Map<String, String>> updateEmail(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {

        String username = extractUsername(authHeader);
        String newEmail = body.get("email");

        if (newEmail == null || !newEmail.contains("@"))
            return ResponseEntity.badRequest().body(Map.of("error", "Valid email is required"));

        return userRepo.findByUsername(username)
                .map(user -> {
                    user.setEmail(newEmail.trim());
                    userRepo.save(user);
                    return ResponseEntity.ok(Map.of("message", "Email updated successfully"));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }

    private String capitalise(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.charAt(0) + s.substring(1).toLowerCase();
    }
}