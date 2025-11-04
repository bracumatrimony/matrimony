const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    
    reportedProfileId: {
      type: String,
      required: true,
      ref: "Profile",
    },

    
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    
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

    
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },

    
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    
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


reportSchema.index({ reportedProfileId: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
