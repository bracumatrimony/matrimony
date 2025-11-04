const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();




router.post("/purchase", auth, async (req, res) => {
  try {
    const { credits, price, transactionId, phoneNumber } = req.body;

    if (
      !credits ||
      credits <= 0 ||
      !price ||
      price <= 0 ||
      !transactionId ||
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: credits, price, transactionId, phoneNumber",
      });
    }

    
    const transaction = await Transaction.create({
      user: req.user.id,
      type: "purchase",
      status: "pending",
      amount: price,
      credits: credits,
      price: price,
      transactionId: transactionId,
      phoneNumber: phoneNumber,
      description: `Credit purchase: ${credits} credits for ৳${price}`,
    });

    res.json({
      success: true,
      message:
        "Purchase order submitted successfully. Please wait for admin verification.",
      transaction: {
        id: transaction._id,
        credits: transaction.credits,
        price: transaction.price,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit purchase order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit purchase order",
    });
  }
});




router.get("/pending", [auth, adminAuth], async (req, res) => {
  try {
    const pendingTransactions = await Transaction.find({ status: "pending" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: pendingTransactions,
    });
  } catch (error) {
    console.error("Get pending transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending transactions",
    });
  }
});




router.get("/all", [auth, adminAuth], async (req, res) => {
  try {
    const allTransactions = await Transaction.find({
      status: { $in: ["approved", "rejected"] },
    })
      .populate("user", "name email phone")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get all transactions",
    });
  }
});


router.put("/:id/approve", [auth, adminAuth], async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Transaction is not pending",
      });
    }

    
    transaction.status = "approved";
    transaction.processedAt = new Date();
    transaction.processedBy = req.user.id;
    await transaction.save();

    
    await User.findByIdAndUpdate(transaction.user, {
      $inc: { credits: transaction.credits },
    });

    
    await Transaction.create({
      user: transaction.user,
      type: "credit_addition",
      status: "approved",
      amount: 0,
      credits: transaction.credits,
      description: `Credits added after purchase approval: ${transaction.credits} credits`,
    });

    res.json({
      success: true,
      message: "Transaction approved and credits added successfully",
    });
  } catch (error) {
    console.error("Approve transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve transaction",
    });
  }
});




router.put("/:id/reject", [auth, adminAuth], async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Transaction is not pending",
      });
    }

    
    transaction.status = "rejected";
    transaction.processedAt = new Date();
    transaction.processedBy = req.user.id;
    await transaction.save();

    res.json({
      success: true,
      message: "Transaction rejected successfully",
    });
  } catch (error) {
    console.error("Reject transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject transaction",
    });
  }
});




router.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Transaction.find({
      user: req.user.id,
      type: "purchase",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
    });
  }
});




router.get("/history", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      type: { $in: ["credit_addition", "credit_deduction"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      transactions: transactions,
    });
  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
    });
  }
});

module.exports = router;
