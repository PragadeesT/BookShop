package Online.Book.Store.App.dto;

import lombok.Data;

@Data
public class OrderDTO {
    private Long id;
    private String username;
    private String bookTitle;
    private int quantity;
}
