const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["purchase", "credit_deduction", "credit_addition", "contact_unlock"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved", // Default to approved for existing transactions
  },
  amount: { type: Number, required: true },
  credits: { type: Number }, // Number of credits being purchased (optional for other types)
  price: { type: Number }, // Price paid (for purchases)
  transactionId: { type: String }, // bKash transaction ID
  phoneNumber: { type: String }, // User's phone number for payment
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date }, // When admin approved/rejected
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who processed
});

module.exports = mongoose.model("Transaction", transactionSchema);
