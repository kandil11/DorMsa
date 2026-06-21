package service;

import model.Listing;
import model.SavedSearch;
import java.util.List;

/**
 * Service that encapsulates the logic for matching a new listing 
 * against a collection of saved searches and notifying matching users.
 */
public interface SavedSearchMatcherService {
    List<SavedSearch> matchAndNotify(Listing listing, List<SavedSearch> savedSearches);
}
