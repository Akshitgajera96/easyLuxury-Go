# 🚌 EasyLuxury Go - Premium Bus Booking Platform

[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)]()
[![Backend](https://img.shields.io/badge/Backend-Express.js-blue?logo=express)]()
[![Frontend](https://img.shields.io/badge/Frontend-React-orange?logo=react)]()
[![Node](https://img.shields.io/badge/Node.js-v16+-green?logo=node.js)]()

A full-stack MERN application for premium bus ticket booking with real-time seat selection, live bus tracking, and comprehensive admin panel.

---

## 🎯 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB)

### Installation

**1. Clone the Repository**
```bash
git clone <repository-url>
cd easyLuxury-Go
```

**2. Backend Setup**
```bash
cd backend
npm install
npm run seed    # Seed database with sample data
npm start       # Start backend server
```
Backend runs on: **http://localhost:4000**

**3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev     # Start frontend server
```
Frontend runs on: **http://localhost:3000**

### 🔑 Default Login Credentials

**Admin:**
- Email: `admin@easyluxury.com`
- Password: `admin123`

**Staff:**
- Email: `staff@easyluxury.com`
- Password: `staff123`

**Customer:**
- Email: `rohit@example.com`
- Password: `customer123`

---

## 🚀 Key Features

### 👥 User Management
- **Multi-role Authentication** - Admin, Staff, and Customer roles
- **Secure JWT Authentication** - Token-based authentication with bcrypt password hashing
- **Profile Management** - Update personal information and preferences
- **Wallet System** - Add money, track balance, and quick top-ups

### 🎫 Booking System
- **Real-time Seat Selection** - Interactive seat layout with Socket.IO
- **Live Seat Locking** - Prevent double bookings with real-time updates
- **Multiple Payment Methods** - Wallet, Credit/Debit Card, UPI, Net Banking
- **Booking Management** - View, cancel, and download tickets
- **PNR-based Tracking** - Track bookings with unique PNR numbers

### 🚌 Fleet & Route Management
- **Bus Management** - Add, edit, and manage bus fleet
- **Route Management** - Create routes with source and destination
- **Trip Scheduling** - Schedule trips with dynamic pricing
- **Live Bus Tracking** - Real-time GPS tracking with MapTiler integration

### 📊 Admin Dashboard
- **Analytics & Insights** - Revenue charts, booking trends, user growth
- **User Management** - View and manage all platform users
- **Booking Oversight** - Monitor and manage all bookings
- **Fleet Analytics** - Bus utilization and performance metrics

### 💰 Advanced Features
- **Smart Wallet** - Quick top-up with instant balance updates
- **Review System** - Rate and review completed trips
- **Promo Codes** - Discount coupons and promotional offers
- **Email Notifications** - Booking confirmations and updates
- **Responsive Design** - Mobile-friendly interface

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js v16+
- **Framework:** Express.js v4.21
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JWT + bcryptjs
- **Real-time:** Socket.IO v4.8
- **Validation:** express-validator
- **Payments:** Razorpay integration

### Frontend
- **Library:** React v18.2
- **Build Tool:** Vite v4.4
- **Styling:** TailwindCSS v3.4
- **Routing:** React Router v6.15
- **Animations:** Framer Motion v10.16
- **HTTP Client:** Axios v1.5
- **Maps:** MapBox GL / MapTiler
- **Notifications:** React Hot Toast

---

## 📦 Project Structure

```
easyLuxury-Go/
├── backend/
│   ├── config/           # Database and configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── scripts/          # Database seeding
│   ├── services/         # Business logic
│   ├── sockets/          # Socket.IO handlers
│   ├── utils/            # Helper functions
│   ├── validations/      # Input validation
│   ├── .env              # Environment variables
│   └── server.js         # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── routes/       # Route configuration
│   │   ├── services/     # API service layer
│   │   ├── socket/       # Socket.IO client
│   │   ├── App.jsx       # Root component
│   │   └── main.jsx      # Entry point
│   ├── .env              # Environment variables
│   └── vite.config.ts    # Vite configuration
│
└── README.md             # This file
```

---

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/easyLuxuryGo

# JWT Secret (use a strong random string)
JWT_SECRET=your_secure_jwt_secret_key_here

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=admin@easyluxury.com
ADMIN_PASSWORD_HASH=$2a$12$hash_here

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000

# MapTiler API Key (for live tracking)
VITE_MAPTILER_API_KEY=your_maptiler_api_key
```

**Get MapTiler API Key:**
1. Visit [maptiler.com](https://www.maptiler.com/)
2. Sign up for a free account
3. Go to Cloud → API Keys
4. Create and copy your API key

---

## 📚 User Workflows

### Customer Journey: Book a Trip

1. **Search Trips** - Enter source, destination, and travel date
2. **Select Seats** - Choose seats from interactive layout (real-time locking)
3. **Enter Passenger Details** - Add name, age, and gender for each seat
4. **Make Payment** - Pay via wallet, card, UPI, or net banking
5. **Get Confirmation** - Receive PNR and booking details
6. **Download Ticket** - Download ticket in text format
7. **Track Bus** - Live GPS tracking of your bus (optional)

### Admin Journey: Manage Platform

1. **Dashboard** - View analytics, revenue, and statistics
2. **Add Bus** - Create new bus with amenities and seat layout
3. **Create Route** - Define source, destination, and pricing
4. **Schedule Trip** - Assign bus to route with departure time
5. **Monitor Bookings** - View and manage all platform bookings
6. **Manage Users** - Control user access and roles

### Staff Journey: Handle Bookings

1. **View Bookings** - Access all bookings for assigned trips
2. **Confirm Bookings** - Verify and confirm pending bookings
3. **Check Passengers** - View passenger lists for trips
4. **Complete Trip** - Mark trips as completed after journey

---

## 🗄️ Database Seeding

Seed the database with sample data:

```bash
cd backend
npm run seed
```

**Seeded Data:**
- **Users:** 1 Admin, 3 Staff, 5 Customers (with wallet balances)
- **Buses:** 6 buses (Sleeper, Semi-Sleeper, Seater with amenities)
- **Routes:** 8 major routes (Mumbai-Pune, Delhi-Jaipur, etc.)
- **Trips:** 100+ scheduled trips for the next 7 days

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - User login
POST   /api/v1/auth/admin/login       - Admin login
POST   /api/v1/auth/staff/login       - Staff login
GET    /api/v1/auth/profile           - Get current user profile
```

### Trips & Bookings
```
GET    /api/v1/trips/search           - Search trips
GET    /api/v1/trips/:id              - Get trip details
POST   /api/v1/bookings               - Create booking
GET    /api/v1/bookings/mybookings    - Get user bookings
PUT    /api/v1/bookings/:id/cancel    - Cancel booking
```

### User & Wallet
```
GET    /api/v1/users/profile          - Get user profile
PUT    /api/v1/users/profile          - Update profile
POST   /api/v1/users/wallet/add       - Add money to wallet
GET    /api/v1/users/wallet/balance   - Get wallet balance
```

### Admin Routes
```
GET    /api/v1/admin/analytics/dashboard  - Dashboard statistics
GET    /api/v1/admin/bookings             - Get all bookings
GET    /api/v1/admin/users                - Get all users
POST   /api/v1/buses                      - Create bus
POST   /api/v1/routes                     - Create route
POST   /api/v1/trips                      - Create trip
```

### Staff Routes
```
GET    /api/v1/staff/bookings             - Get all bookings
PATCH  /api/v1/staff/bookings/:id/status  - Update booking status
```

---

## 🎨 Frontend Pages

### Public Pages
- **HomePage** - Hero section with trip search
- **LoginPage** - Multi-role login (Customer/Admin/Staff)
- **RegisterPage** - Customer registration
- **TripPage** - Search results and available trips
- **BookingPage** - 3-step booking flow (Seats → Details → Payment)

### Customer Pages
- **ProfilePage** - User profile management
- **MyBookingsPage** - View and manage bookings
- **WalletPage** - Wallet management and top-up
- **TrackBusPage** - Live bus tracking with GPS
- **ReviewsPage** - Rate and review trips

### Admin Pages
- **DashboardPage** - Analytics and statistics
- **ManageBusesPage** - Bus fleet management
- **ManageRoutesPage** - Route management
- **ManageTripsPage** - Trip scheduling
- **ManageBookingsPage** - Booking oversight
- **ManageUsersPage** - User management
- **AnalyticsPage** - Advanced analytics

### Staff Pages
- **StaffDashboardPage** - Staff overview
- **StaffBookingsPage** - Booking management
- **StaffTripsPage** - Trip management
- **PassengerListPage** - Passenger details

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check MongoDB connection
# Verify MONGO_URI in backend/.env

# Port already in use
# Change PORT in .env or kill process on port 4000

# Dependencies issue
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Won't Start
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API Calls Failing
```bash
# Verify backend is running on port 4000
# Check VITE_API_BASE_URL in frontend/.env
# Should be: http://localhost:4000/api/v1
```

### Socket.IO Issues
```bash
# Check VITE_SOCKET_URL in frontend/.env
# Should be: http://localhost:4000
# Verify Socket.IO is running in backend logs
```

---

## 🚀 Deployment

### Render Deployment (Recommended)

This project is ready for easy deployment to Render.com:

1. **Connect GitHub Repository** to Render
2. **Set Required Environment Variables** (see checklist)
3. **Deploy** - Render will automatically deploy both services

**Quick Start:**
- Backend will be available at: `https://easyluxury-backend.onrender.com`
- Frontend will be available at: `https://easyluxury-frontend.onrender.com`

### Required Environment Variables

**Backend:**
```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=auto_generated_by_render
NODE_ENV=production
FRONTEND_URL=https://easyluxury-frontend.onrender.com
ADMIN_PASSWORD=your_secure_password
```

**Frontend:**
```env
VITE_API_BASE_URL=https://easyluxury-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://easyluxury-backend.onrender.com
VITE_MAPTILER_API_KEY=your_api_key
```

### Other Platforms (Heroku / Railway / Vercel / Netlify)

1. Build for production: `npm run build`
2. Set environment variables (see above)
3. Deploy with platform CLI or connect GitHub repo

**⚠️ Important:** Frontend environment variables must be set BEFORE building, as Vite embeds them at build time.

---

## 📄 License

ISC License

---

## 👨‍💻 Author

**Akshit Gajera**

---

## 🙏 Acknowledgments

Built with the MERN stack and modern web technologies. Special thanks to the open-source community for the amazing tools and libraries.

---

## ✨ Production Ready

### Recent Optimizations
- ✅ Removed all rate limiting for unlimited requests
- ✅ Cleaned up debug console.log statements
- ✅ Removed unnecessary .md documentation files
- ✅ Optimized database connection pooling (50 connections)
- ✅ Streamlined location scheduler (runs every 2 minutes)
- ✅ Enhanced error handling across all services
- ✅ Production-ready configuration verified

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Ensure all dependencies are installed
4. Verify environment variables are set correctly

---

**🎉 Ready to use! Start the backend and frontend servers to begin.**
