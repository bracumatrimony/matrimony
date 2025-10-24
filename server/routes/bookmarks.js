const express = require("express");
const Bookmark = require("../models/Bookmark");
const Profile = require("../models/Profile");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

// @route   POST /api/bookmarks
// @desc    Add a profile to bookmarks
// @access  Private
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Profile ID is required",
      });
    }

    // Find the profile by profileId
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    // Check if user is trying to bookmark their own profile
    if (profile.userId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot bookmark your own profile",
      });
    }

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      userId: req.user.id,
      profileId: profileId,
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: "Profile already bookmarked",
      });
    }

    // Create bookmark
    const bookmark = new Bookmark({
      userId: req.user.id,
      profileId: profileId,
      profile: profile._id,
    });

    await bookmark.save();

    res.status(201).json({
      success: true,
      message: "Profile bookmarked successfully",
      bookmark,
    });
  })
);

// @route   DELETE /api/bookmarks/:profileId
// @desc    Remove a profile from bookmarks
// @access  Private
router.delete(
  "/:profileId",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user.id,
      profileId: profileId,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
    }

    res.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  })
);

// @route   GET /api/bookmarks
// @desc    Get all bookmarks for current user with pagination
// @access  Private
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 9);
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalBookmarks = await Bookmark.countDocuments({
      userId: req.user.id,
    });

    // Get paginated bookmarks using aggregation
    const bookmarks = await Bookmark.aggregate([
      { $match: { userId: req.user.id } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      {
        $lookup: {
          from: "users",
          localField: "profile.userId",
          foreignField: "_id",
          as: "profile.userId",
        },
      },
      { $unwind: "$profile.userId" },
      {
        $project: {
          _id: 1,
          profileId: 1,
          userId: 1,
          createdAt: 1,
          "profile._id": 1,
          "profile.profileId": 1,
          "profile.userId._id": 1,
          "profile.userId.name": 1,
          "profile.userId.email": 1,
          "profile.userId.picture": 1,
        },
      },
    ]);

    const totalPages = Math.max(1, Math.ceil(totalBookmarks / limit));

    res.json({
      success: true,
      bookmarks,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookmarks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    });
  })
);

// @route   GET /api/bookmarks/check/:profileId
// @desc    Check if a profile is bookmarked by current user
// @access  Private
router.get(
  "/check/:profileId",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    const bookmark = await Bookmark.findOne({
      userId: req.user.id,
      profileId: profileId,
    });

    res.json({
      success: true,
      isBookmarked: !!bookmark,
    });
  })
);

// @route   GET /api/bookmarks/stats
// @desc    Get bookmark statistics for current user
// @access  Private
router.get(
  "/stats",
  auth,
  asyncHandler(async (req, res) => {
    const bookmarksCount = await Bookmark.countDocuments({
      userId: req.user.id,
    });

    // Count how many users have bookmarked current user's profile
    const userProfile = await Profile.findOne({ userId: req.user.id });
    let bookmarkedByCount = 0;

    if (userProfile) {
      bookmarkedByCount = await Bookmark.countDocuments({
        profileId: userProfile.profileId,
      });
    }

    res.json({
      success: true,
      stats: {
        myBookmarks: bookmarksCount,
        bookmarkedBy: bookmarkedByCount,
      },
    });
  })
);

module.exports = router;
