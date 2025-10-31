const express = require("express");
const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Report = require("../models/Report");
const Bookmark = require("../models/Bookmark");
const Transaction = require("../models/Transaction");
const Draft = require("../models/Draft");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get("/dashboard", [auth, adminAuth], async (req, res) => {
  try {
    // Get profile statistics using aggregation
    const profileStats = await Profile.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalProfiles = profileStats.reduce(
      (sum, stat) => sum + stat.count,
      0
    );
    const pendingApprovals =
      profileStats.find((stat) => stat._id === "pending_approval")?.count || 0;
    const approvedProfiles =
      profileStats.find((stat) => stat._id === "approved")?.count || 0;

    const activeUsers = await User.countDocuments({ isActive: true });

    // Calculate total revenue from approved purchase transactions
    const revenueResult = await Transaction.aggregate([
      { $match: { status: "approved", type: "purchase" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get recent pending profiles
    const recentPending = await Profile.find({ status: "pending_approval" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get report statistics using aggregation
    const reportStats = await Report.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReports = reportStats.reduce((sum, stat) => sum + stat.count, 0);
    const pendingReports =
      reportStats.find((stat) => stat._id === "pending")?.count || 0;

    // Get verification requests count
    const verificationRequests = await User.countDocuments({
      verificationRequest: true,
      alumniVerified: false,
    });

    // Get pending transactions count
    const pendingTransactions = await Transaction.countDocuments({
      status: "pending",
    });

    // Get recent reports
    const recentReports = await Report.find()
      .populate("reportedBy", "name email")
      .populate({
        path: "reportedProfileId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stats: {
        totalProfiles,
        approvedProfiles,
        pendingApprovals,
        totalRevenue,
        activeUsers,
        totalReports,
        pendingReports,
        verificationRequests,
        pendingTransactions,
      },
      recentPending,
      recentReports,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
    });
  }
});

// @route   GET /api/admin/profiles/approved
// @desc    Get all approved profiles
// @access  Private (Admin only)
router.get("/profiles/approved", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { status: "approved" };

    // Add search functionality
    if (search) {
      // First get user IDs that match the search
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = matchingUsers.map((user) => user._id);

      query.$or = [
        { profileId: { $regex: search, $options: "i" } },
        { userId: { $in: userIds } },
      ];
    }

    const profiles = await Profile.find(query)
      .populate("userId", "name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get bookmark counts for these profiles
    const profileIds = profiles.map((p) => p._id);
    const bookmarkCounts = await Bookmark.aggregate([
      { $match: { profileId: { $in: profileIds } } },
      { $group: { _id: "$profileId", count: { $sum: 1 } } },
    ]);

    // Create a map of profileId to bookmark count
    const bookmarkMap = {};
    bookmarkCounts.forEach((item) => {
      bookmarkMap[item._id.toString()] = item.count;
    });

    // Add bookmark count to each profile
    const profilesWithBookmarks = profiles.map((profile) => ({
      ...profile.toObject(),
      bookmarkCount: bookmarkMap[profile._id.toString()] || 0,
    }));

    const total = await Profile.countDocuments(query);

    res.json({
      success: true,
      profiles: profilesWithBookmarks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get approved profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get approved profiles",
    });
  }
});

// @route   GET /api/admin/profiles/pending
// @desc    Get all pending profiles
// @access  Private (Admin only)
router.get("/profiles/pending", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await Profile.find({ status: "pending_approval" })
      .populate("userId", "name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Profile.countDocuments({ status: "pending_approval" });

    res.json({
      success: true,
      profiles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get pending profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending profiles",
    });
  }
});

// @route   PUT /api/admin/profiles/:profileId/approve
// @desc    Approve a profile
// @access  Private (Admin only)
router.put(
  "/profiles/:profileId/approve",
  [auth, adminAuth],
  async (req, res) => {
    try {
      const profile = await Profile.findOne({
        profileId: req.params.profileId,
      }).populate("userId", "name email");

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      console.log(
        `Approving profile ${profile.profileId} for user ${
          profile.userId?._id || "unknown"
        }`
      );

      profile.status = "approved";
      profile.rejectionReason = null;
      profile.isUnderReview = false;
      profile.hasEditPending = false;

      // Ensure biodataId is set
      if (profile.profileId && !profile.biodataId) {
        profile.biodataId = profile.profileId;
      }

      try {
        await profile.save();
        console.log(`Profile ${profile.profileId} saved successfully`);
      } catch (saveError) {
        console.error(
          `Failed to save profile ${profile.profileId}:`,
          saveError
        );
        throw saveError;
      }

      // Send approval email notification
      try {
        if (profile.userId && profile.userId.email && profile.userId.name) {
          await sendEmail(
            profile.userId.email,
            "biodataApproved",
            profile.userId.name
          );
          console.log(`Approval email sent to ${profile.userId.email}`);
        } else {
          console.warn(
            `Cannot send approval email: user not found, no email, or no name for profile ${profile.profileId}. userId: ${profile.userId}`
          );
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the approval if email fails
      }

      res.json({
        success: true,
        message: "Biodata approved successfully",
        profile,
      });
    } catch (error) {
      console.error("Approve profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve profile",
      });
    }
  }
);

// @route   PUT /api/admin/profiles/:profileId/reject
// @desc    Reject a profile
// @access  Private (Admin only)
router.put(
  "/profiles/:profileId/reject",
  [auth, adminAuth],
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const profile = await Profile.findOne({
        profileId: req.params.profileId,
      }).populate("userId", "name email");

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      console.log(
        `Rejecting profile ${profile.profileId} for user ${
          profile.userId?._id || "unknown"
        }`
      );

      profile.status = "rejected";
      profile.rejectionReason = reason;
      profile.isUnderReview = false;
      profile.hasEditPending = false;

      // Ensure biodataId is set
      if (profile.profileId && !profile.biodataId) {
        profile.biodataId = profile.profileId;
      }

      try {
        // Use updateOne to bypass validation issues with required fields
        await Profile.updateOne(
          { profileId: req.params.profileId },
          {
            status: "rejected",
            rejectionReason: reason,
            isUnderReview: false,
            hasEditPending: false,
            biodataId: profile.biodataId,
          },
          { runValidators: false }
        );
        console.log(`Profile ${profile.profileId} rejected successfully`);
      } catch (saveError) {
        console.error(
          `Failed to save profile ${profile.profileId}:`,
          saveError
        );
        throw saveError;
      }

      // Send rejection email to the user
      try {
        if (profile.userId && profile.userId.email && profile.userId.name) {
          await sendEmail(
            profile.userId.email,
            "biodataRejected",
            profile.userId.name,
            reason
          );
          console.log(`Rejection email sent to ${profile.userId.email}`);
        } else {
          console.warn(
            `Cannot send rejection email: user not found, no email, or no name for profile ${profile.profileId}. userId: ${profile.userId}`
          );
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Don't fail the rejection if email fails
      }

      res.json({
        success: true,
        message: "Biodata rejected successfully",
        profile,
      });
    } catch (error) {
      console.error("Reject profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject profile",
      });
    }
  }
);

// @route   GET /api/admin/profiles/:profileId
// @desc    Get profile details
// @access  Private (Admin only)
router.get("/profiles/:profileId", [auth, adminAuth], async (req, res) => {
  try {
    // PERFORMANCE: Use .lean() for faster queries
    const profile = await Profile.findOne({
      profileId: req.params.profileId,
    })
      .populate("userId", "name email createdAt")
      .select("-__v")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile details",
    });
  }
});

