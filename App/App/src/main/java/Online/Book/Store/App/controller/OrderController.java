package Online.Book.Store.App.controller;

import Online.Book.Store.App.model.Book;
import Online.Book.Store.App.model.Order;
import Online.Book.Store.App.model.User;
import Online.Book.Store.App.repository.BookRepository;
import Online.Book.Store.App.repository.OrderRepository;
import Online.Book.Store.App.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepo;
    private final BookRepository  bookRepo;
    private final UserRepository  userRepo;

    // ── GET /orders ───────────────────────────────────────────────────────
    // Returns all orders as flat DTOs (no circular references)
    @GetMapping
    public List<Map<String, Object>> getAllOrders() {
        return orderRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toMap)
                .toList();
    }

    // ── GET /orders/{id} ──────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrder(@PathVariable Long id) {
        return orderRepo.findById(id)
                .map(o -> ResponseEntity.ok(toMap(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── POST /orders ──────────────────────────────────────────────────────
    // body: { bookId, userId, quantity }
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> body) {
        Long bookId  = Long.valueOf(body.get("bookId").toString());
        Long userId  = Long.valueOf(body.get("userId").toString());
        int quantity = Integer.parseInt(body.getOrDefault("quantity", 1).toString());

        Book book = bookRepo.findById(bookId).orElse(null);
        User user = userRepo.findById(userId).orElse(null);

        if (book == null) return ResponseEntity.badRequest().body(Map.of("error", "Book not found"));
        if (user == null) return ResponseEntity.badRequest().body(Map.of("error", "User not found"));

        Order order = new Order();
        order.setBook(book);
        order.setUser(user);
        order.setQuantity(quantity);
        order.setAmount(book.getPrice() * quantity);

        return ResponseEntity.ok(toMap(orderRepo.save(order)));
    }

    // ── PATCH /orders/{id}/status ─────────────────────────────────────────
    // body: { status: "SHIPPED" }
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String rawStatus = body.get("status");
        if (rawStatus == null)
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(rawStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + rawStatus));
        }

        return orderRepo.findById(id)
                .map(order -> {
                    order.setStatus(newStatus);
                    return ResponseEntity.ok(toMap(orderRepo.save(order)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE /orders/{id} ───────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOrder(@PathVariable Long id) {
        if (!orderRepo.existsById(id))
            return ResponseEntity.notFound().build();
        orderRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Order deleted"));
    }

    // ── Helper: Order → flat map (no circular JSON) ───────────────────────
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private Map<String, Object> toMap(Order o) {
        return new java.util.LinkedHashMap<>(Map.of(
                "id",        o.getId(),
                "book",      o.getBook().getTitle(),
                "bookId",    o.getBook().getId(),
                "user",      o.getUser().getUsername(),
                "userId",    o.getUser().getId(),
                "quantity",  o.getQuantity(),
                "amount",    o.getAmount(),
                "status",    o.getStatus().name(),
                "createdAt", o.getCreatedAt() != null ? o.getCreatedAt().format(FMT) : ""
        ));
    }
}