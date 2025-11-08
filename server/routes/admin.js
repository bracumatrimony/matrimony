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

router.get("/dashboard", [auth, adminAuth], async (req, res) => {
  try {
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

    const revenueResult = await Transaction.aggregate([
      { $match: { status: "approved", type: "purchase" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const recentPending = await Profile.find({ status: "pending_approval " })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

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

    const verificationRequests = await User.countDocuments({
      verificationRequest: true,
      alumniVerified: false,
    });

    const pendingTransactions = await Transaction.countDocuments({
      status: "pending",
    });

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

router.get("/profiles/approved", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { status: "approved" };

    const { sanitizeSearchQuery } = require("../utils/sanitizeQuery");

    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search);
      if (sanitizedSearch) {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: sanitizedSearch, $options: "i" } },
            { email: { $regex: sanitizedSearch, $options: "i" } },
          ],
        }).select("_id");

        const userIds = matchingUsers.map((user) => user._id);

        query.$or = [
          { profileId: { $regex: sanitizedSearch, $options: "i" } },
          { userId: { $in: userIds } },
        ];
      }
    }

    const profiles = await Profile.find(query)
      .populate("userId", "name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const profileIds = profiles.map((p) => p._id);
    const bookmarkCounts = await Bookmark.aggregate([
      { $match: { profileId: { $in: profileIds } } },
      { $group: { _id: "$profileId", count: { $sum: 1 } } },
    ]);

    const bookmarkMap = {};
    bookmarkCounts.forEach((item) => {
      bookmarkMap[item._id.toString()] = item.count;
    });

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

      if (profile.profileId && !profile.biodataId) {
        profile.biodataId = profile.profileId;
      }

      try {
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

router.get("/profiles/:profileId", [auth, adminAuth], async (req, res) => {
  try {
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

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        profile[key] = req.body[key];
      }
    });

    if (req.body.status === "approved") {
      profile.rejectionReason = null;
      profile.isUnderReview = false;
      profile.hasEditPending = false;
    }

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

router.delete("/profiles/:profileId", [auth, adminAuth], async (req, res) => {
  try {
    const profileId = req.params.profileId;

    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    await Profile.deleteOne({ profileId });

    await Bookmark.deleteMany({ profileId });

    await Report.deleteMany({ reportedProfileId: profileId });

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

router.get("/users", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { sanitizeSearchQuery } = require("../utils/sanitizeQuery");

    let query = {};
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search);
      if (sanitizedSearch) {
        query = {
          $or: [
            { name: new RegExp(sanitizedSearch, "i") },
            { email: new RegExp(sanitizedSearch, "i") },
            { profileId: new RegExp(sanitizedSearch, "i") },
          ],
        };
      }
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

router.put("/users/:userId/restrict", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Restrict user request for userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot restrict admin users",
      });
    }

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

router.put("/users/:userId/ban", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Ban user request for userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot ban admin users",
      });
    }

    if (user.profileId) {
      console.log("Deleting profile for profileId:", user.profileId);
      await Profile.findOneAndDelete({ profileId: user.profileId });

      await User.findByIdAndUpdate(userId, {
        $unset: { profileId: 1 },
        hasProfile: false,
      });
      console.log("Profile deleted and user updated");
    }

    const draft = await Draft.findOneAndDelete({ userId: userId });
    if (draft) {
      console.log("Draft deleted for userId:", userId);
    }

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

router.get("/users/restricted", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { sanitizeSearchQuery } = require("../utils/sanitizeQuery");

    let query = { isRestricted: true };
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search);
      if (sanitizedSearch) {
        query = {
          isRestricted: true,
          $or: [
            { name: new RegExp(sanitizedSearch, "i") },
            { email: new RegExp(sanitizedSearch, "i") },
            { profileId: new RegExp(sanitizedSearch, "i") },
          ],
        };
      }
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

router.get("/users/banned", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { sanitizeSearchQuery } = require("../utils/sanitizeQuery");

    let query = { isBanned: true };
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search);
      if (sanitizedSearch) {
        query = {
          isBanned: true,
          $or: [
            { name: new RegExp(sanitizedSearch, "i") },
            { email: new RegExp(sanitizedSearch, "i") },
            { profileId: new RegExp(sanitizedSearch, "i") },
          ],
        };
      }
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

router.put("/users/:userId/unrestrict", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Unrestrict user request for userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

router.put("/users/:userId/unban", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Unban user request for userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

router.get("/reports", [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

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

router.put(
  "/verification-requests/:userId/approve",
  [auth, adminAuth],
  async (req, res) => {
    try {
      const { university } = req.body;

      if (!university) {
        return res.status(400).json({
          success: false,
          message: "University is required for approval",
        });
      }

      const { getUniversityConfig } = require("../config/universities");
      const universityConfig = getUniversityConfig(university);
      if (!universityConfig) {
        return res.status(400).json({
          success: false,
          message: "Invalid university selected",
        });
      }

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

      const newProfileId = await User.generateProfileId(university);

      await User.findByIdAndUpdate(
        user._id,
        {
          alumniVerified: true,
          verificationRequest: false,
          university: university,
          profileId: newProfileId,
        },
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

router.delete("/users/:userId", [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Delete user request for userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    if (user.profileId) {
      console.log("Deleting profile for profileId:", user.profileId);
      await Profile.findOneAndDelete({ profileId: user.profileId });
      console.log("Profile deleted");
    }

    const draft = await Draft.findOneAndDelete({ userId: userId });
    if (draft) {
      console.log("Draft deleted for userId:", userId);
    }

    const bookmarksDeleted = await Bookmark.deleteMany({ userId: userId });
    if (bookmarksDeleted.deletedCount > 0) {
      console.log(
        `Deleted ${bookmarksDeleted.deletedCount} bookmarks for userId:`,
        userId
      );
    }

    const transactionsDeleted = await Transaction.deleteMany({
      userId: userId,
    });
    if (transactionsDeleted.deletedCount > 0) {
      console.log(
        `Deleted ${transactionsDeleted.deletedCount} transactions for userId:`,
        userId
      );
    }

    const profileViewsDeleted =
      await require("../models/ProfileView").deleteMany({
        $or: [{ viewerId: userId }, { viewedProfileId: userId }],
      });
    if (profileViewsDeleted.deletedCount > 0) {
      console.log(
        `Deleted ${profileViewsDeleted.deletedCount} profile views for userId:`,
        userId
      );
    }

    await User.findByIdAndDelete(userId);
    console.log("User deleted successfully:", userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

module.exports = router;
