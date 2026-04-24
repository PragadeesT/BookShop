package Online.Book.Store.App.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalBooks;
    private long totalOrders;
    private long totalUsers;
    private double totalRevenue;
}