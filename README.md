# 🏠 DorMsa — Integrated Student Housing Portal & Java Routing Microservice

This repository contains the complete **DorMsa** platform: a hybrid, multi-language system designed for student housing booking, listings management, saved searches matching, and support ticket routing.

It comprises:
1. **React Single Page Application** (Interactive portal with roles for Students, Parents, Brokers, and Administrators, featuring inline OTP verification and ticket-reply tracking).
2. **Node.js Express Backend** (REST API, MongoDB storage, Twilio SMS mock client, listing alert triggers, and Java API integration).
3. **Java Companion Microservice** (Inversion of Control container, component-based message logs, SMS/OTP dashboard, automated ticket routing, and saved-search matching).
4. **Egypt Real Estate Scraping Subsystem** (Python web scrapers and a lightweight Node/Express seeding interface to populate student listings).

---

## 📂 Project Folder Architecture & Code Catalog

Below is a detailed structural and functional guide to every subdirectory and its codebase responsibilities.

```
DorMsa/
├── api/                    # Vercel serverless function entrypoint
├── backend/                # 🌐 Node.js Express Backend API
│   ├── config/             # Database connections (MongoDB)
│   ├── controllers/        # Request handlers (auth, tickets, listings)
│   ├── middlewares/        # Security (JWT), upload, errors
│   ├── models/             # Mongoose MongoDB schemas
│   ├── routes/             # REST route definitions
│   ├── services/           # Integrations (Java, Twilio SMS mock, SMTP)
│   └── server.js           # Express App bootstrap
├── frontend/               # 💻 React SPA (Vite + Tailwind CSS)
│   ├── src/                # React application source code
│   │   ├── App.jsx          # Client-side React Router mappings
│   │   ├── components/      # Reusable UI & layout elements
│   │   ├── context/         # Global states (Auth, Toast Notifications)
│   │   ├── pages/           # Views (Public, Student, Broker, Admin)
│   │   └── index.css        # Stylesheets
│   └── package.json        # Frontend dependency configuration
├── src/                    # ☕ Java Companion Microservice
│   ├── Main.java           # Entry point & HTTP router
│   ├── ioc/                # Custom IoC & DI Reflection Engine
│   ├── gateway/            # Notification delivery port implementation
│   ├── service/            # Business logic component implementations
│   ├── api/                # REST controllers & Dashboard handlers
│   └── model/              # Java Entity DTOs
├── components.config       # Configuration assembly wiring for Java
├── vercel.json             # Vercel monorepo deployment orchestration
├── package.json            # Monorepo task runner configuration
└── ../egypt_real_estate/   # 🕷️ Web Scrapers & Property Database (Sibling Directory)
    ├── scrapers/           # Python BeautifulSoup scraper scripts
    ├── dashboard/          # Property data viewer and MongoDB seeder
    └── data/               # Scraped raw/merged JSON files
```

---

## ☕ 1. Java Companion Microservice (`src/`)

Builds upon **Component-Based Programming (CBP)** and a custom-made **Inversion of Control (IoC) Container** utilizing reflection to achieve dynamic dependency injection.

### Inversion of Control Engine (`ioc/`)
* 📄 **`ioc/annotations/Component.java`**: A custom annotation declaring a managed component bean.
* 📄 **`ioc/annotations/Autowired.java`**: Declares a required port/dependency to be dynamically injected at runtime.
* 📄 **`ioc/container/IoCContainer.java`**: Scans package components, processes properties from `components.config`, instantiates singletons, and performs DI wiring via reflection.

