# DorMsa — System Component Catalog & Specification Guide

This guide specifies all the pluggable software components configured and managed by the **Inversion of Control (IoC)** environment of the DorMsa companion microservice.

---

## 🧩 Architectural Concepts

Each component in this catalog adheres to **Component-Based Programming (CBP)** principles:
1.  **Provided Interface (Port)**: The service contract the component publishes. Other modules can only call the component via this interface.
2.  **Required Interface (Receptacle)**: Dependencies needed by the component. These are annotated with `@Autowired` and dynamically wired by the container.
3.  **Loose Coupling**: Components do not instantiate each other; the container manages the instantiation, lifecycle, and assembly.

---

## 📁 Component Directory

Here is the complete registry of the 6 components managed in this system:

| # | Provided Interface | Concrete Class | Required Ports (Autowired) | Description |
|---|--------------------|----------------|-----------------------------|-------------|
| 1 | `EmailGateway` | `MockEmailGateway` | None | Development gateway logging email contents to the terminal. |
| 2 | `EmailGateway` | `SmtpEmailGateway` | None | Simulates connection and credentials check to institutional SMTP server. |
| 3 | `NotificationService` | `ConsoleNotificationService` | `EmailGateway`, `MessageStoreService` | Coordinates formatting user alerts and delegates delivery to the email port. |
| 4 | `SupportRouterService` | `SimpleSupportRouterService` | `NotificationService`, `MessageStoreService` | Automates helpdesk routing assignments. |
| 5 | `SavedSearchMatcherService` | `SimpleSavedSearchMatcherService` | `NotificationService` | Compares property posts against user alerts and notifies matched clients. |
| 6 | `MessageStoreService` | `SimpleMessageStoreService` | None | Thread-safe logging memory for system events and normalization of OTP numbers. |

---

## 🔍 Detailed Component Descriptions

### 1. Mock Email Gateway
*   **Provided Interface**: [EmailGateway](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/gateway/EmailGateway.java)
*   **Concrete Class**: [MockEmailGateway](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/gateway/MockEmailGateway.java)
*   **Responsibilities**:
    *   Simulates SMTP transfers during local debugging.
    *   Outputs formatted ASCII box mail containers to standard output.

### 2. SMTP Email Gateway
*   **Provided Interface**: [EmailGateway](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/gateway/EmailGateway.java)
*   **Concrete Class**: [SmtpEmailGateway](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/gateway/SmtpEmailGateway.java)
*   **Responsibilities**:
    *   Fulfills production email routing protocols.
    *   Simulates socket operations to SMTP ports (`smtp.msa.edu.eg:587`).

### 3. Console Notification Service
*   **Provided Interface**: [NotificationService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/NotificationService.java)
*   **Concrete Class**: [ConsoleNotificationService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/ConsoleNotificationService.java)
*   **Dependencies**:
    *   `EmailGateway`: Used to deliver email payloads.
    *   `MessageStoreService`: Logs notifications to the memory store.
*   **Responsibilities**:
    *   Orchestrates and triggers email alert sequences.
    *   Appends in-app notification triggers and formats human-readable text.

### 4. Simple Support Router Service
*   **Provided Interface**: [SupportRouterService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/SupportRouterService.java)
*   **Concrete Class**: [SimpleSupportRouterService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/SimpleSupportRouterService.java)
*   **Dependencies**:
    *   `NotificationService`: Alerts the student when an agent has been assigned.
    *   `MessageStoreService`: Logs the routed ticket events.
*   **Responsibilities**:
    *   Processes incoming billing, technical, or logistics tickets.
    *   Assigns tickets to representative handles (Sarah, Mostafa, Ahmed, etc.) based on keywords.

### 5. Simple Saved Search Matcher Service
*   **Provided Interface**: [SavedSearchMatcherService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/SavedSearchMatcherService.java)
*   **Concrete Class**: [SimpleSavedSearchMatcherService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/SimpleSavedSearchMatcherService.java)
*   **Dependencies**:
    *   `NotificationService`: Alerts matching users when new properties are posted.
*   **Responsibilities**:
    *   Performs pricing, distance, layout, and area checks on new housing listings.
    *   Matches preferences and dispatches alerts to matching student accounts.

### 6. Simple Message Store Service
*   **Provided Interface**: [MessageStoreService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/MessageStoreService.java)
*   **Concrete Class**: [SimpleMessageStoreService](file:///Users/7amada/3rd%20Year/Semester%206/COMP/Project/src/service/SimpleMessageStoreService.java)
*   **Responsibilities**:
    *   Stores active user registration OTPs in thread-safe memory maps.
    *   Normalizes phone entries (stripping E.164 country prefixes) to prevent mismatch errors.
    *   Saves recent email/SMS/Ticket transactions to populate the live dashboard.
