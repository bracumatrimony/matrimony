const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const { errorHandler, notFound } = require("./middleware/errorHandler");

dotenv.config();

global.SERVER_STARTUP_TIME = Date.now();

const app = express();
const PORT = process.env.PORT || 5000;

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

const allowedOrigins = [
  "https://www.campusmatrimony.com",
  "https://campusmatrimony-server.vercel.app",
  "http://localhost:5173",
];

if (process.env.FRONTEND_URL) {
  let frontendUrl = process.env.FRONTEND_URL;

  if (
    !frontendUrl.startsWith("http://") &&
    !frontendUrl.startsWith("https://")
  ) {
    const protocol = frontendUrl.includes("localhost") ? "http://" : "https://";
    frontendUrl = protocol + frontendUrl;
  }

  if (!allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "production") {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          console.log(`Origin rejected: ${origin}`);
          return callback(new Error("Not allowed by CORS"), false);
        }
      } else {
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(mongoSanitize());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

const path = require("path");
app.use(express.static(path.join(__dirname, "../client/public")));

const connectDB = require("./config/database");

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

app.use(ensureDBConnection);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/drafts", require("./routes/drafts"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/config", require("./routes/config"));
app.use("/api/transactions", require("./routes/transactions"));

app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  res.sendFile(path.join(__dirname, "../client/public/sitemap.xml"));
});

app.get("/", (req, res) => {
  res.json({
    message: "Campus Matrimony API Server",
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
    frontend: "https://campusmatrimony.vercel.app",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    message: "Campus Matrimony API Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

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

app.use("*", notFound);

app.use(errorHandler);

app.listen(PORT, () => {
  const monetizationConfig = require("./config/monetization");
  const config = monetizationConfig.getConfigSummary();

  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed Origins:`, allowedOrigins);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(
    `Monetization : ${config.monetization.toUpperCase()} - ${config.message}`
  );
});

module.exports = app;