### Message Delivery Components (`gateway/` & `service/`)
* 📄 **`gateway/EmailGateway.java`**: Provided Interface defining SMTP or Mock mail deliveries.
* 📄 **`gateway/MockEmailGateway.java`**: Concrete implementation printing emails to the console for testing.
* 📄 **`gateway/SmtpEmailGateway.java`**: Concrete implementation simulating SMTP server hookups (`smtp.msa.edu.eg:587`).
* 📄 **`service/NotificationService.java`**: Provided Interface coordinating user notification dispatches.
* 📄 **`service/ConsoleNotificationService.java`**: Implementation resolving alerts and delegating to the injected `EmailGateway`.
* 📄 **`service/MessageStoreService.java`**: Provided Interface logging notifications and tracking active OTPs.
* 📄 **`service/SimpleMessageStoreService.java`**: In-memory thread-safe component. Employs a phone normalization algorithm (matching the last 11 digits) to bridge format mismatches.

### Core Business Logic (`service/`)
* 📄 **`service/SupportRouterService.java`**: Contract interface for support routing.
* 📄 **`service/SimpleSupportRouterService.java`**: Processes incoming ticket categories and descriptions, routing them dynamically based on keywords (e.g., "Finance" for payment queries, "Tech Support" for bugs).
* 📄 **`service/SavedSearchMatcherService.java`**: Contract for criteria matching.
* 📄 **`service/SimpleSavedSearchMatcherService.java`**: Evaluates new listings against saved user search criteria (price, room type, distance from campus) and issues alerts on matching parameters.

### HTTP APIs & Controllers (`api/` & `Main.java`)
* 📄 **`api/TicketHttpHandler.java`**: Processes POST requests at `/api/support/route`.
* 📄 **`api/SavedSearchHttpHandler.java`**: Processes listings and filters matching calculations.
* 📄 **`api/SmsHttpHandler.java`**: Handles SMS send logs and OTP verification codes.
* 📄 **`api/DashboardHttpHandler.java`**: Serves the live HTML dashboard UI and returns JSON updates via polling.
* 📄 **`Main.java`**: Instantiates and boots the IoC Container, initializes the server, and routes endpoints on port `5002`.

---

## 🌐 2. Node.js Express Backend (`backend/`)

Serves as the database connection broker and provides secure REST endpoints for the client-side React app.

* 📄 **`backend/server.js`**: Application entry point. Configures middleware (CORS, JSON parsing), registers routes, and connects to MongoDB database instances.
* 📁 **`backend/config/db.js`**: Sets up two distinct Mongoose database connections: one for the core portal (`dormsa`) and one for the scraper listings (`egypt_real_estate`).
* 📁 **`backend/controllers/`**:
  * 📄 **`authController.js`**: User registration, login verification, password resets, and student/broker ID uploads. Generates verification OTPs.
  * 📄 **`supportController.js`**: Coordinates ticket creation and links directly to the Java REST API to route and update assignments in MongoDB.
  * 📄 **`listingController.js`**: Manages listing actions, room bookings, and calls the Java saved-search engine to alert matching users.
* 📁 **`backend/middlewares/`**:
  * 📄 **`auth.js`**: Checks JWT auth tokens in request headers to authorize user accounts.
  * 📄 **`roleCheck.js`**: Enforces path privileges for specific user categories (Admin/Broker/Student).
  * 📄 **`upload.js`**: Configures Multer to store uploaded avatar images and identity documents.
* 📁 **`backend/models/`**: Defines the Mongoose database schemas (`User.js`, `Listing.js`, `SupportTicket.js`, `Notification.js`, etc.).
* 📁 **`backend/services/`**:
  * 📄 **`javaServiceIntegration.js`**: Dispatches requests (tickets, listing matches, and SMS logs) to the Java companion microservice on port `5002`.
  * 📄 **`smsService.js`**: A mock gateway simulating Twilio SMS deliveries. Sends OTP codes and redirects them to the Java service for logs.

---

## 💻 3. React Frontend (`frontend/`)

A React-based Single Page Application (SPA) styled with custom Tailwind CSS interfaces and smooth Framer Motion animations.

