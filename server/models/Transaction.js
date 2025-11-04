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
    default: "approved", 
  },
  amount: { type: Number, required: true },
  credits: { type: Number }, 
  price: { type: Number }, 
  transactionId: { type: String }, 
  phoneNumber: { type: String }, 
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date }, 
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
});

module.exports = mongoose.model("Transaction", transactionSchema);
