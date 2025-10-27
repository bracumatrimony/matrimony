const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          // Allow any valid email for account creation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please enter a valid email address",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (phone) {
          // Optional phone validation - allow empty or valid format
          return (
            !phone ||
            /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))
          );
        },
        message: "Please enter a valid phone number",
      },
    },
    password: {
      type: String,
      minLength: [6, "Password must be at least 6 characters long"],
      required: function () {
        return !this.isGoogleUser; // Password not required for Google users
      },
    },

    // Profile Info
    profileId: {
      type: String,
      unique: true,
      sparse: true,
    },
    picture: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },

    // Authentication
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    isGoogleUser: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // App-specific
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    hasProfile: {
      type: Boolean,
      default: false,
    },

    // Unlocked contact info (array of profileIds)
    unlockedContacts: {
      type: [String],
      default: [],
    },

    // Profile view tracking (to prevent spam views)
    lastProfileViews: {
      type: Map,
      of: Date,
      default: new Map(),
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Alumni verification
    alumniVerified: {
      type: Boolean,
      default: false,
    },
    verificationRequest: {
      type: Boolean,
      default: false,
    },

    // Timestamps
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Hash password with cost of 10 (good balance of security and performance)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to generate unique profile ID
userSchema.statics.generateProfileId = async function () {
  let profileId;
  let exists = true;

  while (exists) {
    profileId = `BRACU${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    exists = await this.findOne({ profileId });
  }

  return profileId;
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

// Create indexes for better performance (excluding fields with unique: true)
// Note: email and profileId already have unique: true, so no need for separate indexes
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
