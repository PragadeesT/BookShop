package Online.Book.Store.App.repository;

import Online.Book.Store.App.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    // Top selling books by order count
    @Query("SELECT b FROM Book b JOIN Order o ON o.book.id = b.id " +
            "GROUP BY b.id ORDER BY COUNT(o.id) DESC")
    List<Book> findTopSellingBooks();
}