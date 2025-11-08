const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const connectDB = require("../config/database");

dotenv.config();

const makeAdmin = async (email) => {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === "admin") {
      console.log(`User ${email} is already an admin`);
      process.exit(0);
    }

    // Update role to admin
    user.role = "admin";
    await user.save();

    console.log(`Successfully made ${email} an admin`);
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.name}`);
  } catch (error) {
    console.error("Error making user admin:", error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Hardcode the email to make admin
const email = "campusmatrimony@gmail.com"; // Replace with the actual email address

makeAdmin(email);
