const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Profile = require("../models/Profile");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    // User data already available from auth middleware
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, picture } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (picture) user.picture = picture;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// @route   PUT /api/users/credits
// @desc    Update user credits
// @access  Private
router.put("/credits", auth, async (req, res) => {
  try {
    const { credits, operation = "add" } = req.body;

    if (!credits || credits <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credits amount",
      });
    }

    let transactionType = null;
    let transactionDesc = "";
    let updateOperation = {};

    if (operation === "add") {
      updateOperation = { $inc: { credits: credits } };
      transactionType = "credit_addition";
      transactionDesc = `Added ${credits} credits`;
    } else if (operation === "subtract") {
      // Check current credits first to prevent negative values
      if (req.user.credits < credits) {
        return res.status(400).json({
          success: false,
          message: "Insufficient credits",
        });
      }
      updateOperation = { $inc: { credits: -credits } };
      transactionType = "credit_deduction";
      transactionDesc = `Deducted ${credits} credits`;
    }

    // Update user credits atomically
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateOperation,
      { new: true, select: "credits" }
    );

    // Record transaction
    if (transactionType) {
      await Transaction.create({
        user: req.user.id,
        type: transactionType,
        amount: 0,
        credits: credits,
        description: transactionDesc,
      });
    }

    res.json({
      success: true,
      message: "Credits updated successfully",
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.error("Update credits error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update credits",
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete("/account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user's profile if it exists
    await Profile.findOneAndDelete({ userId: req.user.id });

    // Delete the user account
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
});

module.exports = router;

// @route   GET /api/users/transactions
// @desc    Get user's transaction history
// @access  Private
router.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch transactions" });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's profile for view count
    const userProfile = await Profile.findOne({ userId: req.user.id });
    const profileViews = userProfile ? userProfile.viewCount : 0;

    // Count unlocked contacts
    const unlockedContactsCount = user.unlockedContacts
      ? user.unlockedContacts.length
      : 0;

    res.json({
      success: true,
      stats: {
        profileViews: profileViews,
        unlockedContacts: unlockedContactsCount,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user statistics",
    });
  }
});

module.exports = router;
