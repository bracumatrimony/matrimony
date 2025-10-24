const express = require("express");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Report = require("../models/Report");
const Bookmark = require("../models/Bookmark");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get("/dashboard", [auth, adminAuth], async (req, res) => {
  try {
    // Get statistics
    const totalProfiles = await Profile.countDocuments();
    const pendingApprovals = await Profile.countDocuments({
      status: "pending_approval",
    });
    const approvedProfiles = await Profile.countDocuments({
      status: "approved",
    });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Calculate total revenue (mock calculation - you'd have a Transaction model)
    const totalRevenue = activeUsers * 100; // Mock calculation

    // Get recent pending profiles
    const recentPending = await Profile.find({ status: "pending_approval" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get report statistics
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: "pending" });

    // Get verification requests count
    const verificationRequests = await User.countDocuments({
      verificationRequest: true,
      alumniVerified: false,
    });

    // Get pending transactions count
    const pendingTransactions = await Transaction.countDocuments({
      status: "pending",
    });

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

      profile.status = "approved";
      profile.rejectionReason = null;
      profile.isUnderReview = false;
      profile.hasEditPending = false;
      await profile.save();

      // Send approval email notification
      try {
        await sendEmail(
          profile.userId.email,
          "biodataApproved",
          profile.userId.name
        );
        console.log(`Approval email sent to ${profile.userId.email}`);
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

      profile.status = "rejected";
      profile.rejectionReason = reason;
      profile.isUnderReview = false;
      profile.hasEditPending = false;
      await profile.save();

      // Send rejection email to the user
      try {
        await sendEmail(
          profile.userId.email,
          "biodataRejected",
          profile.userId.name,
          reason
        );
        console.log(`Rejection email sent to ${profile.userId.email}`);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Don't fail the rejection if email fails
      }

      res.json({
        success: true,
        message: "Profile rejected successfully",
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

      user.alumniVerified = true;
      user.verificationRequest = false;
      await user.save();

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

      user.verificationRequest = false;
      await user.save();

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
