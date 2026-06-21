package service;

import model.Message;
import java.util.List;

/**
 * Provided Interface for storing system messages (SMS/Emails/Tickets)
 * and managing OTP validation.
 */
public interface MessageStoreService {
    void addMessage(String type, String recipient, String title, String content);
    List<Message> getMessages();
    void storeOtp(String phone, String code);
    boolean verifyOtp(String phone, String code);
    String getActiveOtpFor(String phone);
}
