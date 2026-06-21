package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import ioc.container.IoCContainer;
import model.Message;
import service.MessageStoreService;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * HTTP Handler that serves the interactive component assembly dashboard and OTP verification web interface.
 * Also maps to /api/dashboard/data to return JSON logs for real-time polling.
 */
public class DashboardHttpHandler implements HttpHandler {

    private final IoCContainer container;

    public DashboardHttpHandler(IoCContainer container) {
        this.container = container;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();

        // Enable CORS
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        
        if ("/api/dashboard/data".equals(path)) {
            // Return active messages as JSON
            MessageStoreService messageStore = container.getBean(MessageStoreService.class);
            if (messageStore == null) {
                sendResponse(exchange, 500, "{\"error\": \"No message store component\"}", "application/json");
                return;
            }

            List<Message> list = messageStore.getMessages();
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                Message m = list.get(i);
                sb.append(String.format(
                    "{\"type\":\"%s\",\"recipient\":\"%s\",\"title\":\"%s\",\"content\":\"%s\",\"timestamp\":\"%s\"}",
                    escapeJson(m.type),
                    escapeJson(m.recipient),
                    escapeJson(m.title),
                    escapeJson(m.content),
                    escapeJson(m.timestamp)
                ));
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]");

            sendResponse(exchange, 200, sb.toString(), "application/json");
        } else {
            // Serve the beautiful interactive HTML Dashboard
            String html = getDashboardHtml();
            sendResponse(exchange, 200, html, "text/html; charset=utf-8");
        }
    }

    private void sendResponse(HttpExchange exchange, int status, String response, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private String getDashboardHtml() {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>DorMsa — Java Component Dashboard</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        :root {\n" +
                "            --bg: #f8fafb;\n" +
                "            --surface: #ffffff;\n" +
                "            --primary: #286921;\n" +
                "            --primary-hover: #1e5218;\n" +
                "            --secondary: #042b49;\n" +
                "            --text: #191d17;\n" +
                "            --text-muted: #667085;\n" +
                "            --border: #eaecf0;\n" +
                "            --success: #12b76a;\n" +
                "            --success-bg: #ecfdf3;\n" +
                "            --error: #d92d20;\n" +
                "            --error-bg: #fef3f2;\n" +
                "        }\n" +
                "        * { box-sizing: border-box; margin: 0; padding: 0; }\n" +
                "        body {\n" +
                "            font-family: 'Inter', sans-serif;\n" +
                "            background-color: var(--bg);\n" +
                "            color: var(--text);\n" +
                "            padding: 40px 20px;\n" +
                "            line-height: 1.5;\n" +
                "        }\n" +
                "        .container {\n" +
                "            max-width: 1100px;\n" +
                "            margin: 0 auto;\n" +
                "        }\n" +
                "        header {\n" +
                "            margin-bottom: 32px;\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "            flex-wrap: wrap;\n" +
                "            gap: 16px;\n" +
                "        }\n" +
                "        h1 {\n" +
                "            font-family: 'Plus Jakarta Sans', sans-serif;\n" +
                "            font-weight: 800;\n" +
                "            font-size: 32px;\n" +
                "            color: var(--secondary);\n" +
                "            letter-spacing: -0.02em;\n" +
                "        }\n" +
                "        .status-badge {\n" +
                "            display: inline-flex;\n" +
                "            align-items: center;\n" +
                "            gap: 6px;\n" +
                "            background: #e8f5e9;\n" +
                "            color: var(--primary);\n" +
                "            padding: 6px 12px;\n" +
                "            border-radius: 9999px;\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .status-dot {\n" +
                "            width: 8px; height: 8px; background: var(--primary); border-radius: 50%;\n" +
                "            animation: pulse 1.5s infinite;\n" +
                "        }\n" +
                "        @keyframes pulse {\n" +
                "            0% { transform: scale(0.95); opacity: 0.5; }\n" +
                "            50% { transform: scale(1.15); opacity: 1; }\n" +
                "            100% { transform: scale(0.95); opacity: 0.5; }\n" +
                "        }\n" +
                "        .grid {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: 2fr 1fr;\n" +
                "            gap: 32px;\n" +
                "            align-items: start;\n" +
                "        }\n" +
                "        @media (max-width: 800px) {\n" +
                "            .grid { grid-template-columns: 1fr; }\n" +
                "        }\n" +
                "        .card {\n" +
                "            background: var(--surface);\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-radius: 20px;\n" +
                "            padding: 24px;\n" +
                "            box-shadow: 0 4px 20px rgba(4, 43, 73, 0.02);\n" +
                "        }\n" +
                "        .card-title {\n" +
                "            font-family: 'Plus Jakarta Sans', sans-serif;\n" +
                "            font-size: 18px;\n" +
                "            font-weight: 700;\n" +
                "            color: var(--secondary);\n" +
                "            margin-bottom: 20px;\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "        }\n" +
                "        .card-desc {\n" +
                "            font-size: 14px;\n" +
                "            color: var(--text-muted);\n" +
                "            margin-top: -12px;\n" +
                "            margin-bottom: 20px;\n" +
                "        }\n" +
                "        /* OTP form styling */\n" +
                "        .form-group {\n" +
                "            margin-bottom: 16px;\n" +
                "        }\n" +
                "        label {\n" +
                "            display: block;\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "            color: var(--text);\n" +
                "            margin-bottom: 6px;\n" +
                "        }\n" +
                "        input {\n" +
                "            width: 100%;\n" +
                "            padding: 12px 16px;\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-radius: 12px;\n" +
                "            font-family: inherit;\n" +
                "            font-size: 14px;\n" +
                "            outline: none;\n" +
                "            transition: border-color 0.2s;\n" +
                "        }\n" +
                "        input:focus { border-color: var(--primary); }\n" +
                "        button {\n" +
                "            width: 100%;\n" +
                "            padding: 12px;\n" +
                "            background: var(--primary);\n" +
                "            color: white;\n" +
                "            border: none;\n" +
                "            border-radius: 12px;\n" +
                "            font-family: inherit;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 600;\n" +
                "            cursor: pointer;\n" +
                "            transition: background 0.2s;\n" +
                "        }\n" +
                "        button:hover { background: var(--primary-hover); }\n" +
                "        .result-box {\n" +
                "            margin-top: 16px;\n" +
                "            padding: 12px 16px;\n" +
                "            border-radius: 12px;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 600;\n" +
                "            display: none;\n" +
                "        }\n" +
                "        .result-success {\n" +
                "            background: var(--success-bg);\n" +
                "            color: var(--success);\n" +
                "            border: 1px solid #d1fadf;\n" +
                "        }\n" +
                "        .result-error {\n" +
                "            background: var(--error-bg);\n" +
                "            color: var(--error);\n" +
                "            border: 1px solid #fee4e2;\n" +
                "        }\n" +
                "        /* Messages Feed */\n" +
                "        .feed {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 16px;\n" +
                "            max-height: 600px;\n" +
                "            overflow-y: auto;\n" +
                "            padding-right: 8px;\n" +
                "        }\n" +
                "        .feed::-webkit-scrollbar {\n" +
                "            width: 6px;\n" +
                "        }\n" +
                "        .feed::-webkit-scrollbar-thumb {\n" +
                "            background-color: var(--border);\n" +
                "            border-radius: 4px;\n" +
                "        }\n" +
                "        .msg-item {\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-radius: 16px;\n" +
                "            padding: 16px;\n" +
                "            background: #fafbfc;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 8px;\n" +
                "            position: relative;\n" +
                "        }\n" +
                "        .msg-header {\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "        }\n" +
                "        .msg-badge {\n" +
                "            font-size: 10px;\n" +
                "            font-weight: 700;\n" +
                "            padding: 3px 8px;\n" +
                "            border-radius: 9999px;\n" +
                "            text-transform: uppercase;\n" +
                "        }\n" +
                "        .badge-email { background: #e0f2fe; color: #0369a1; }\n" +
                "        .badge-sms { background: #fef3c7; color: #b45309; }\n" +
                "        .badge-ticket { background: #f3e8ff; color: #6b21a8; }\n" +
                "        .msg-recipient { font-weight: 600; font-size: 13px; color: var(--secondary); }\n" +
                "        .msg-title { font-weight: 700; font-size: 14px; color: var(--text); }\n" +
                "        .msg-content {\n" +
                "            font-size: 13px;\n" +
                "            color: #475467;\n" +
                "            white-space: pre-wrap;\n" +
                "            background: #ffffff;\n" +
                "            padding: 10px;\n" +
                "            border-radius: 8px;\n" +
                "            border: 1px dashed var(--border);\n" +
                "        }\n" +
                "        .msg-time { font-size: 11px; color: var(--text-muted); }\n" +
                "        .no-data {\n" +
                "            text-align: center;\n" +
                "            padding: 40px;\n" +
                "            color: var(--text-muted);\n" +
                "            font-size: 14px;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <header>\n" +
                "            <div>\n" +
                "                <h1>DorMsa Java Dashboard</h1>\n" +
                "                <p style=\"color: var(--text-muted); font-size: 14px; margin-top: 4px;\">Interactive Component Assembly & Message Terminal</p>\n" +
                "            </div>\n" +
                "            <div class=\"status-badge\">\n" +
                "                <div class=\"status-dot\"></div>\n" +
                "                CBP Engine Active\n" +
                "            </div>\n" +
                "        </header>\n" +
                "        \n" +
                "        <div class=\"grid\">\n" +
                "            <!-- Main Logs Feed -->\n" +
                "            <div class=\"card\">\n" +
                "                <div class=\"card-title\">\n" +
                "                    <span>Live Notification Log</span>\n" +
                "                    <span style=\"font-size: 12px; font-weight: 500; color: var(--text-muted);\">Updates in real-time</span>\n" +
                "                </div>\n" +
                "                <div class=\"feed\" id=\"feedBox\">\n" +
                "                    <div class=\"no-data\">Waiting for transactions... Submit tickets or register in the frontend app.</div>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "            \n" +
                "            <!-- Interactive OTP check -->\n" +
                "            <div class=\"card\">\n" +
                "                <div class=\"card-title\">OTP Verification Terminal</div>\n" +
                "                <div class=\"card-desc\">Verify user registration/reset code inputs processed by the Java service.</div>\n" +
                "                \n" +
                "                <form id=\"otpForm\">\n" +
                "                    <div class=\"form-group\">\n" +
                "                        <label for=\"phoneInput\">Recipient Phone Number</label>\n" +
                "                        <input type=\"text\" id=\"phoneInput\" placeholder=\"e.g. 01234567890\" required>\n" +
                "                    </div>\n" +
                "                    <div class=\"form-group\">\n" +
                "                        <label for=\"codeInput\">6-Digit OTP Code</label>\n" +
                "                        <input type=\"text\" id=\"codeInput\" placeholder=\"e.g. 123456\" maxlength=\"6\" required>\n" +
                "                    </div>\n" +
                "                    <button type=\"submit\">Verify Code</button>\n" +
                "                </form>\n" +
                "                \n" +
                "                <div class=\"result-box\" id=\"resultBox\"></div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    <script>\n" +
                "        // Form submission handling\n" +
                "        document.getElementById('otpForm').addEventListener('submit', async (e) => {\n" +
                "            e.preventDefault();\n" +
                "            const phone = document.getElementById('phoneInput').value.trim();\n" +
                "            const code = document.getElementById('codeInput').value.trim();\n" +
                "            const resultBox = document.getElementById('resultBox');\n" +
                "            \n" +
                "            try {\n" +
                "                const response = await fetch('/api/sms/verify', {\n" +
                "                    method: 'POST',\n" +
                "                    headers: { 'Content-Type': 'application/json' },\n" +
                "                    body: JSON.stringify({ phone, code })\n" +
                "                });\n" +
                "                const data = await response.json();\n" +
                "                \n" +
                "                resultBox.style.display = 'block';\n" +
                "                if (response.ok) {\n" +
                "                    resultBox.className = 'result-box result-success';\n" +
                "                    resultBox.innerText = data.message;\n" +
                "                } else {\n" +
                "                    resultBox.className = 'result-box result-error';\n" +
                "                    resultBox.innerText = data.message;\n" +
                "                }\n" +
                "            } catch (err) {\n" +
                "                resultBox.style.display = 'block';\n" +
                "                resultBox.className = 'result-box result-error';\n" +
                "                resultBox.innerText = 'Network error: ' + err.message;\n" +
                "            }\n" +
                "        });\n" +
                "\n" +
                "        // Live Feed Polling\n" +
                "        async function pollData() {\n" +
                "            try {\n" +
                "                const response = await fetch('/api/dashboard/data');\n" +
                "                if (!response.ok) return;\n" +
                "                const list = await response.json();\n" +
                "                \n" +
                "                const feedBox = document.getElementById('feedBox');\n" +
                "                if (list.length === 0) {\n" +
                "                    feedBox.innerHTML = '<div class=\"no-data\">Waiting for transactions... Submit tickets or register in the frontend app.</div>';\n" +
                "                    return;\n" +
                "                }\n" +
                "                \n" +
                "                let html = '';\n" +
                "                list.forEach(m => {\n" +
                "                    const badgeClass = m.type === 'EMAIL' ? 'badge-email' : m.type === 'SMS' ? 'badge-sms' : 'badge-ticket';\n" +
                "                    html += `\n" +
                "                        <div class=\"msg-item\">\n" +
                "                            <div class=\"msg-header\">\n" +
                "                                <span class=\"msg-recipient\">To: ${m.recipient}</span>\n" +
                "                                <span class=\"msg-badge ${badgeClass}\">${m.type}</span>\n" +
                "                            </div>\n" +
                "                            <div class=\"msg-title\">${m.title}</div>\n" +
                "                            <div class=\"msg-content\">${m.content}</div>\n" +
                "                            <div class=\"msg-time\">🕒 Timestamp: ${m.timestamp}</div>\n" +
                "                        </div>\n" +
                "                    `;\n" +
                "                });\n" +
                "                feedBox.innerHTML = html;\n" +
                "            } catch (e) {\n" +
                "                console.error('Polling error', e);\n" +
                "            }\n" +
                "        }\n" +
                "        \n" +
                "        // Poll immediately and every 1.5 seconds\n" +
                "        pollData();\n" +
                "        setInterval(pollData, 1500);\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
