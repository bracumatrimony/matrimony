const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // The profile being reported
    reportedProfileId: {
      type: String,
      required: true,
      ref: "Profile",
    },

    // The user who made the report
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    // Report details
    reason: {
      type: String,
      required: true,
      enum: [
        "Fake information",
        "Inappropriate behavior",
        "Spam/Scam",
        "Harassment",
        "Inappropriate photos",
        "Other",
      ],
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Report status
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Admin actions
    adminNotes: {
      type: String,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Resolution details
    actionTaken: {
      type: String,
      enum: [
        "none",
        "warning_sent",
        "profile_suspended",
        "profile_removed",
        "dismissed",
      ],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
reportSchema.index({ reportedProfileId: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
