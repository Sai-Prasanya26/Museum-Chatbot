# Museum Explorer — Full-Stack Museum Chatbot & Ticket Booking System

A production-grade, unified full-stack web application for discovering Indian cultural heritage, exploring 360° virtual reality monument tours, checking verified museum visiting hours, chatting with an intelligent database-aware AI assistant (**QBot**), and booking authorized e-tickets with instant QR-coded confirmation.

---

## 🏛️ Key Features

- **Authoritative MySQL Database**:
  - 183 verified Indian museums across 29 states and union territories, directly extracted from `Museums_Ticket_Prices.xlsx`.
  - Zero mock data; all user accounts, museum records, booking transactions, and audit logs persist in relational tables.
- **Server-Side Authoritative Pricing**:
  - The client UI calculates preview totals, but the backend server queries the MySQL database directly to compute the authoritative total price: `(adults × adult_price) + (children × child_price) + (seniors × senior_price)`.
- **Intelligent Conversational QBot**:
  - Natural Language Processing engine connected directly to MySQL models.
  - Answers complex questions regarding opening hours, holiday closures, pricing breakdowns, state-wise catalog lookups, and user-specific active bookings.
- **Interactive 360° VR Monument Experiences**:
  - 8 featured historical monuments (Charminar, Taj Mahal, Golconda Fort, Hawa Mahal, Qutub Minar, Statue of Unity, Konark Sun Temple, Khajuraho Temple) featuring 360° virtual reality tours and Google Maps location integration.
- **Secure Authentication & Payments**:
  - JWT (JSON Web Token) authentication with salted bcrypt password hashing.
  - Multi-method checkout supporting UPI QR code scanning and Credit/Debit card simulation with atomic MySQL transactions and instant rollback handling.
- **Printable E-Tickets with QR Passports**:
  - Confirmed bookings generate a unique reference (`MUS-2026-XXXXXXXX`) and instant digital gate passes formatted for physical print or PDF download (`window.print()`).
- **Complete Booking Management**:
  - Dedicated "My Bookings" dashboard with real-time status badges, transaction ID verification, and atomic self-service ticket cancellation.

---

## 📁 Repository Structure

```
Museum Project/
├── backend/
│   ├── config/
│   │   ├── config.js               # Centralized configuration & environment loader
│   │   └── db.js                   # MySQL2 connection pool with health checking
│   ├── controllers/
│   │   ├── authController.js       # Register, login, and current user profile
│   │   ├── museumController.js     # Catalog browsing, state filtering, and search
│   │   ├── bookingController.js    # Authoritative ticket booking and cancellation
│   │   ├── paymentController.js    # Payment verification and transaction lookup
│   │   └── chatbotController.js    # QBot conversational messaging endpoint
│   ├── database/
│   │   ├── schema.sql              # MySQL DDL (users, museums, bookings, transactions)
│   │   └── seedMuseums.js          # Excel parser seeding 183 museums & test accounts
│   ├── data/
│   │   └── Museums_Ticket_Prices.xlsx # Authoritative source dataset
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification & request attachment
│   │   ├── adminMiddleware.js      # Role-based access control (RBAC)
│   │   ├── validationMiddleware.js # Input sanitizer & request body validation
│   │   └── errorMiddleware.js      # Centralized 404 & 500 error handlers
│   ├── models/
│   │   ├── userModel.js            # User entity SQL queries
│   │   ├── museumModel.js          # Museum entity SQL queries
│   │   ├── bookingModel.js         # Booking entity SQL queries & atomic operations
│   │   └── transactionModel.js     # Payment audit SQL queries
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── museumRoutes.js         # /api/museums
│   │   ├── bookingRoutes.js        # /api/bookings
│   │   ├── paymentRoutes.js        # /api/payments
│   │   └── chatbotRoutes.js        # /api/chatbot
│   ├── services/
│   │   ├── bookingService.js       # Atomic transaction booking coordinator
│   │   ├── paymentService.js       # Payment simulator & audit recorder
│   │   └── chatbotService.js       # Database-aware NLP response engine
│   ├── utils/
│   │   ├── bookingReference.js     # MUS-2026-XXXX and TXN-XXXX generators
│   │   └── validators.js           # Email, password, and date validators
│   ├── .env                        # Local environment configuration
│   ├── .env.example                # Sample environment template
│   ├── package.json                # Dependencies and project scripts
│   └── server.js                   # Express server mounting APIs and static frontend
├── frontend/
│   ├── assets/
│   │   └── images/                 # 21 state photos, UPI QR code, scanner assets
│   ├── css/
│   │   ├── global.css              # Design tokens, variables, typography, navigation
│   │   ├── auth.css                # Login and registration styling
│   │   ├── homepage.css            # Hero carousel, category cards, monuments grid
│   │   ├── museums.css             # Search, filter bar, cards, and detail page layout
│   │   ├── booking.css             # Ticket counter rows, summary sticky card, history
│   │   ├── payment.css             # Method tabs, QR box, card input formatting
│   │   └── chatbot.css             # Floating launcher, conversation bubbles, fullscreen
│   ├── js/
│   │   ├── api.js                  # Centralized REST API client
│   │   ├── common.js               # Auth state detector, profile dropdown, toasts
│   │   ├── auth.js                 # Login and registration validation and token storage
│   │   ├── homepage.js             # Hero carousel auto-timer and hero search box
│   │   ├── museums.js              # Live search debounce and state dropdown filtering
│   │   ├── museum-details.js       # Full museum details, visitor hours, amenities
│   │   ├── booking.js              # Date picker, visitor counters, and order summary
│   │   ├── payment.js              # Tab switcher, card formatters, and payment submission
│   │   ├── confirmation.js         # Reference lookup, print tickets, gate pass QR
│   │   ├── mybookings.js           # Booking history cards and cancellation handler
│   │   └── chatbot.js              # Conversational QBot engine with interactive chips
│   ├── monuments/
│   │   ├── charminar.html          # Charminar history, 360° VR, and direct booking
│   │   ├── golcondafort.html       # Golconda Fort history, 360° VR, and direct booking
│   │   ├── hawamahal.html          # Hawa Mahal history, 360° VR, and direct booking
│   │   ├── khajurahotemple.html    # Khajuraho history, 360° VR, and direct booking
│   │   ├── konarksuntemple.html    # Konark Sun Temple, 360° VR, and direct booking
│   │   ├── qutubminar.html         # Qutub Minar, 360° VR, and direct booking
│   │   ├── statue-of-unity.html    # Statue of Unity, 360° VR, and direct booking
│   │   └── tajmahal.html           # Taj Mahal, 360° VR, and direct booking
│   ├── pages/
│   │   ├── homepage.html           # Primary landing portal
│   │   ├── museums.html            # 180+ museums catalog with filters
│   │   ├── museum-details.html     # Single museum details and pricing
│   │   ├── booking.html            # Ticket selection and visit date configuration
│   │   ├── payment.html            # UPI QR & card checkout screen
│   │   ├── booking-confirmation.html # Printable ticket pass with QR code
│   │   ├── mybookings.html         # User booking management and cancellations
│   │   ├── chatbot.html            # Standalone fullscreen QBot AI Assistant
│   │   ├── login.html              # User login screen with auto-fill test buttons
│   │   └── register.html           # New user registration screen
│   └── index.html                  # Root entry redirecting to /pages/homepage.html
├── .gitignore                      # Git ignore file
└── README.md                       # Comprehensive documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Runtime** | Node.js (v18+) |
| **Web Framework** | Express 5 |
| **Database** | MySQL 8.0+ via `mysql2/promise` (Connection Pooling & Transactions) |
| **Authentication** | JWT (`jsonwebtoken`) & `bcrypt` |
| **Spreadsheet Engine** | `xlsx` (SheetJS) |
| **Frontend Architecture**| Vanilla HTML5, CSS3 Modern Flexbox/Grid, ES6 Modules / Classes |
| **Icons & Fonts** | FontAwesome 6, Inter font family |
| **Virtual Reality** | Google Earth 360° VR integration |

---

## ⚙️ Prerequisites & Setup

### 1. Requirements
- Node.js (v18.0.0 or higher recommended)
- MySQL Server 8.0 or MariaDB

### 2. Configure Environment Variables
Inside `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=museum_booking
DB_CONNECTION_LIMIT=10

