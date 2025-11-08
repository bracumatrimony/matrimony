const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  getUniversityConfig,
  getAllUniversities,
} = require("../config/universities");

const userSchema = new mongoose.Schema(
  {
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
        return !this.isGoogleUser;
      },
    },

    profileId: {
      type: String,
      unique: true,
      sparse: true,
    },
    university: {
      type: String,
      required: false,
      enum: {
        values: [...Object.keys(getAllUniversities()), null],
        message: "Invalid university",
      },
    },
    picture: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },

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

    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    hasProfile: {
      type: Boolean,
      default: false,
    },

    unlockedContacts: {
      type: [String],
      default: [],
    },

    lastProfileViews: {
      type: Map,
      of: Date,
      default: new Map(),
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    alumniVerified: {
      type: Boolean,
      default: false,
    },
    verificationRequest: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.generateProfileId = async function (universityKey) {
  const universityConfig = getUniversityConfig(universityKey);
  if (!universityConfig) {
    throw new Error(`Invalid university key: ${universityKey}`);
  }

  const { idPrefix, startingID } = universityConfig;

  // Get all profiles for this university
  const allProfiles = await this.find(
    { university: universityKey, profileId: new RegExp(`^${idPrefix}\\d+$`) },
    { profileId: 1 }
  ).lean();

  let nextId = startingID;

  if (allProfiles && allProfiles.length > 0) {
    // Extract numeric IDs and find the highest one
    const numericIds = allProfiles
      .map((profile) => {
        const numPart = profile.profileId.replace(idPrefix, "");
        return parseInt(numPart, 10);
      })
      .filter((num) => !isNaN(num));

    if (numericIds.length > 0) {
      const maxId = Math.max(...numericIds);
      nextId = Math.max(maxId + 1, startingID);
    }
  }

  const profileId = `${idPrefix}${nextId}`;

  // Double-check it doesn't exist (safety check)
  const exists = await this.findOne({ profileId });
  if (exists) {
    // If somehow it exists, increment and try again (max 10 attempts to prevent infinite loop)
    for (let i = 0; i < 10; i++) {
      nextId++;
      const newProfileId = `${idPrefix}${nextId}`;
      const stillExists = await this.findOne({ profileId: newProfileId });
      if (!stillExists) {
        return newProfileId;
      }
    }
    throw new Error("Unable to generate unique profile ID after 10 attempts");
  }

  return profileId;
};

userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
