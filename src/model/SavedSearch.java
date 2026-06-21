package model;

/**
 * Model representing a saved search with filters in the Java service.
 */
public class SavedSearch {
    public String id;
    public String name;
    public User user;
    public Filters filters;

    public SavedSearch() {}

    public static class Filters {
        public Double minPrice;
        public Double maxPrice;
        public String gender;
        public String roomType;
        public String propertyType;
        public Double maxDistance;
        public String area;
        
        public Filters() {}
    }
}