* 📄 **`frontend/src/App.jsx`**: Global routing mapping. Separates public pages from role-secured dashboards (Student, Broker, and Admin dashboards) using layout wrappers.
* 📁 **`frontend/src/context/`**:
  * 📄 **`AuthContext.jsx`**: Handles login, registration, verify, and resend OTP actions. Shares session tokens globally.
  * 📄 **`NotificationContext.jsx`**: Custom Toast notification provider showing premium animated alert cards.
* 📁 **`frontend/src/layouts/`**:
  * 📄 **`MainLayout.jsx`**: Global layout containing the public navbar and footer.
  * 📄 **`DashboardLayout.jsx`**: Sidebar layout for authenticated dashboards. Features a prominent, persistent **Phone Verification Required** warning banner for unverified accounts, enabling users to request and input OTP codes directly.
* 📁 **`frontend/src/pages/`**:
  * 📁 **`public/`**: Landing page, property catalogs, registration forms with inline OTP cards, and password recovery pages.
  * 📁 **`student/`**: Displays user profile stats, saved search lists, payment/billing receipt histories, and support ticket dashboards (featuring routing status cards directly populated by the Java routing engine).
  * 📁 **`broker/`**: Add/edit listing forms, message modules, broker-verification badge uploads, and listing analytics.
  * 📁 **`admin/`**: Audit logs tracker, system analytics, verification approvals, and user accounts moderator.

---

## 🕷️ 4. Egypt Real Estate Scraper Subsystem (`../egypt_real_estate/`)

Designed to crawl local rental providers and feed authentic listing options into the housing database.

* 📁 **`scrapers/`**: Python crawler scripts powered by BeautifulSoup to target major property aggregates:
  * 📄 **`bayut_scraper.py`** & **`dubizzle_scraper.py`**: Web-scraping properties, extraction of layout grids, prices, and locations.
  * 📄 **`refresh_and_merge.py`**: Merges raw scrapes into a clean, unified JSON dataset.
* 📁 **`dashboard/`**:
  * 📄 **`server.js`**: A lightweight Node.js/Express tool mapping scraped files and hosting a viewer page to browse scraped options.
  * 📄 **`seed.js`**: A script that imports the merged JSON dataset directly into the MongoDB database (`egypt_real_estate.listings`), allowing the DorMsa portal to display real listings.

---

## 🚀 Getting Started & Local Setup

Follow these steps to run the complete DorMsa platform locally.

### Prerequisites
* [Node.js](https://nodejs.org) (v18 or higher)
* [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/downloads/) (v17 or higher)
* [MongoDB](https://www.mongodb.com/) (running instance or Atlas connection string)
* [Python 3](https://www.python.org/) (for running web scrapers)

### 1. Install Dependencies
From the root of the `DorMsa` directory, run:
```bash
# Install root, frontend, and backend packages
npm install
npm run install-frontend --prefix frontend || (cd frontend && npm install)
npm run install-backend --prefix backend || (cd backend && npm install)
```

### 2. Configure Environment variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Connection to the Java Companion Service
JAVA_SERVICE_URL=http://localhost:5002
```

### 3. Build & Run Java companion microservice
Compile and run the Java IoC container and microservice:
```bash
# Compile and run Main.java
javac -d bin src/**/*.java src/*.java
java -cp bin Main
```
The Java service will start listening on port `5002`.

### 4. Running Web Client & Express API
Start both the React client and Node.js server concurrently from the root directory:
```bash
npm run dev
```
* **Frontend application**: `http://localhost:5173`
* **Express API**: `http://localhost:5001`

---

## 🌐 Vercel Deployment

DorMsa is optimized for serverless deployments on Vercel:

1. Import the repository into Vercel.
2. Vercel automatically deploys the React frontend statically and compiles the Express backend (`api/index.js`) as a serverless function under `/api/*` endpoints.
3. Configure the environment variables (`MONGODB_URI`, `JWT_SECRET`) in your Vercel Dashboard.
