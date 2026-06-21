package service;

import ioc.annotations.Autowired;
import ioc.annotations.Component;
import model.SupportTicket;

/**
 * Concrete implementation of SupportRouterService.
 * Determines the best agent based on ticket category, subject, and description.
 * Uses Autowired NotificationService to send a message once assigned.
 */
@Component
public class SimpleSupportRouterService implements SupportRouterService {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private MessageStoreService messageStore;

    @Override
    public void routeTicket(SupportTicket ticket) {
        System.out.println("🔧 [Java Routing Service] Routing ticket: " + ticket.subject + " (ID: " + ticket.id + ")");
        
        String content = (ticket.subject + " " + ticket.description).toLowerCase();
        String assignedAgent;
        String routingNotes;

        if (content.contains("payment") || content.contains("money") || content.contains("refund") || "financial".equalsIgnoreCase(ticket.category)) {
            assignedAgent = "Sarah Kandil (Finance Department)";
            routingNotes = "Automatically routed to Finance because of financial terms detected.";
            ticket.priority = "high"; // escalate financial issues
        } else if (content.contains("bug") || content.contains("error") || content.contains("server") || "technical".equalsIgnoreCase(ticket.category)) {
            assignedAgent = "Mostafa IT (Tech Support Lead)";
            routingNotes = "Routed to Technical department based on keywords.";
        } else if (content.contains("room") || content.contains("dorm") || content.contains("cleaning") || "housing".equalsIgnoreCase(ticket.category)) {
            assignedAgent = "Ahmed Operations (Operations Manager)";
            routingNotes = "Routed to Operations Manager for housing/room logistics.";
        } else {
            assignedAgent = "Sherif Support (Customer Success)";
            routingNotes = "Routed to General Customer Success team.";
        }

        ticket.assignedAgent = assignedAgent;
        ticket.routingNotes = routingNotes;
        ticket.status = "open";

        System.out.println("🎯 [Java Routing Service] Assigned to: " + assignedAgent);
        System.out.println("📝 [Java Routing Service] Routing Notes: " + routingNotes);

        // Log to component memory store
        messageStore.addMessage(
            "TICKET", 
            ticket.user != null ? ticket.user.email : "system", 
            "Routed: " + ticket.subject, 
            "Assigned to: " + assignedAgent + "\n" + routingNotes
        );

        // Notify user about ticket routing using injected notification service
        if (ticket.user != null && ticket.user.email != null) {
            String notificationMsg = String.format(
                "Your support ticket '%s' has been assigned to %s. Routing details: %s",
                ticket.subject,
                assignedAgent,
                routingNotes
            );
            notificationService.notifyUser(ticket.user, "Support Ticket Routed", notificationMsg);
        }
    }
}
