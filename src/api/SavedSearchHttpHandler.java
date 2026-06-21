package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import ioc.container.IoCContainer;
import model.Listing;
import model.SavedSearch;
import model.User;
import service.SavedSearchMatcherService;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * HTTP API Handler that listens for POST requests containing a Listing and a list of Saved Searches.
 * Delegates matching and user alerting to the DI-managed SavedSearchMatcherService.
 */
public class SavedSearchHttpHandler implements HttpHandler {

    private final IoCContainer container;

    public SavedSearchHttpHandler(IoCContainer container) {
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
            
            // 1. Parse Listing
            Listing listing = parseListing(json);
            
            // 2. Parse List of Saved Searches
            List<SavedSearch> savedSearches = parseSavedSearches(json);

            // 3. Resolve SavedSearchMatcherService from container
            SavedSearchMatcherService matcherService = container.getBean(SavedSearchMatcherService.class);
            if (matcherService == null) {
                sendResponse(exchange, 500, "{\"error\": \"IoC Container failed to resolve SavedSearchMatcherService.\"}");
                return;
            }

            // 4. Match and notify matching users
            List<SavedSearch> matches = matcherService.matchAndNotify(listing, savedSearches);

            // 5. Build response containing the matched saved search details
            StringBuilder matchesJson = new StringBuilder("[");
            for (int i = 0; i < matches.size(); i++) {
                SavedSearch ms = matches.get(i);
                matchesJson.append(String.format(
                    "{\"savedSearchId\":\"%s\",\"userId\":\"%s\",\"name\":\"%s\",\"email\":\"%s\"}",
                    escapeJson(ms.id),
                    escapeJson(ms.user != null ? ms.user.id : ""),
                    escapeJson(ms.name),
                    escapeJson(ms.user != null ? ms.user.email : "")
                ));
                if (i < matches.size() - 1) {
                    matchesJson.append(",");
                }
            }
            matchesJson.append("]");

            String jsonResponse = String.format(
                "{\"status\":\"success\",\"matchedCount\":%d,\"matches\":%s}",
                matches.size(),
                matchesJson.toString()
            );

            sendResponse(exchange, 200, jsonResponse);

        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\": \"Failed to process: " + escapeJson(e.getMessage()) + "\"}");
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

    private Listing parseListing(String json) {
        Listing listing = new Listing();
        int listingStart = json.indexOf("\"listing\"");
        if (listingStart == -1) return listing;
        
        int blockStart = json.indexOf("{", listingStart);
        int blockEnd = findClosingBracket(json, blockStart);
        String listingJson = json.substring(blockStart, blockEnd + 1);

        listing.id = getJsonField(listingJson, "id");
        listing.title = getJsonField(listingJson, "title");
        listing.gender = getJsonField(listingJson, "gender");
        listing.roomType = getJsonField(listingJson, "roomType");
        listing.propertyType = getJsonField(listingJson, "propertyType");
        listing.area = getJsonField(listingJson, "area");
        
        String priceStr = getJsonNumericField(listingJson, "price");
        if (priceStr != null) {
            listing.price = Double.parseDouble(priceStr);
        }
        
        String distStr = getJsonNumericField(listingJson, "distanceFromCampus");
        if (distStr != null) {
            listing.distanceFromCampus = Double.parseDouble(distStr);
        }

        return listing;
    }

    private List<SavedSearch> parseSavedSearches(String json) {
        List<SavedSearch> list = new ArrayList<>();
        int searchStart = json.indexOf("\"savedSearches\"");
        if (searchStart == -1) return list;
        
        int arrayStart = json.indexOf("[", searchStart);
        int arrayEnd = findClosingBracket(json, arrayStart);
        String arrayJson = json.substring(arrayStart + 1, arrayEnd);

        // Split items by checking matching curly brackets
        int i = 0;
        while (i < arrayJson.length()) {
            int blockStart = arrayJson.indexOf("{", i);
            if (blockStart == -1) break;
            int blockEnd = findClosingBracket(arrayJson, blockStart);
            String itemJson = arrayJson.substring(blockStart, blockEnd + 1);
            
            SavedSearch ss = new SavedSearch();
            ss.id = getJsonField(itemJson, "id");
            ss.name = getJsonField(itemJson, "name");
            
            // Parse User inside Saved Search
            int userStart = itemJson.indexOf("\"user\"");
            if (userStart != -1) {
                int uStart = itemJson.indexOf("{", userStart);
                int uEnd = findClosingBracket(itemJson, uStart);
                String userJson = itemJson.substring(uStart, uEnd + 1);
                
                User user = new User();
                user.id = getJsonField(userJson, "id");
                user.name = getJsonField(userJson, "name");
                user.email = getJsonField(userJson, "email");
                user.phone = getJsonField(userJson, "phone");
                ss.user = user;
            }
            
            // Parse Filters inside Saved Search
            int filtersStart = itemJson.indexOf("\"filters\"");
            if (filtersStart != -1) {
                int fStart = itemJson.indexOf("{", filtersStart);
                int fEnd = findClosingBracket(itemJson, fStart);
                String filtersJson = itemJson.substring(fStart, fEnd + 1);
                
                SavedSearch.Filters f = new SavedSearch.Filters();
                f.gender = getJsonField(filtersJson, "gender");
                f.roomType = getJsonField(filtersJson, "roomType");
                f.propertyType = getJsonField(filtersJson, "propertyType");
                f.area = getJsonField(filtersJson, "area");
                
                String minPriceStr = getJsonNumericField(filtersJson, "minPrice");
                if (minPriceStr != null && !"null".equalsIgnoreCase(minPriceStr)) {
                    f.minPrice = Double.parseDouble(minPriceStr);
                }
                
                String maxPriceStr = getJsonNumericField(filtersJson, "maxPrice");
                if (maxPriceStr != null && !"null".equalsIgnoreCase(maxPriceStr)) {
                    f.maxPrice = Double.parseDouble(maxPriceStr);
                }
                
                String maxDistanceStr = getJsonNumericField(filtersJson, "maxDistance");
                if (maxDistanceStr != null && !"null".equalsIgnoreCase(maxDistanceStr)) {
                    f.maxDistance = Double.parseDouble(maxDistanceStr);
                }
                
                ss.filters = f;
            }
            
            list.add(ss);
            i = blockEnd + 1;
        }

        return list;
    }

    private int findClosingBracket(String s, int startIdx) {
        char open = s.charAt(startIdx);
        char close = open == '{' ? '}' : ']';
        int count = 1;
        for (int i = startIdx + 1; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == open) count++;
            else if (c == close) count--;
            if (count == 0) return i;
        }
        return -1;
    }

    private String getJsonField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String getJsonNumericField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*([0-9.]+|null)");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            String val = matcher.group(1);
            return "null".equals(val) ? null : val;
        }
        return null;
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
