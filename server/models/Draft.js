const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One draft per user
    },
    currentStep: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 4,
    },
    draftData: {
      type: mongoose.Schema.Types.Mixed, // Flexible object to store any form data
      required: true,
      default: {},
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update lastModified on save
draftSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});

// Index for efficient queries (userId already has unique: true, so no need for separate index)

module.exports = mongoose.model("Draft", draftSchema);