// @route   PUT /api/admin/profiles/:profileId
// @desc    Update any profile (Admin only)
// @access  Private (Admin only)
router.put("/profiles/:profileId", [auth, adminAuth], async (req, res) => {
  try {
    const profile = await Profile.findOne({
      profileId: req.params.profileId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update profile fields
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        profile[key] = req.body[key];
      }
    });

    // If status is being changed to approved, clear rejection reason and review flags
    if (req.body.status === "approved") {
      profile.rejectionReason = null;
      profile.isUnderReview = false;
      profile.hasEditPending = false;
    }

    // Ensure biodataId is set
    if (profile.profileId && !profile.biodataId) {
      profile.biodataId = profile.profileId;
    }

    await profile.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// @route   DELETE /api/admin/profiles/:profileId
// @desc    Delete a profile and associated data
// @access  Private (Admin only)
router.delete("/profiles/:profileId", [auth, adminAuth], async (req, res) => {
  try {
    const profileId = req.params.profileId;

    // Find the profile
    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Delete the profile
    await Profile.deleteOne({ profileId });

    // Clean up related data
    // Delete all bookmarks for this profile
    await Bookmark.deleteMany({ profileId });

    // Delete all reports for this profile
    await Report.deleteMany({ reportedProfileId: profileId });

    // Update the user's profileId field
    await User.findByIdAndUpdate(profile.userId, { profileId: null });

    res.json({
      success: true,
      message: "Profile and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete profile",
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get("/users", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { profileId: new RegExp(search, "i") },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
});

// @route   PUT /api/admin/users/:userId/restrict
// @desc    Restrict a user (hide their biodata and prevent viewing others)
// @access  Private (Admin only)
router.put("/users/:userId/restrict", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Restrict user request for userId:", userId);

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { isRestricted: true },
      { new: true }
    );
    console.log("User found and updated:", user ? "yes" : "no");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent restricting admin users
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot restrict admin users",
      });
    }

    // Hide their profile if exists
    if (user.profileId) {
      console.log("Hiding profile for profileId:", user.profileId);
      await Profile.findOneAndUpdate(
        { profileId: user.profileId },
        { status: "hidden" }
      );
    }

    res.json({
      success: true,
      message: "User restricted successfully",
      user,
    });
  } catch (error) {
    console.error("Restrict user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restrict user",
    });
  }
});

