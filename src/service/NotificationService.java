package service;

import model.User;

/**
 * Interface representing a service to notify users.
 */
public interface NotificationService {
    void notifyUser(User user, String title, String message);
}
