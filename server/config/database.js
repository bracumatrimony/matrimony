const mongoose = require("mongoose");


let cachedConnection = null;

const connectDB = async () => {
  try {
    
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once("connected", resolve);
      });
      return mongoose.connection;
    }

    
    const options = {
      maxPoolSize: 10, 
      minPoolSize: 2, 
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
      family: 4, 
      maxIdleTimeMS: 10000, 
      
      bufferCommands: false,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    
    cachedConnection = conn.connection;

    
    mongoose.connection.on("connected", () => {});

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
      cachedConnection = null; 
    });

    mongoose.connection.on("disconnected", () => {
      cachedConnection = null; 
    });

    
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
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
    cachedConnection = null; 
    throw error; 
  }
};

module.exports = connectDB;
