package Online.Book.Store.App.controller;

import Online.Book.Store.App.model.Book;
import Online.Book.Store.App.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {

    private final BookRepository bookRepo;

    // GET /books  → BookTable: lists all books (id, title, price)
    @GetMapping
    public List<Book> getAllBooks() {
        return bookRepo.findAll();
    }

    // GET /books/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBook(@PathVariable Long id) {
        return bookRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /books  → "Add Book" button in BookTable
    @PostMapping
    public Book addBook(@RequestBody Book book) {
        return bookRepo.save(book);
    }

    // PUT /books/{id}  → "Edit" button in BookTable
    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @RequestBody Book updated) {
        return bookRepo.findById(id).map(book -> {
            book.setTitle(updated.getTitle());
            book.setAuthor(updated.getAuthor());
            book.setPrice(updated.getPrice());
            book.setCategory(updated.getCategory());
            book.setStock(updated.getStock());
            return ResponseEntity.ok(bookRepo.save(book));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE /books/{id}  → "Delete" button in BookTable
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBook(@PathVariable Long id) {
        if (!bookRepo.existsById(id))
            return ResponseEntity.notFound().build();
        bookRepo.deleteById(id);
        return ResponseEntity.ok("Book deleted");
    }
}