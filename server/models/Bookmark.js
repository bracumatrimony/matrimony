const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileId: {
      type: String, 
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


bookmarkSchema.index({ userId: 1, profileId: 1 }, { unique: true });


bookmarkSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
