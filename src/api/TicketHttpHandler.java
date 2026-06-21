package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import ioc.container.IoCContainer;
import model.SupportTicket;
import model.User;
import service.SupportRouterService;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * HTTP API Handler that listens for POST requests containing Support Tickets.
 * Uses the custom IoCContainer to resolve the SupportRouterService and execute routing.
 */
public class TicketHttpHandler implements HttpHandler {

    private final IoCContainer container;

    public TicketHttpHandler(IoCContainer container) {
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
            // Read Request Body
            InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
            BufferedReader br = new BufferedReader(isr);
            StringBuilder body = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                body.append(line);
            }

            String json = body.toString();
            System.out.println("📥 [Java API Server] Received request body: " + json);

            // Parse simple JSON (without external dependencies for simplicity)
            SupportTicket ticket = parseTicketJson(json);

            // Resolve SupportRouterService from IoC Container
            SupportRouterService routerService = container.getBean(SupportRouterService.class);
            if (routerService == null) {
                sendResponse(exchange, 500, "{\"error\": \"IoC Container failed to resolve SupportRouterService.\"}");
                return;
            }

            // Route the ticket (modifies the ticket object in-place)
            routerService.routeTicket(ticket);

            // Respond with the routed ticket info
            String jsonResponse = String.format(
                "{\"status\":\"success\",\"ticketId\":\"%s\",\"assignedAgent\":\"%s\",\"routingNotes\":\"%s\",\"priority\":\"%s\"}",
                escapeJson(ticket.id),
                escapeJson(ticket.assignedAgent),
                escapeJson(ticket.routingNotes),
                escapeJson(ticket.priority)
            );

            sendResponse(exchange, 200, jsonResponse);

        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\": \"Invalid request payload: " + escapeJson(e.getMessage()) + "\"}");
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

    /**
     * Simple JSON parsing helper using Regular Expressions.
     */
    private SupportTicket parseTicketJson(String json) {
        SupportTicket ticket = new SupportTicket();
        ticket.id = getJsonField(json, "id");
        ticket.subject = getJsonField(json, "subject");
        ticket.description = getJsonField(json, "description");
        ticket.category = getJsonField(json, "category");

        // Parse embedded user object
        String userJsonSegment = getJsonNestedObject(json, "user");
        if (userJsonSegment != null) {
            User user = new User();
            user.id = getJsonField(userJsonSegment, "id");
            user.name = getJsonField(userJsonSegment, "name");
            user.email = getJsonField(userJsonSegment, "email");
            user.role = getJsonField(userJsonSegment, "role");
            user.phone = getJsonField(userJsonSegment, "phone");
            ticket.user = user;
        }

        return ticket;
    }

    private String getJsonField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String getJsonNestedObject(String json, String fieldName) {
        int idx = json.indexOf("\"" + fieldName + "\"");
        if (idx == -1) return null;
        int startBracket = json.indexOf("{", idx);
        if (startBracket == -1) return null;
        int bracketsCount = 1;
        int i = startBracket + 1;
        while (i < json.length() && bracketsCount > 0) {
            char c = json.charAt(i);
            if (c == '{') bracketsCount++;
            else if (c == '}') bracketsCount--;
            i++;
        }
        return json.substring(startBracket, i);
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