# JWT Security
JWT_SECRET=super_secret_jwt_museum_key_2026_production
JWT_EXPIRES_IN=7d
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Initialize Database Schema & Seed Data
Execute the seeding script to create tables (`users`, `museums`, `bookings`, `transactions`) and import all 183 museums directly from `backend/data/Museums_Ticket_Prices.xlsx`:
```bash
node backend/database/seedMuseums.js
```

### 5. Launch the Application
```bash
node backend/server.js
```

Access the application in your browser:
```
http://localhost:5000
```

---

## 🧪 Testing

The codebase includes an automated end-to-end integration test suite verifying health checks, authentication, catalog queries, authoritative pricing, transactions, chatbot NLP responses, and ticket cancellations:

```bash
node backend/scratch/testE2E.js
# Or run with node:
node -e "require('./scratch/testE2E')"
```

---

## 🔑 Test Accounts

The database comes pre-seeded with ready-to-use testing accounts:

| Role | Email | Password |
|---|---|---|
| **Registered Traveler** | `test@museum.com` | `Test@1234` |
| **Platform Administrator**| `admin@museum.com`| `Admin@1234` |

---

## 📡 Complete REST API Documentation

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`username`, `email`, `password`).
- `POST /api/auth/login` — Authenticate user and receive signed JWT.
- `GET /api/auth/me` — Retrieve current authenticated user profile (Requires `Bearer <token>`).

### 2. Museums (`/api/museums`)
- `GET /api/museums` — Fetch museums with optional query filters (`?search=...&state=...`).
- `GET /api/museums/states` — List all distinct Indian states & UTs present in the database.
- `GET /api/museums/search?q=keyword` — Perform full-text search across museum names, cities, and states.
- `GET /api/museums/:id` — Retrieve comprehensive details for a specific museum by ID.
- `GET /api/museums/state/:stateName` — Retrieve museums filtered by state.

### 3. Bookings (`/api/bookings`)
- `POST /api/bookings` — Create a new booking. The backend calculates authoritative pricing, verifies availability, and commits an atomic MySQL transaction (Requires `Bearer <token>`).
- `GET /api/bookings/my-bookings` — Retrieve all bookings for the currently authenticated user.
- `GET /api/bookings/:id` — Get single booking details by numeric ID.
- `GET /api/bookings/reference/:ref` — Get booking and transaction details by reference string (e.g. `MUS-2026-XXXXXXXX`).
- `PATCH /api/bookings/:id/cancel` — Cancel an active booking and mark the associated transaction as refunded.

### 4. Payments (`/api/payments`)
- `POST /api/payments/process` — Process secure payment (UPI / Card) and log audit record in `transactions` table.
- `GET /api/payments/transaction/:ref` — Fetch transaction audit record by reference number (`TXN-XXXXXXXX`).

### 5. Chatbot (`/api/chatbot`)
- `POST /api/chatbot/message` — Send natural language query to QBot. Responds with database information, ticket pricing, visiting hours, or user-specific bookings.

---

## 📜 License

© 2026 Museum Explorer. Developed and maintained as a unified full-stack web application.
