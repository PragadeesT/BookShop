package Online.Book.Store.App.repository;

import Online.Book.Store.App.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // All orders newest-first (used by Orders page)
    List<Order> findAllByOrderByCreatedAtDesc();

    // 10 most recent (used by Dashboard overview)
    List<Order> findTop10ByOrderByCreatedAtDesc();

    // Total revenue
    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Order o")
    Double getTotalRevenue();

    // Top books by order count
    @Query("SELECT o.book.title, COUNT(o) as sales FROM Order o " +
            "GROUP BY o.book.title ORDER BY sales DESC")
    List<Object[]> findTopBooksBySales();
}