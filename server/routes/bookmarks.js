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




router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.body;

    
    const { sanitizeId } = require("../utils/sanitizeQuery");

    
    const sanitizedProfileId = sanitizeId(profileId);
    if (!sanitizedProfileId) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile ID",
      });
    }

    
    const profile = await Profile.findOne({
      profileId: sanitizedProfileId,
      status: "approved",
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    
    if (profile.userId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot bookmark your own profile",
      });
    }

    
    const existingBookmark = await Bookmark.findOne({
      userId: req.user.id,
      profileId: sanitizedProfileId,
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: "Profile already bookmarked",
      });
    }

    
    const bookmark = new Bookmark({
      userId: req.user.id,
      profileId: sanitizedProfileId,
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




router.delete(
  "/:profileId",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    
    const { sanitizeId } = require("../utils/sanitizeQuery");

    
    const sanitizedProfileId = sanitizeId(profileId);
    if (!sanitizedProfileId) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile ID",
      });
    }

    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user.id,
      profileId: sanitizedProfileId,
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




router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 9);
    const skip = (page - 1) * limit;

    
    const totalBookmarksResult = await Bookmark.aggregate([
      { $match: { userId: req.user.id } },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "profileId",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      { $match: { "profile.status": "approved" } },
      { $count: "total" },
    ]);

    const totalBookmarks =
      totalBookmarksResult.length > 0 ? totalBookmarksResult[0].total : 0;

    
    const bookmarks = await Bookmark.aggregate([
      { $match: { userId: req.user.id } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "profileId",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      { $match: { "profile.status": "approved" } },
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
          "profile.biodataId": 1,
          "profile.age": 1,
          "profile.presentAddressDistrict": 1,
          "profile.presentAddressDivision": 1,
          "profile.graduationSubject": 1,
          "profile.profession": 1,
          "profile.userId._id": 1,
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




router.get(
  "/check/:profileId",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    
    const { sanitizeId } = require("../utils/sanitizeQuery");

    
    const sanitizedProfileId = sanitizeId(profileId);
    if (!sanitizedProfileId) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile ID",
      });
    }

    const bookmark = await Bookmark.findOne({
      userId: req.user.id,
      profileId: sanitizedProfileId,
    });

    res.json({
      success: true,
      isBookmarked: !!bookmark,
    });
  })
);




router.get(
  "/stats",
  auth,
  asyncHandler(async (req, res) => {
    const bookmarksCount = await Bookmark.countDocuments({
      userId: req.user.id,
    });

    
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
