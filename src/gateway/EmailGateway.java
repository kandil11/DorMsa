package gateway;

/**
 * Interface representing an email delivery service.
 * Demonstrates the Dependency Inversion Principle (DIP):
 * High-level services depend on this interface, not concrete email clients (e.g. SendGrid or SMTP).
 */
public interface EmailGateway {
    boolean sendEmail(String to, String subject, String body);
}
