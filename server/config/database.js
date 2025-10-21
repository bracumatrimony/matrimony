const mongoose = require("mongoose");

// Cache the MongoDB connection across serverless function invocations
let cachedConnection = null;

const connectDB = async () => {
  try {
    // Check if already connected (reuse connection for serverless)
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log("♻️  Reusing cached MongoDB connection");
      return cachedConnection;
    }

    // If connection exists but is not ready, wait for it
    if (mongoose.connection.readyState === 2) {
      console.log("⏳ MongoDB connection in progress, waiting...");
      await new Promise((resolve) => {
        mongoose.connection.once("connected", resolve);
      });
      return mongoose.connection;
    }

    // MongoDB connection options optimized for serverless environments
    const options = {
      maxPoolSize: 10, // Increased for better performance
      minPoolSize: 2, // Maintain minimum connections
      serverSelectionTimeoutMS: 5000, // Faster timeout for cold starts
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      maxIdleTimeMS: 10000, // Close idle connections after 10 seconds
      // Buffering false for serverless - fail fast instead of buffering
      bufferCommands: false,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // Cache the connection
    cachedConnection = conn.connection;

    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("🔗 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
      cachedConnection = null; // Clear cache on error
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ Mongoose disconnected from MongoDB");
      cachedConnection = null; // Clear cache on disconnect
    });

    // Graceful shutdown (for non-serverless environments)
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("📴 MongoDB connection closed through app termination");
        process.exit(0);
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
        process.exit(1);
      }
    });

    return cachedConnection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("Full error:", error);
    cachedConnection = null; // Clear cache on error
    throw error; // Re-throw to let caller handle
  }
};

module.exports = connectDB;
