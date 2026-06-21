package gateway;

import ioc.annotations.Component;

/**
 * An alternative concrete component providing the EmailGateway interface.
 * This simulates sending emails via a real SMTP server.
 * Demonstrates Component-Based Programming: this component can replace MockEmailGateway
 * without changing any code in the components that depend on EmailGateway.
 */
@Component
public class SmtpEmailGateway implements EmailGateway {

    @Override
    public boolean sendEmail(String to, String subject, String body) {
        System.out.println("\n📧 [Java SMTP Email Gateway Component] ───────────");
        System.out.println("   [SMTP Connect] Connecting to smtp.msa.edu.eg:587...");
        System.out.println("   [SMTP Auth] Authenticated as notifications@dormsa.com");
        System.out.println("   To:      " + to);
        System.out.println("   Subject: " + subject);
        System.out.println("   Body:    " + body.replace("\n", "\n   "));
        System.out.println("   [SMTP Send] Message transmitted successfully.");
        System.out.println("─────────────────────────────────────────────────────────\n");
        return true;
    }
}
