const express = require("express");
const Profile = require("../models/Profile");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");
const { asyncHandler } = require("../middleware/errorHandler");
const monetizationConfig = require("../config/monetization");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// Helper function to check if user can access contact information
const canAccessContactInfo = (user) => {
  // Allow if user has BRACU email domains
  if (
    user.email?.endsWith("@g.bracu.ac.bd") ||
    user.email?.endsWith("@bracu.ac.bd")
  ) {
    return true;
  }
  // Allow if user is alumni verified
  if (user.alumniVerified) {
    return true;
  }
  return false;
};

// Helper function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// @route   POST /api/profiles
// @desc    Create user profile
// @access  Private
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has BRACU email for biodata creation or is verified alumni
    if (
      !user.email.endsWith("@g.bracu.ac.bd") &&
      !user.email.endsWith("@bracu.ac.bd") &&
      !user.alumniVerified
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only BRACU students and verified alumni (@g.bracu.ac.bd or @bracu.ac.bd) can create biodata. You can still browse profiles and unlock contacts with credits.",
      });
    }

    // Check if user already has a profile
    if (user.hasProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }

    // Validate required fields for new profiles
    if (
      !req.body.contactInformation ||
      req.body.contactInformation.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Contact information is required",
      });
    }

    if (req.body.contactInformation.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Contact information must be at least 10 characters long",
      });
    }

    if (req.body.contactInformation.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Contact information cannot exceed 500 characters",
      });
    }

    // Debug: Log received data
    console.log("Creating profile for user:", user._id);
    console.log("Profile data received:", JSON.stringify(req.body, null, 2));

    // Generate profileId if not exists
    if (!user.profileId) {
      user.profileId = await User.generateProfileId();
      await user.save();
    }

    // Create new profile
    const profile = new Profile({
      userId: user._id,
      profileId: user.profileId,
      ...req.body,
    });

    try {
      await profile.save();

      // Update user hasProfile flag
      user.hasProfile = true;
      await user.save();

      res.status(201).json({
        success: true,
        message:
          "Profile created successfully. You will receive an email notification once your profile is approved.",
        profile,
      });
    } catch (validationError) {
      // Handle validation errors specifically
      if (validationError.name === "ValidationError") {
        const formattedError = formatValidationError(validationError);
        return res.status(400).json({
          success: false,
          message: formattedError.message,
          errors: formattedError.errors,
          details: formattedError.details,
        });
      }
      // Re-throw other errors to be handled by asyncHandler
      throw validationError;
    }
  })
);

// @route   GET /api/profiles/search
// @desc    Search profiles with filters
// @access  Public (only approved profiles)
router.get("/search", async (req, res) => {
  try {
    const {
      search,
      gender,
      minAge,
      maxAge,
      education,
      profession,
      district,
      religion,
      page = 1,
      limit = 10,
    } = req.query;

    // Build search filters with exact matches where possible
    const filters = { status: "approved" };

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filters.$or = [
        { name: searchRegex },
        { educationLevel: searchRegex },
        { profession: searchRegex },
        { presentAddressDistrict: searchRegex },
        { permanentAddressDistrict: searchRegex },
        { hscGroup: searchRegex },
        { bracu_department: searchRegex },
      ];
    }

    if (gender) filters.gender = gender;
    if (minAge || maxAge) {
      filters.age = {};
      if (minAge) filters.age.$gte = parseInt(minAge);
      if (maxAge) filters.age.$lte = parseInt(maxAge);
    }
    if (religion) filters.religion = religion;
    // Use case-insensitive exact matches instead of regex where possible
    if (education) {
      filters.educationLevel = { $regex: new RegExp(`^${education}`, "i") };
    }
    if (profession) {
      filters.profession = { $regex: new RegExp(`^${profession}`, "i") };
    }
    if (district && district !== "Any" && district !== "") {
      // If search is already using $or, combine with $and
      if (filters.$or) {
        filters.$and = [
          { $or: filters.$or },
          {
            $or: [
              { presentAddressDistrict: { $regex: new RegExp(district, "i") } },
              {
                permanentAddressDistrict: { $regex: new RegExp(district, "i") },
              },
            ],
          },
        ];
        delete filters.$or;
      } else {
        // Search in present and permanent address district fields
        filters.$or = [
          { presentAddressDistrict: { $regex: new RegExp(district, "i") } },
          { permanentAddressDistrict: { $regex: new RegExp(district, "i") } },
        ];
      }
    }

    // Fetch all matching profiles
    const allProfiles = await Profile.find(filters)
      .select("-privacy -contactInformation -__v")
      .lean();

    // Shuffle the entire result set to ensure all profiles get equal traffic
    shuffleArray(allProfiles);

    // Calculate total and pagination
    const total = allProfiles.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const profiles = allProfiles.slice(skip, skip + parseInt(limit));

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
    console.error("Search profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search profiles",
    });
  }
});

