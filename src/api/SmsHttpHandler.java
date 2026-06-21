package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import ioc.container.IoCContainer;
import service.MessageStoreService;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * HTTP Handler that manages SMS notifications and verifies OTP codes.
 * Mapped to /api/sms/send and /api/sms/verify.
 */
public class SmsHttpHandler implements HttpHandler {

    private final IoCContainer container;

    public SmsHttpHandler(IoCContainer container) {
        this.container = container;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Enable CORS
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendResponse(exchange, 405, "{\"error\": \"Method not allowed. Use POST.\"}");
            return;
        }

        try {
            String path = exchange.getRequestURI().getPath();
            
            // Read request body
            InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
            BufferedReader br = new BufferedReader(isr);
            StringBuilder body = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                body.append(line);
            }
            String json = body.toString();

            MessageStoreService messageStore = container.getBean(MessageStoreService.class);
            if (messageStore == null) {
                sendResponse(exchange, 500, "{\"error\": \"IoC failed to resolve MessageStoreService.\"}");
                return;
            }

            if (path.endsWith("/send")) {
                // Handle sending SMS
                String phone = getJsonField(json, "phone");
                String message = getJsonField(json, "message");

                if (phone == null || message == null) {
                    sendResponse(exchange, 400, "{\"error\": \"Phone and message are required.\"}");
                    return;
                }

                // Log SMS to memory store
                messageStore.addMessage("SMS", phone, "SMS Verification Alert", message);

                // Detect and extract 6-digit OTP code if present
                Pattern otpPattern = Pattern.compile("code is:\\s*(\\d{6})|password reset code is:\\s*(\\d{6})|:\\s*(\\d{6})");
                Matcher otpMatcher = otpPattern.matcher(message);
                if (otpMatcher.find()) {
                    String code = null;
                    for (int i = 1; i <= otpMatcher.groupCount(); i++) {
                        if (otpMatcher.group(i) != null) {
                            code = otpMatcher.group(i);
                            break;
                        }
                    }
                    if (code != null) {
                        messageStore.storeOtp(phone, code);
                    }
                }

                sendResponse(exchange, 200, "{\"status\":\"success\",\"message\":\"SMS processed by Java companion microservice.\"}");
            } 
            else if (path.endsWith("/verify")) {
                // Handle OTP verification
                String phone = getJsonField(json, "phone");
                String code = getJsonField(json, "code");

                if (phone == null || code == null) {
                    sendResponse(exchange, 400, "{\"error\": \"Phone and code are required.\"}");
                    return;
                }

                boolean isValid = messageStore.verifyOtp(phone, code);
                if (isValid) {
                    sendResponse(exchange, 200, "{\"status\":\"success\",\"message\":\"Verification SUCCESS! Code is correct.\"}");
                } else {
                    sendResponse(exchange, 400, "{\"status\":\"error\",\"message\":\"Verification FAILED! Code is incorrect or expired.\"}");
                }
            } 
            else {
                sendResponse(exchange, 404, "{\"error\": \"Endpoint not found.\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    private void sendResponse(HttpExchange exchange, int status, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private String getJsonField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
