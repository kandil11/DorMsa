package model;

/**
 * Mirror of the SupportTicket model from DorMsa Node.js.
 */
public class SupportTicket {
    public String id;
    public User user;
    public String subject;
    public String description;
    public String category;
    public String priority;
    public String status;
    
    // Calculated fields by our Java routing engine
    public String assignedAgent;
    public String routingNotes;

    public SupportTicket() {}
}
