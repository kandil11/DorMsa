# 🏠 DorMsa — Premium Student Housing Marketplace

DorMsa is a modern, premium SaaS-style student housing and accommodation marketplace. The platform bridges the gap between the energetic accessibility required by a student demographic and the high-end reliability of a premium real estate platform. Designed with a sleek, interactive UI utilizing **Glassmorphism** and **Modern SaaS** layout principles, DorMsa makes finding and managing student accommodation stress-free, secure, and intuitive.

---

## 🏗️ Project Architecture

DorMsa is structured as a **monorepo** dividing the frontend application and the backend API service:

```
DorMsa/
├── api/                    # Vercel serverless function entrypoint
├── backend/                # Express API application
│   ├── config/             # DB and configuration setups
│   ├── controllers/        # Business logic controllers
│   ├── middlewares/        # Authentication and error-handling middlewares
│   ├── models/             # Mongoose database models
│   ├── routes/             # Express API routes
│   └── services/           # Background tasks and utility services
├── frontend/               # React + Vite client application
│   ├── public/             # Static assets
│   └── src/                # React source code (components, hooks, pages, styles)
├── vercel.json             # Vercel monorepo deployment orchestration
└── package.json            # Monorepo task runner configuration
```

---

## ✨ Features Checklist

* **🔒 Secure Authentication & Roles**: Email-based signup/login with roles: `Student`, `Landlord / Property Manager`, and `Admin`.
* **🔍 Advanced Property Search**: Filter listings by location, price, room types, amenities, and proximity to campuses.
* **📅 Booking Requests**: Streamlined room/apartment reservation requests with live status tracking.
* **💳 Payment Management**: Detailed transaction tracking and payment logs for bookings.
* **💬 Support Ticket System**: Direct communication channel for students to resolve issues with administrators or hosts.
* **🔔 Live Notifications**: Real-time updates on booking approvals, payment success, and support tickets.
* **🛡️ Admin Dashboard & Auditing**: Control panel for administrators with detailed security audit logs.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion (Micro-animations), Lucide React, React Router Dom.
* **Backend**: Node.js, Express, MongoDB (Mongoose ORM), JSON Web Tokens (JWT), Multer (Image upload handling).
* **Database**: MongoDB (Dual DB integration for listings and main collections).
* **Deployment**: Configured for instant deployment on Vercel with zero-cold-start optimization.

---

## 🚀 Getting Started

Follow these steps to run DorMsa locally on your development machine.

### Prerequisites
* [Node.js](https://nodejs.org) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) (running instance or Atlas connection string)

### 1. Clone & Install Dependencies
From the root of the project, run:
```bash
# Install monorepo root dependencies
npm install

# Install frontend dependencies
npm run install-frontend --prefix frontend || (cd frontend && npm install)

# Install backend dependencies
npm run install-backend --prefix backend || (cd backend && npm install)
```

### 2. Configuration (`.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Optional configurations
NODE_ENV=development
```

### 3. Running Locally
Launch both the frontend client and the backend server concurrently with a single command from the root directory:
```bash
npm run dev
```
* **Frontend client** runs on: `http://localhost:5173`
* **Backend API** runs on: `http://localhost:5001`

---

## 🌐 Deployment to Vercel

DorMsa is pre-configured to build and run on Vercel with a single click.

1. **Import the repository** into your Vercel Dashboard.
2. **Environment Variables**: Add your backend environment variables (like `MONGODB_URI` and `JWT_SECRET`) in Vercel's Project Settings under "Environment Variables".
3. **Deploy**: Vercel will build the React frontend using Vite and host the Express server under serverless endpoints (`/api/*`) using the provided `vercel.json` configurations.
