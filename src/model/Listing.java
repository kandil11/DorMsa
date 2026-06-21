package model;

/**
 * Model representing a real estate listing in the Java service.
 */
public class Listing {
    public String id;
    public String title;
    public double price;
    public String gender;
    public String roomType;
    public String propertyType;
    
    // Location parameters
    public double distanceFromCampus;
    public String area;

    public Listing() {}
}
