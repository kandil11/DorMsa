package service;

import ioc.annotations.Autowired;
import ioc.annotations.Component;
import model.Listing;
import model.SavedSearch;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete implementation of SavedSearchMatcherService.
 * Implements the core business logic of filtering and matching saved searches,
 * and uses the injected NotificationService to send alerts.
 */
@Component
public class SimpleSavedSearchMatcherService implements SavedSearchMatcherService {

    @Autowired
    private NotificationService notificationService;

    @Override
    public List<SavedSearch> matchAndNotify(Listing listing, List<SavedSearch> savedSearches) {
        System.out.println("🔍 [Java Matcher Component] Matching listing: \"" + listing.title + "\" against " + savedSearches.size() + " saved search(es)...");
        List<SavedSearch> matched = new ArrayList<>();

        for (SavedSearch ss : savedSearches) {
            if (isMatch(listing, ss)) {
                System.out.println("🎯 [Java Matcher Component] Match found: Saved search \"" + ss.name + "\" for user: " + ss.user.name);
                matched.add(ss);

                // Notify the user using the injected Notification component
                String message = String.format(
                    "\"%s\" matches your saved search \"%s\". Price: %.0f EGP. Location: %.1f km from campus (%s).",
                    listing.title,
                    ss.name,
                    listing.price,
                    listing.distanceFromCampus,
                    listing.area != null ? listing.area : "MSA Area"
                );
                
                notificationService.notifyUser(ss.user, "🏠 New listing match!", message);
            }
        }

        System.out.println("✅ [Java Matcher Component] Completed matching. Total matches: " + matched.size());
        return matched;
    }

    private boolean isMatch(Listing listing, SavedSearch ss) {
        if (ss.filters == null) return true; // no filters means matches everything
        SavedSearch.Filters f = ss.filters;

        if (f.minPrice != null && listing.price < f.minPrice) return false;
        if (f.maxPrice != null && listing.price > f.maxPrice) return false;
        
        if (f.gender != null && !f.gender.trim().isEmpty() && !f.gender.equalsIgnoreCase(listing.gender)) return false;
        if (f.roomType != null && !f.roomType.trim().isEmpty() && !f.roomType.equalsIgnoreCase(listing.roomType)) return false;
        if (f.propertyType != null && !f.propertyType.trim().isEmpty() && !f.propertyType.equalsIgnoreCase(listing.propertyType)) return false;
        
        if (f.maxDistance != null && listing.distanceFromCampus > f.maxDistance) return false;
        
        if (f.area != null && !f.area.trim().isEmpty() && listing.area != null) {
            if (!listing.area.toLowerCase().contains(f.area.toLowerCase())) {
                return false;
            }
        }

        return true;
    }
}
