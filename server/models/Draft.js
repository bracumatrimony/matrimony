const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    currentStep: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 4,
    },
    draftData: {
      type: mongoose.Schema.Types.Mixed, 
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


draftSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});



module.exports = mongoose.model("Draft", draftSchema);
