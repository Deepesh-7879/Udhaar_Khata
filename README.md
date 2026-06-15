# Digital Udhaar Khata 

**Digital Udhaar Khata** is a premium, production-ready, full-stack SaaS web application designed for local Kirana stores, grocery merchants, and small retail businesses to digitize their traditional paper-based customer credit notebooks (*Udhaar Khata*). 

With multi-shop data isolation, shopkeeper-employee role management, atomic transaction ledger tracking, automatic pending dues calculation, dynamic UPI QR payment codes, customer account reminders (SMS/WhatsApp), and offline downloadable financial reports (PDF/CSV), it replaces the vulnerability and clutter of paper logs with an elegant, ultra-modern digital system.

---

##  Features

###  Multi-Shop SaaS Architecture
*   **Total Data Isolation**: Complete data separation using shop-specific scoping (`shopId`) across all collections.
*   **Multi-Role Authorization**: Shop Owners can manage employees and delete records, while Employees can manage customers and log transactions under the owner's shop, but are restricted from deleting critical accounts (403 Forbidden).

### Transaction Ledger & Atomic Calculations
*   **Real-time Arithmetic**: Instant balance tracking. Credits add to dues, debits (payments) reduce them.
*   **Self-Healing Session Fallback**: Backend automatically detects MongoDB standalone local instances vs. Atlas Replica Sets to execute queries safely with atomic guarantees where possible, bypassing session limits transparently on local environments.

###  Visual Analytics Dashboard
*   **Interactive Charts**: Beautiful financial charts detailing daily transaction volumes (Credit vs. Debit) over the past 7 days using **Recharts**.
*   **Metric Cards**: High-impact cards representing total pending dues, total customer base, monthly collections, and credit extensions.

###  Dynamic Payments & Reminders
*   **Instant UPI QR Code Generator**: Renders standard merchant UPI QR payment codes instantly inside the customer drawer using the store's configured UPI ID.
*   **Twilio Reminder Integrations**: Dispatches SMS/WhatsApp payment links and ledger statements directly to customers. Standard console logging simulation kicks in when Twilio credentials are omitted in development mode.

###  Professional Export Capabilities
*   **Ledger PDFs**: Premium downloadable customer transaction statements generated client-side via **jsPDF** and **jsPDF-AutoTable**.
*   **Ledger CSVs**: Fast download of detailed report matrices for bookkeeping or accountants.

---

##  Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v3, Axios, React Router 7, Recharts, jsPDF, Lucide React |
| **Backend** | Node.js, Express 5, Mongoose 9 (MongoDB), JSON Web Tokens (JWT), BcryptJS |
| **Security** | Helmet (Headers), Express Mongo Sanitize (NoSQL Protection), Express Rate Limit |
| **Simulations** | Built-in Console Notifier Service fallback for Twilio SMS/WhatsApp |

---

##  Codebase Directory Structure

```
Udhaar_Khata/
├── Backend/                    # Node.js + Express + Mongoose Backend
│   ├── config/                 # Database Connection configuration
│   ├── controllers/            # Express controllers (auth, customer, transaction, dashboard, etc.)
│   ├── middleware/             # Authorization, Error, and Custom Sanitizer Middlewares
│   ├── models/                 # Mongoose schemas (User, Customer, Transaction, Reminder)
│   ├── routes/                 # API endpoint definitions
│   ├── services/               # Twilio & SMS notifier services
│   ├── testApi.js              # 10-Point E2E Backend Integration Test script
│   └── server.js               # Application Entrypoint
├── Frontend/                   # React + Vite + Tailwind Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Shared UI components (ProtectedRoute, etc.)
│   │   ├── context/            # AuthContext session managers
│   │   ├── layouts/            # Dashboard sidebar, drawer, header layout wrapper
│   │   ├── pages/              # Dashboard, Customers, Details, Settings, Login, Register
│   │   ├── services/           # Axios HTTP base API setup
│   │   ├── App.jsx             # React router structure
│   │   ├── index.css           # Custom CSS styling layer & Tailwind directives
│   │   └── main.jsx            # React client mount point
│   ├── tailwind.config.js      # Custom theme, colors, and premium shadow tokens
│   └── vite.config.js          # Vite build manager
```

