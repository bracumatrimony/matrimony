const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Middleware
const allowedOrigins = [
  "https://bracumatrimony.vercel.app",
  "https://bracumatrimony2.vercel.app",
  "https://bracu-matrimony-backend.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Add FRONTEND_URL from environment if it exists and not already included
if (process.env.FRONTEND_URL) {
  let frontendUrl = process.env.FRONTEND_URL;

  // Add https:// if no protocol is specified for production URLs
  if (
    !frontendUrl.startsWith("http://") &&
    !frontendUrl.startsWith("https://")
  ) {
    // For localhost, use http, for everything else use https
    const protocol = frontendUrl.includes("localhost") ? "http://" : "https://";
    frontendUrl = protocol + frontendUrl;
  }

  // Only add if not already included
  if (!allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
}

// CORS configuration - strict whitelist enforcement
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, in-app browsers)
      if (!origin) return callback(null, true);

      // In production, strictly enforce whitelist
      if (process.env.NODE_ENV === "production") {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          console.log(`❌ Origin rejected: ${origin}`);
          return callback(new Error("Not allowed by CORS"), false);
        }
      } else {
        // Development: allow localhost and configured origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Length"],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);

// Body parsing and sanitization middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Sanitize data to prevent MongoDB injection
app.use(mongoSanitize());

// Additional security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
// ...existing code...

// Serve static files from client's public directory
const path = require("path");
app.use(express.static(path.join(__dirname, "../client/public")));

// MongoDB Connection
const connectDB = require("./config/database");

// Database connection middleware - ensures DB is connected before processing requests
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(503).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

// Apply database connection middleware to all routes
app.use(ensureDBConnection);

// Preflight requests handled by CORS middleware

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/drafts", require("./routes/drafts"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/config", require("./routes/config"));
app.use("/api/transactions", require("./routes/transactions"));

// Serve sitemap.xml with correct XML headers
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  res.sendFile(path.join(__dirname, "../client/public/sitemap.xml"));
});

// Root route - redirect to frontend or show API info
app.get("/", (req, res) => {
  res.json({
    message: "BRACU Matrimony API Server",
    status: "running",
    version: "1.0.0",
    documentation: {
      health: "/api/health",
      endpoints: [
        "/api/auth",
        "/api/users",
        "/api/profiles",
        "/api/admin",
        "/api/drafts",
        "/api/bookmarks",
        "/api/config",
      ],
    },
    frontend: "https://bracumatrimony.vercel.app",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    message: "BRACU Matrimony API Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Database status endpoint
app.get("/api/db-status", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    message: "Database connection status",
    readyState: mongoose.connection.readyState,
    readyStateText: {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[mongoose.connection.readyState],
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler - must be before error handler
app.use("*", notFound);

// Global error handling middleware - must be last
app.use(errorHandler);

// For Vercel deployment, export the app instead of listening
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    const monetizationConfig = require("./config/monetization");
    const config = monetizationConfig.getConfigSummary();

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Allowed Origins:`, allowedOrigins);
    console.log(
      `📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
    );
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(
      `💰 Monetization : ${config.monetization.toUpperCase()} - ${
        config.message
      }`
    );
  });
}

// Export the Express app for Vercel
module.exports = app;
