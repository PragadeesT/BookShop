package Online.Book.Store.App.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;

public class JwtUtil {

    private static final String SECRET = "mysecretkeymysecretkeymysecretkey123456";

    private static final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    // ── Generate token ─────────────────────────────────────────────────────
    public static String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(key)
                .compact();
    }

    // ── Extract username ───────────────────────────────────────────────────
    public static String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    // ── Validate token ─────────────────────────────────────────────────────
    public static boolean validateToken(String token) {
        try {
            return !getClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    // ── Parse claims ───────────────────────────────────────────────────────
    private static Claims getClaims(String token) {
        return Jwts.parser()               // ✅ NOT parserBuilder()
                .verifyWith(key)           // ✅ NOT setSigningKey()
                .build()
                .parseSignedClaims(token)  // ✅ NOT parseClaimsJws()
                .getPayload();             // ✅ NOT getBody()
    }
}