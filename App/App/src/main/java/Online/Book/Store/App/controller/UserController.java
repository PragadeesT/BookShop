package Online.Book.Store.App.controller;

import Online.Book.Store.App.model.Order;
import Online.Book.Store.App.model.User;
import Online.Book.Store.App.repository.OrderRepository;
import Online.Book.Store.App.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;
    private final OrderRepository orderRepo;

    // ── GET /users ────────────────────────────────────────────────────────
    // Returns all users (never returns raw password)
    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        return userRepo.findAll().stream()
                .map(this::toSafeMap)
                .toList();
    }

    // ── GET /users/{id} ───────────────────────────────────────────────────
    // Returns one user + their orders
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        return userRepo.findById(id)
                .map(user -> {
                    Map<String, Object> data = toSafeMap(user);

                    // Attach recent orders for this user
                    List<Map<String, Object>> orders = orderRepo.findAll().stream()
                            .filter(o -> o.getUser().getId().equals(id))
                            .map(o -> Map.<String, Object>of(
                                    "id",     o.getId(),
                                    "book",   o.getBook().getTitle(),
                                    "amount", "₹" + Math.round(o.getAmount()),
                                    "status", capitalise(o.getStatus().name())
                            ))
                            .toList();

                    data.put("orders", orders);
                    data.put("totalOrders", orders.size());
                    data.put("totalSpent", orders.stream()
                            .mapToDouble(o -> {
                                String a = o.get("amount").toString().replace("₹", "");
                                return Double.parseDouble(a);
                            }).sum());

                    return ResponseEntity.ok(data);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE /users/{id} ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        if (!userRepo.existsById(id))
            return ResponseEntity.notFound().build();
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // ── Helper: strip password before sending ─────────────────────────────
    private Map<String, Object> toSafeMap(User u) {
        return new java.util.LinkedHashMap<>(Map.of(
                "id",       u.getId(),
                "username", u.getUsername(),
                "email",    u.getEmail(),
                "role",     u.getRole() != null ? u.getRole() : "USER"
        ));
    }

    private String capitalise(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.charAt(0) + s.substring(1).toLowerCase();
    }
}