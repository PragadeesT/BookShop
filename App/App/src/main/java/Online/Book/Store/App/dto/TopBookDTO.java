package Online.Book.Store.App.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopBookDTO {
    private String title;
    private long sales;
}