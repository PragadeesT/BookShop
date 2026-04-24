package Online.Book.Store.App.service;

import Online.Book.Store.App.model.Order;
import Online.Book.Store.App.repository.OrderRepository;
import org.springframework.stereotype.Service;
import Online.Book.Store.App.dto.OrderDTO;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository repo;

    public OrderService(OrderRepository repo) {
        this.repo = repo;
    }

    public Order placeOrder(Order order) {
        return repo.save(order);
    }

    public List<OrderDTO> getOrders() {
        return repo.findAll().stream().map(order -> {
            OrderDTO dto = new OrderDTO();
            dto.setId(order.getId());
            dto.setUsername(order.getUser().getName());
            dto.setBookTitle(order.getBook().getTitle());
            dto.setQuantity(order.getQuantity());
            return dto;
        }).toList();
    }
}