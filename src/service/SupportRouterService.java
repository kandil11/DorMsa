package service;

import model.SupportTicket;

/**
 * Interface for routing support tickets to agents.
 */
public interface SupportRouterService {
    void routeTicket(SupportTicket ticket);
}