// @route   PUT /api/admin/users/:userId/ban
// @desc    Ban a user (remove biodata and prevent login)
// @access  Private (Admin only)
router.put("/users/:userId/ban", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Ban user request for userId:", userId);

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true, isRestricted: false },
      { new: true }
    );
    console.log("User found and updated:", user ? "yes" : "no");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent banning admin users
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot ban admin users",
      });
    }

    // Delete their profile if exists
    if (user.profileId) {
      console.log("Deleting profile for profileId:", user.profileId);
      await Profile.findOneAndDelete({ profileId: user.profileId });
      // Update user to remove profileId
      await User.findByIdAndUpdate(userId, {
        $unset: { profileId: 1 },
        hasProfile: false,
      });
      console.log("Profile deleted and user updated");
    }

    // Delete their draft if exists
    const draft = await Draft.findOneAndDelete({ userId: userId });
    if (draft) {
      console.log("Draft deleted for userId:", userId);
    }

    // Delete their bookmarks
    const bookmarksDeleted = await Bookmark.deleteMany({ userId: userId });
    if (bookmarksDeleted.deletedCount > 0) {
      console.log(
        `Deleted ${bookmarksDeleted.deletedCount} bookmarks for userId:`,
        userId
      );
    }

    res.json({
      success: true,
      message: "User banned successfully",
      user,
    });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to ban user",
    });
  }
});

// @route   GET /api/admin/users/restricted
// @desc    Get all restricted users
// @access  Private (Admin only)
router.get("/users/restricted", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let query = { isRestricted: true };
    if (search) {
      query = {
        isRestricted: true,
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { profileId: new RegExp(search, "i") },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get restricted users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get restricted users",
    });
  }
});

// @route   GET /api/admin/users/banned
// @desc    Get all banned users
// @access  Private (Admin only)
router.get("/users/banned", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let query = { isBanned: true };
    if (search) {
      query = {
        isBanned: true,
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { profileId: new RegExp(search, "i") },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get banned users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get banned users",
    });
  }
});

