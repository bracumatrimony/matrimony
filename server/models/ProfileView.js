const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only have one view record per profile
profileViewSchema.index({ userId: 1, profileId: 1 }, { unique: true });

// Index for efficient queries
profileViewSchema.index({ userId: 1, viewedAt: -1 });

module.exports = mongoose.model("ProfileView", profileViewSchema);
