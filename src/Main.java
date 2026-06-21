import api.TicketHttpHandler;
import com.sun.net.httpserver.HttpServer;
import ioc.container.IoCContainer;

import java.io.IOException;
import java.net.InetSocketAddress;

/**
 * Main Entry Point for the Java Support Router microservice.
 * Boots the custom IoC container, wires dependencies, and starts the REST API.
 */
public class Main {

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("🚀 Starting DorMsa Java Support Service");
        System.out.println("=================================================");

        // 1. Initialize our custom IoC Container
        IoCContainer container = new IoCContainer();

        // 2. Scan packages for @Component annotated classes
        // This scans 'gateway' and 'service' packages dynamically.
        container.scanPackage("gateway");
        container.scanPackage("service");

        // 3. Bootstrap the container (Instantiates classes & performs Dependency Injection)
        try {
            container.bootstrap();
        } catch (Exception e) {
            System.err.println("❌ IoC Container Bootstrap failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }

        // 4. Start standard JDK HTTP Server
        int port = 5002;
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            
            // Map the route handlers, passing our configured IoC container
            server.createContext("/api/support/route", new TicketHttpHandler(container));
            server.createContext("/api/notify/saved-searches", new api.SavedSearchHttpHandler(container));
            server.createContext("/api/sms/send", new api.SmsHttpHandler(container));
            server.createContext("/api/sms/verify", new api.SmsHttpHandler(container));
            server.createContext("/api/dashboard/data", new api.DashboardHttpHandler(container));
            server.createContext("/dashboard", new api.DashboardHttpHandler(container));
            
            server.setExecutor(null); // default executor
            server.start();

            System.out.println("\n🌐 [HTTP Server] REST API is running on port " + port);
            System.out.println("📌 Route available: POST http://localhost:" + port + "/api/support/route");
            System.out.println("=================================================\n");

        } catch (IOException e) {
            System.err.println("❌ Failed to start HTTP Server: " + e.getMessage());
            System.exit(1);
        }
    }
}
