const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Profile = require("../models/Profile");
const Bookmark = require("../models/Bookmark");
const Draft = require("../models/Draft");
const ProfileView = require("../models/ProfileView");
const Report = require("../models/Report");
const auth = require("../middleware/auth");

const router = express.Router();




router.get("/profile", auth, async (req, res) => {
  try {
    
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

    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (picture) updateFields.picture = picture;

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(user._id, updateFields, {
        runValidators: false,
      });
    }

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

    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateOperation,
      { new: true, select: "credits" }
    );

    
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




router.delete("/account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    
    const profile = await Profile.findOne({ userId: req.user.id });

    
    await Draft.deleteMany({ userId: req.user.id });
    await Report.deleteMany({ reportedBy: req.user.id });
    await Bookmark.deleteMany({ userId: req.user.id });
    await ProfileView.deleteMany({ userId: req.user.id });

    
    if (profile) {
      await Bookmark.deleteMany({ profileId: profile.profileId });
      await ProfileView.deleteMany({ profileId: profile._id });
    }

    
    await Profile.findOneAndDelete({ userId: req.user.id });

    
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




router.get("/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    
    const userProfile = await Profile.findOne({ userId: req.user.id });
    const profileViews = userProfile ? userProfile.viewCount : 0;

    
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