// @route   GET /api/profiles/stats
// @desc    Get biodata statistics
// @access  Public
router.get("/stats", async (req, res) => {
  try {
    const stats = await Profile.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const male = stats.find((stat) => stat._id === "Male")?.count || 0;
    const female = stats.find((stat) => stat._id === "Female")?.count || 0;

    res.json({
      success: true,
      data: {
        total,
        male,
        female,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

// @route   GET /api/profiles/:profileId
// @desc    Get single profile
// @access  Public for approved profiles, Private for additional features
router.get("/:profileId", async (req, res) => {
  try {
    // Check if user is authenticated (optional)
    let currentUser = null;
    try {
      const token =
        req.cookies?.token ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await require("../models/User")
          .findById(decoded.userId)
          .select("name email profileId isActive role credits")
          .lean();
      }
    } catch (authError) {
      // Authentication failed, but that's okay - continue as public user
      console.log(
        "Profile view: User not authenticated, treating as public view"
      );
    }

    // PERFORMANCE: Use .lean() for faster queries since we don't need Mongoose document methods
    const profile = await Profile.findOne({
      profileId: req.params.profileId,
      status: "approved",
    })
      .populate("userId", "name email")
      .select("-__v"); // Exclude version key

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Simplified view tracking - only increment if authenticated and not owner
    if (
      currentUser &&
      profile.userId._id.toString() !== currentUser._id.toString()
    ) {
      // Fire and forget - don't wait for the update
      Profile.findByIdAndUpdate(profile._id, { $inc: { viewCount: 1 } })
        .exec()
        .catch((err) => console.log("View count update failed:", err));
    }

    res.json({
      success: true,
      profile,
      isAuthenticated: !!currentUser,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
});

// @route   GET /api/profiles/user/me
// @desc    Get current user's profile
// @access  Private
router.get("/user/me", auth, async (req, res) => {
  try {
    // PERFORMANCE: Use .lean() for faster queries
    const profile = await Profile.findOne({ userId: req.user.id })
      .populate("userId", "name email picture")
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
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
});

// @route   PUT /api/profiles/user/me
// @desc    Update current user's profile
// @access  Private
router.put(
  "/user/me",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Validate contactInformation if it's being updated
    if (req.body.contactInformation !== undefined) {
      if (
        !req.body.contactInformation ||
        req.body.contactInformation.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Contact information is required",
        });
      }

      if (req.body.contactInformation.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Contact information must be at least 10 characters long",
        });
      }

      if (req.body.contactInformation.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Contact information cannot exceed 500 characters",
        });
      }
    }

    // Check if this is an edit (profile already exists and has been edited before)
    const isEdit = profile.editCount > 0 || profile.status === "approved";
    const wasApproved = profile.status === "approved";

    // Track which fields are being changed
    const changedFields = [];
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        // Check if the value is actually different from current value
        const currentValue = profile[key];
        const newValue = req.body[key];

        // Compare values (handle different data types)
        if (currentValue !== newValue) {
          changedFields.push(key);
        }

        profile[key] = newValue;
      }
    });

    // If this is an edit to an existing profile, trigger admin review
    if (isEdit) {
      profile.status = "pending_approval";
      profile.isUnderReview = true;
      profile.hasEditPending = true;
      profile.rejectionReason = null; // Clear any previous rejection reason

      // Add changed fields to the editedFields array (avoid duplicates)
      changedFields.forEach((field) => {
        if (!profile.editedFields.includes(field)) {
          profile.editedFields.push(field);
        }
      });
    }

    // Update edit tracking fields
    profile.lastEditDate = new Date();
    profile.editCount = (profile.editCount || 0) + 1;

    await profile.save();

    const message =
      isEdit && wasApproved
        ? "Profile updated successfully! Your changes are now under admin review. You will receive an email notification once approved."
        : "Profile updated successfully!";

    res.json({
      success: true,
      message,
      profile,
      requiresReview: isEdit && wasApproved,
    });
  })
);

// @route   DELETE /api/profiles/user/me
// @desc    Delete current user's profile
// @access  Private
router.delete(
  "/user/me",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Delete the profile
    await Profile.findByIdAndDelete(profile._id);

    // Update user hasProfile flag
    const user = await User.findById(req.user.id);
    if (user) {
      user.hasProfile = false;
      await user.save();
    }

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  })
);

