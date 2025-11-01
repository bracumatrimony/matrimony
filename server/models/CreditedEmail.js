const mongoose = require("mongoose");

const creditedEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
creditedEmailSchema.index({ email: 1 });

module.exports = mongoose.model("CreditedEmail", creditedEmailSchema);