---

##  Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended; natively tested on Node.js v24)
*   [MongoDB](https://www.mongodb.com/) running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

---

###  Local Setup & Execution

#### 1. Database & Backend Configuration
1.  Navigate into the `Backend` directory:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
    Configure the following values inside `.env`:
    ```env
    PORT=
    MONGO_URI=
    JWT_SECRET=
    JWT_EXPIRE=
    
    # Twilio Configuration (Optional - Simulator active when empty)
    TWILIO_ACCOUNT_SID=
    TWILIO_AUTH_TOKEN=
    TWILIO_PHONE_NUMBER=
    TWILIO_WHATSAPP_NUMBER=
    ```

4.  Start the backend development server:
    ```bash
    npm run dev
    ```
    *The server will run on `http://localhost:5000`.*

---

#### 2. Frontend Configuration & Execution
1.  Navigate into the `Frontend` directory:
    ```bash
    cd ../Frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend dev server:
    ```bash
    npm run dev
    ```
    *Vite will boot the dashboard on `http://localhost:5174` (or `5173`).*

---

##  Running Automated E2E API Tests

A dedicated, comprehensive 10-Point Integration Test script has been created to instantly verify the robustness, mathematical calculations, security scoping, and user role mechanics of the system.

To run the automated API suite:
1.  Ensure the backend server is running on `http://localhost:5000`.
2.  Open a terminal inside the `Backend` folder and run:
    ```bash
    node testApi.js
    ```

The test script automatically:
1.  Registers a unique, random shopowner.
2.  Authenticates the shopowner and receives a secure JWT token.
3.  Creates a new customer record initialized to ₹0.00.
4.  Queries the customer list to confirm data exists and is accessible.
5.  Adds a Credit (lending) transaction of ₹2,500.00, validating that customer balance rises to ₹2,500.00.
6.  Adds a Debit (payment) transaction of ₹1,000.00, validating that customer balance falls to ₹1,500.00.
7.  Retrieves dashboard stats to check aggregation logic, verifying pending dues are exactly ₹1,500.00 and customer count is 1.
8.  Registers a scoped employee under the owner's shop.
9.  Logs in as the employee, reads the same customer ledger, and confirms they can view matching values.
10. Verifies role authorization by attempting to delete the customer as the employee, asserting a `403 Forbidden` response.
11. Dispatches WhatsApp notifications using Twilio simulator fallbacks.

---

##  Production Deployment Checklist

### Backend Deployment (Render / Heroku)
1.  Mount your repository on **Render** as a Web Service.
2.  Configure Environment variables inside Render settings:
    *   Set `MONGO_URI` to point to a production **MongoDB Atlas cluster** (local connections won't work in the cloud).
    *   Generate a long, highly secure `JWT_SECRET`.
    *   Set `NODE_ENV` to `production`.
3.  Update the allowed CORS origins in `Backend/server.js` to whitelist your production Vercel frontend URL.

### Frontend Deployment (Vercel / Netlify)
1.  Deploy the `Frontend` folder to **Vercel**.
2.  Ensure your base URL points to the live backend server address. This is configured in `Frontend/src/services/api.js`.
3.  Build command should be `npm run build` and output directory is `dist`.

---

## 💎 Design & UI Aesthetics
*   ** Harmonious Color Palette**: Utilizes highly customized Indigo (`primary`), Emerald (`success`), Rose (`danger`), and Slate HSL Tailwind tokens for a modern, sleek interface.
*   **Premium Glassmorphic Layout**: Responsive sticky sidebars, frosted glass cards, custom input shadows, and smooth transition animations make the application look incredibly high-end.
*   **No Placeholders**: Real interactive tables, charts, live UPI QR graphics, and interactive reminders give a production-ready operational feel.

---

### 🇮🇳 *Empowering Local Retailers & Kiranas with Modern Digital Ledger Tools.*