// @route   POST /api/profiles/:profileId/unlock-contact
// @desc    Unlock contact information of a profile (TEMPORARILY FREE - NO CREDITS REQUIRED)
// @access  Private
router.post(
  "/:profileId/unlock-contact",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;
    const userId = req.user.id;

    // Get the requesting user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Environment-based monetization control
    if (monetizationConfig.shouldRequireCreditsForContact()) {
      // Check if user has enough credits (monetization enabled)
      if (user.credits < 1) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient credits. You need at least 1 credit to unlock contact information.",
        });
      }
    }
    // If monetization is disabled, contact info is free

    // Find the profile to unlock
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    }).populate("userId", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    // Check if user can access contact information (BRACU email or alumni verified)
    if (!canAccessContactInfo(user)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only BRACU students and verified alumni can unlock contact information.",
      });
    }

    // Check if user is trying to unlock their own profile
    if (profile.userId._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot unlock your own contact information",
      });
    }

    // Check if already unlocked (keep for tracking purposes)
    if (user.unlockedContacts && user.unlockedContacts.includes(profileId)) {
      return res.json({
        success: true,
        message: "Contact information already unlocked",
        contactInfo:
          profile.contactInformation ||
          "No contact information provided by the user.",
        remainingCredits: user.credits,
      });
    }

    // Environment-based credit deduction and transaction recording
    if (monetizationConfig.shouldRequireCreditsForContact()) {
      // Deduct credit and record transaction (monetization enabled)
      user.credits -= 1;
      user.unlockedContacts = user.unlockedContacts || [];
      user.unlockedContacts.push(profileId);
      await user.save();

      // Record transaction if monetization is enabled
      if (monetizationConfig.shouldRecordTransactions()) {
        const Transaction = require("../models/Transaction");
        try {
          await Transaction.create({
            user: user._id,
            type: "credit_deduction",
            amount: 1,
            description: `Deducted 1 credit for unlocking contact of profile ${profileId}`,
          });
        } catch (err) {
          console.error("Transaction creation failed:", err);
        }
      }
    } else {
      // Track unlocked profiles without deducting credits (free access mode)
      user.unlockedContacts = user.unlockedContacts || [];
      if (!user.unlockedContacts.includes(profileId)) {
        user.unlockedContacts.push(profileId);
        await user.save();
      }
    }

    // Return contact information with environment-aware message
    const message = monetizationConfig.shouldRequireCreditsForContact()
      ? "Contact information unlocked successfully"
      : "Contact information accessed successfully (free access mode)";

    res.json({
      success: true,
      message: message,
      contactInfo:
        profile.contactInformation ||
        "No contact information provided by the user.",
      remainingCredits: user.credits,
    });
  })
);

// @route   GET /api/profiles/:profileId/contact-status
// @desc    Check if contact information is already unlocked for a profile
// @access  Private
router.get(
  "/:profileId/contact-status",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;
    const userId = req.user.id;

    // Find the profile (user data available from auth middleware)
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    })
      .populate("userId", "name")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    // Check if user is trying to check their own profile
    if (profile.userId._id.toString() === userId) {
      return res.json({
        success: true,
        isUnlocked: false,
        isOwnProfile: true,
        message: "This is your own profile",
      });
    }

    // Check if user can access contact information (BRACU email or alumni verified)
    if (!canAccessContactInfo(req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only BRACU students and verified alumni can view contact information.",
      });
    }

    // Environment-based contact status check using auth middleware data
    if (monetizationConfig.shouldRequireCreditsForContact()) {
      // Original credit-based logic (monetization enabled)
      const isUnlocked =
        req.user.unlockedContacts &&
        req.user.unlockedContacts.includes(profileId);

      if (isUnlocked) {
        return res.json({
          success: true,
          isUnlocked: true,
          contactInfo:
            profile.contactInformation ||
            "No contact information provided by the user.",
          remainingCredits: req.user.credits,
        });
      }

      res.json({
        success: true,
        isUnlocked: false,
        remainingCredits: req.user.credits,
      });
    } else {
      // Always return contact information as unlocked (free access mode)
      return res.json({
        success: true,
        isUnlocked: true,
        contactInfo:
          profile.contactInformation ||
          "No contact information provided by the user.",
        remainingCredits: req.user.credits,
        message: "Contact information is free during launch period",
      });
    }
  })
);

// @route   DELETE /api/profiles
// @desc    Delete user profile
// @access  Private
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find and delete the user's profile
    const profile = await Profile.findOneAndDelete({ userId: user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update user's hasProfile status
    user.hasProfile = false;
    await user.save();

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  })
);

// @route   POST /api/profiles/request-verification
// @desc    Request alumni verification
// @access  Private
router.post(
  "/request-verification",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already has BRACU email
    if (
      user.email.endsWith("@g.bracu.ac.bd") ||
      user.email.endsWith("@bracu.ac.bd")
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have a BRACU email address.",
      });
    }

    // Check if already verified
    if (user.alumniVerified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified as an alumni.",
      });
    }

    // Check if request already pending
    if (user.verificationRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Verification request already submitted. Please wait for admin approval.",
      });
    }

    // Set verification request flag
    user.verificationRequest = true;
    await user.save();

    res.json({
      success: true,
      message:
        "Verification request submitted successfully. Please send your proof to our Facebook page.",
    });
  })
);

module.exports = router;
