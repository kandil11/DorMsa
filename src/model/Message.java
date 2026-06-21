package model;

/**
 * Model representing a logged notification (email, SMS, or routed ticket)
 * for display in the interactive dashboard.
 */
public class Message {
    public String type; // "EMAIL", "SMS", "TICKET"
    public String recipient;
    public String title;
    public String content;
    public String timestamp;

    public Message(String type, String recipient, String title, String content) {
        this.type = type;
        this.recipient = recipient;
        this.title = title;
        this.content = content;
        this.timestamp = new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date());
    }
}
