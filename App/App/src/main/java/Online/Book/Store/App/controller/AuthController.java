package Online.Book.Store.App.controller;

import Online.Book.Store.App.config.JwtUtil;
import Online.Book.Store.App.model.User;
import Online.Book.Store.App.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody Map<String, String> body) {
        if (userRepo.existsByUsername(body.get("username")))
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        if (userRepo.existsByEmail(body.get("email")))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));

        User user = new User();
        user.setUsername(body.get("username"));
        user.setEmail(body.get("email"));
        user.setPassword(encoder.encode(body.get("password")));
        userRepo.save(user);

        return ResponseEntity.ok(Map.of(
                "token", JwtUtil.generateToken(user.getUsername()),
                "message", "Account created"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        return userRepo.findByUsername(body.get("username"))
                .filter(u -> encoder.matches(body.get("password"), u.getPassword()))
                .map(u -> ResponseEntity.ok(Map.of(
                        "token", JwtUtil.generateToken(u.getUsername()),
                        "username", u.getUsername()
                )))
                .orElseGet(() -> ResponseEntity.status(401)
                        .body(Map.of("error", "Invalid credentials")));
    }
}