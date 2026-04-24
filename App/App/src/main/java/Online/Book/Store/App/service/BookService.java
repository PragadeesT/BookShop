package Online.Book.Store.App.service;

import Online.Book.Store.App.dto.BookDTO;
import Online.Book.Store.App.model.Book;
import Online.Book.Store.App.repository.BookRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {

    private final BookRepository repo;

    public BookService(BookRepository repo) {
        this.repo = repo;
    }

    public Book save(Book book) {
        return repo.save(book);
    }

    public List<BookDTO> getAll() {
        return repo.findAll().stream().map(book -> {
            BookDTO dto = new BookDTO();
            dto.setId(book.getId());
            dto.setTitle(book.getTitle());
            dto.setPrice(book.getPrice());
            return dto;
        }).toList();
    }

    public Book getById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}