// @route   PUT /api/admin/users/:userId/unrestrict
// @desc    Unrestrict a user (restore their biodata visibility and viewing access)
// @access  Private (Admin only)
router.put("/users/:userId/unrestrict", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Unrestrict user request for userId:", userId);

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { isRestricted: false },
      { new: true }
    );
    console.log("User found and updated:", user ? "yes" : "no");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Restore their profile if exists
    if (user.profileId) {
      console.log("Restoring profile for profileId:", user.profileId);
      await Profile.findOneAndUpdate(
        { profileId: user.profileId },
        { status: "approved" }
      );
    }

    res.json({
      success: true,
      message: "User unrestricted successfully",
      user,
    });
  } catch (error) {
    console.error("Unrestrict user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unrestrict user",
    });
  }
});

// @route   PUT /api/admin/users/:userId/unban
// @desc    Unban a user (restore their access)
// @access  Private (Admin only)
router.put("/users/:userId/unban", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Unban user request for userId:", userId);

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: false },
      { new: true }
    );
    console.log("User found and updated:", user ? "yes" : "no");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User unbanned successfully",
      user,
    });
  } catch (error) {
    console.error("Unban user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unban user",
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all reports
// @access  Private (Admin only)
router.get("/reports", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const reports = await Report.find(query)
      .populate("reportedBy", "name email")
      .populate({
        path: "reportedProfileId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reports",
    });
  }
});

// @route   PUT /api/admin/reports/:reportId/action
// @desc    Take action on a report
// @access  Private (Admin only)
router.put("/reports/:reportId/action", [auth, adminAuth], async (req, res) => {
  try {
    const { action, notes, actionTaken } = req.body;
    const reportId = req.params.reportId;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Update report status based on action
    let newStatus = report.status;
    switch (action) {
      case "investigate":
        newStatus = "under_review";
        break;
      case "resolve":
        newStatus = "resolved";
        break;
      case "dismiss":
        newStatus = "dismissed";
        break;
    }

    report.status = newStatus;
    report.adminNotes = notes || report.adminNotes;
    report.actionTaken = actionTaken || report.actionTaken;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    res.json({
      success: true,
      message: `Report ${action} successfully`,
      report,
    });
  } catch (error) {
    console.error("Report action error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to take action on report",
    });
  }
});

// @route   POST /api/admin/reports
// @desc    Create a new report (for testing purposes)
// @access  Private (Admin only)
router.post("/reports", [auth, adminAuth], async (req, res) => {
  try {
    const { reportedProfileId, reportedBy, reason, description, priority } =
      req.body;

    const report = new Report({
      reportedProfileId,
      reportedBy,
      reason,
      description,
      priority: priority || "medium",
    });

    await report.save();

    res.json({
      success: true,
      message: "Report created successfully",
      report,
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create report",
    });
  }
});

// @route   GET /api/admin/verification-requests
// @desc    Get all pending verification requests
// @access  Private (Admin only)
router.get("/verification-requests", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10000 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      verificationRequest: true,
      alumniVerified: false,
    })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      verificationRequest: true,
      alumniVerified: false,
    });

    res.json({
      success: true,
      requests: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get verification requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get verification requests",
    });
  }
});

// @route   PUT /api/admin/verification-requests/:userId/approve
// @desc    Approve a verification request
// @access  Private (Admin only)
router.put(
  "/verification-requests/:userId/approve",
  [auth, adminAuth],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.verificationRequest) {
        return res.status(400).json({
          success: false,
          message: "No verification request found for this user",
        });
      }

      await User.findByIdAndUpdate(
        user._id,
        { alumniVerified: true, verificationRequest: false },
        { runValidators: false }
      );

      res.json({
        success: true,
        message: "Verification request approved successfully",
      });
    } catch (error) {
      console.error("Approve verification error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve verification request",
      });
    }
  }
);

// @route   PUT /api/admin/verification-requests/:userId/reject
// @desc    Reject a verification request
// @access  Private (Admin only)
router.put(
  "/verification-requests/:userId/reject",
  [auth, adminAuth],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.verificationRequest) {
        return res.status(400).json({
          success: false,
          message: "No verification request found for this user",
        });
      }

      await User.findByIdAndUpdate(
        user._id,
        { verificationRequest: false },
        { runValidators: false }
      );

      res.json({
        success: true,
        message: "Verification request rejected successfully",
      });
    } catch (error) {
      console.error("Reject verification error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject verification request",
      });
    }
  }
);

module.exports = router;
