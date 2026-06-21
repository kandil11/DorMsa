package service;

import gateway.EmailGateway;
import ioc.annotations.Autowired;
import ioc.annotations.Component;
import model.User;

/**
 * Service that handles sending notifications, delegating email delivery
 * to the injected EmailGateway interface.
 */
@Component
public class ConsoleNotificationService implements NotificationService {

    // The Dependency injection occurs here. The service does not instantiate the gateway.
    // Instead, the container injects whichever EmailGateway is registered.
    @Autowired
    private EmailGateway emailGateway;

    @Autowired
    private MessageStoreService messageStore;

    @Override
    public void notifyUser(User user, String title, String message) {
        System.out.println("🔔 [Java Notification Service] Dispatching notification for " + user.name + " (" + user.email + ")");
        
        // In-app log
        System.out.println("📱 [In-App Notification] " + title + ": " + message);
        
        // Log to component memory store
        messageStore.addMessage("EMAIL", user.email, title, message);
        
        // Send email
        String emailBody = String.format("Hello %s,\n\n%s\n\nBest regards,\nDorMsa Team", user.name, message);
        emailGateway.sendEmail(user.email, title, emailBody);
    }
}
