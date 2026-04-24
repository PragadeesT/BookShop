package Online.Book.Store.App.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderResponseDTO {
    private Long id;
    private String book;
    private String user;
    private String amount;
    private String status;
}