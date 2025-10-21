const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileId: {
      type: String, // Profile ID string (e.g., "BM1001")
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can't bookmark the same profile twice
bookmarkSchema.index({ userId: 1, profileId: 1 }, { unique: true });

// Index for faster queries
bookmarkSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
