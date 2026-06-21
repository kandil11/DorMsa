package gateway;

import ioc.annotations.Component;

/**
 * Concrete implementation of EmailGateway that mocks email sending.
 */
@Component
public class MockEmailGateway implements EmailGateway {

    @Override
    public boolean sendEmail(String to, String subject, String body) {
        System.out.println("\n📧 [Java Mock Email Gateway] ───────────────────");
        System.out.println("   To:      " + to);
        System.out.println("   Subject: " + subject);
        System.out.println("   Body:    " + body);
        System.out.println("───────────────────────────────────────────────\n");
        return true;
    }
}
