package service;

import ioc.annotations.Component;
import model.Message;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Concrete component providing MessageStoreService.
 * Uses thread-safe data structures to manage notification logs and active OTPs.
 */
@Component
public class SimpleMessageStoreService implements MessageStoreService {

    private final List<Message> messages = new CopyOnWriteArrayList<>();
    private final Map<String, String> activeOtps = new ConcurrentHashMap<>();

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        // Strip all non-digit characters
        String digits = phone.replaceAll("\\D", "");
        // Extract the last 11 digits to consistently match local Egyptian numbers (e.g. 01012345678)
        if (digits.length() >= 11) {
            return digits.substring(digits.length() - 11);
        }
        return digits;
    }

    @Override
    public void addMessage(String type, String recipient, String title, String content) {
        messages.add(0, new Message(type, recipient, title, content)); // prepend latest
        // limit history to last 50 messages to prevent memory growth
        if (messages.size() > 50) {
            messages.remove(messages.size() - 1);
        }
    }

    @Override
    public List<Message> getMessages() {
        return messages;
    }

    @Override
    public void storeOtp(String phone, String code) {
        String normalized = normalizePhone(phone);
        System.out.println("⚙️ [Java Message Store] Storing OTP code: " + code + " for phone: " + phone + " (Normalized: " + normalized + ")");
        activeOtps.put(normalized, code);
    }

    @Override
    public boolean verifyOtp(String phone, String code) {
        String normalized = normalizePhone(phone);
        String storedCode = activeOtps.get(normalized);
        if (storedCode != null && storedCode.equals(code)) {
            activeOtps.remove(normalized); // invalidate on successful check
            System.out.println("✅ [Java Message Store] OTP Verification SUCCESS for phone " + phone + " (Normalized: " + normalized + ")");
            return true;
        }
        System.out.println("❌ [Java Message Store] OTP Verification FAILED for phone " + phone + " (Normalized: " + normalized + "). Stored: " + storedCode + ", Entered: " + code);
        return false;
    }

    @Override
    public String getActiveOtpFor(String phone) {
        return activeOtps.get(normalizePhone(phone));
    }
}

