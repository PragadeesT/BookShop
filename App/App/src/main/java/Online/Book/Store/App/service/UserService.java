// !This class handles business logic and calls UserRepository to perform database operations.

package Online.Book.Store.App.service;

import Online.Book.Store.App.model.User;
import Online.Book.Store.App.repository.UserRepository;
import org.springframework.stereotype.Service;
import Online.Book.Store.App.dto.UserDTO;

import java.util.List;

@Service
public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo){
        this.repo = repo;
    }

    public List<UserDTO> getAll() {
        return repo.findAll().stream().map(user -> {
            UserDTO dto = new UserDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            return dto;
        }).toList();
    }

    public User save(User user){
        return repo.save(user);
    }
}
