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


profileViewSchema.index({ userId: 1, profileId: 1 }, { unique: true });


profileViewSchema.index({ userId: 1, viewedAt: -1 });

module.exports = mongoose.model("ProfileView", profileViewSchema);
