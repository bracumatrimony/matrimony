const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Profile = require("../models/Profile");
const CreditedEmail = require("../models/CreditedEmail");
const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");
const { detectUniversityFromEmail } = require("../config/universities");

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Helper function to set JWT cookie
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  const userAgent = res.req.get("User-Agent") || "";
  const isEmbeddedBrowser = /FBAN|FBAV|Messenger|Instagram/i.test(userAgent);

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isEmbeddedBrowser ? "lax" : isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @route   POST /api/auth/google
// @desc    Google OAuth login/register (ID Token)
// @access  Public
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified by Google",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Detect university from email
      const universityInfo = detectUniversityFromEmail(email);
      let universityKey, profileId, alumniVerified, verificationRequest;

      let initialCredits = 0;
      if (universityInfo) {
        const alreadyCredited = await CreditedEmail.findOne({
          email: email.toLowerCase(),
        });
        if (!alreadyCredited) {
          initialCredits = 5;
        }
      }

      if (universityInfo) {
        // University student
        universityKey = universityInfo.key;
        profileId = await User.generateProfileId(universityKey);
        alumniVerified = false;
        verificationRequest = false;
      } else {
        // Alumni or external user - no university or profileId assigned initially
        universityKey = null;
        profileId = null;
        alumniVerified = false;
        verificationRequest = true; // Request verification
      }

      // Create new user
      const userData = {
        name,
        email,
        avatar: picture,
        isGoogleUser: true,
        emailVerified: true,
        authProvider: "google",
        alumniVerified,
        verificationRequest,
        university: universityKey,
        credits: initialCredits,
      };

      if (profileId) {
        userData.profileId = profileId;
      }

      user = new User(userData);
      await user.save();

      if (initialCredits > 0) {
        await CreditedEmail.create({ email: email.toLowerCase() });
      }
    } else if (!user.isGoogleUser) {
      // Update existing user to mark as Google user
      await User.findByIdAndUpdate(
        user._id,
        {
          isGoogleUser: true,
          emailVerified: true,
          authProvider: "google",
          ...(picture && !user.avatar && { avatar: picture }),
        },
        { runValidators: false }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      hasProfile: user.hasProfile,
      role: user.role,
      isGoogleUser: user.isGoogleUser,
      credits: user.credits,
      alumniVerified: user.alumniVerified,
      profileId: user.profileId,
      university: user.university,
      token: token, // Include token in response for cross-domain compatibility
    };

    res.json({
      success: true,
      message: "Google authentication successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

// @route   POST /api/auth/google/callback
// @desc    Google OAuth callback for embedded browsers
// @access  Public
router.post("/google/callback", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    // Exchange code for tokens - auto-detect production URL
    const isProduction = process.env.NODE_ENV === "production";
    const baseUrl =
      process.env.CLIENT_URL ||
      (isProduction
        ? "https://campusmatrimony.vercel.app"
        : "http://localhost:5173");
    const redirectUri = `${baseUrl}/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      throw new Error("Google authentication failed");
    }

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified by Google",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Detect university from email
      const universityInfo = detectUniversityFromEmail(email);
      let universityKey, profileId, alumniVerified, verificationRequest;

      if (universityInfo) {
        // University student
        universityKey = universityInfo.key;
        profileId = await User.generateProfileId(universityKey);
        alumniVerified = false;
        verificationRequest = false;
      } else {
        // Alumni or external user - no university or profileId assigned initially
        universityKey = null;
        profileId = null;
        alumniVerified = false;
        verificationRequest = true; // Request verification
      }

      // Create new user
      const userData = {
        name,
        email,
        avatar: picture,
        isGoogleUser: true,
        emailVerified: true,
        authProvider: "google",
        alumniVerified,
        verificationRequest,
      };

      // Only set profileId if it has a value (for university users)
      if (profileId) {
        userData.profileId = profileId;
      }

      userData.university = universityKey;

      user = new User(userData);
      await user.save();
    } else if (!user.isGoogleUser) {
      // Update existing user to mark as Google user
      await User.findByIdAndUpdate(
        user._id,
        {
          isGoogleUser: true,
          emailVerified: true,
          authProvider: "google",
          ...(picture && !user.avatar && { avatar: picture }),
        },
        { runValidators: false }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Return user data
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      hasProfile: user.hasProfile,
      role: user.role,
      isGoogleUser: user.isGoogleUser,
      credits: user.credits,
      alumniVerified: user.alumniVerified,
      verificationRequest: user.verificationRequest,
      profileId: user.profileId,
      university: user.university,
      token: token, // Include token in response for cross-domain compatibility
    };

    res.json({
      success: true,
      message: "Google authentication successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication callback failed",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// @route   POST /api/auth/register
// @desc    Register user with email/password
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Detect university from email
    const universityInfo = detectUniversityFromEmail(email);

    let initialCredits = 0;
    if (universityInfo) {
      const alreadyCredited = await CreditedEmail.findOne({
        email: email.toLowerCase(),
      });
      if (!alreadyCredited) {
        initialCredits = 5;
      }
    }

    let universityKey, profileId, alumniVerified, verificationRequest;

    if (universityInfo) {
      // University student
      universityKey = universityInfo.key;
      profileId = await User.generateProfileId(universityKey);
      alumniVerified = false;
      verificationRequest = false;
    } else {
      // Alumni or external user - no university or profileId assigned initially
      universityKey = null;
      profileId = null;
      alumniVerified = false;
      verificationRequest = true; // Request verification
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      authProvider: "email",
      emailVerified: false,
      alumniVerified,
      verificationRequest,
      credits: initialCredits,
    };

    // Only set profileId if it has a value (for university users)
    if (profileId) {
      userData.profileId = profileId;
    }

    userData.university = universityKey;

    const user = new User(userData);
    await user.save();

    if (initialCredits > 0) {
      await CreditedEmail.create({ email: email.toLowerCase() });
    }

    // Generate token and set cookie
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { ...user.toJSON(), token },
    });
  } catch (error) {
    console.error("Registration error:", error);

    const formattedError = formatValidationError(error);
    const statusCode = getErrorStatusCode(formattedError.type);

    res.status(statusCode).json({
      success: false,
      message: formattedError.message,
      ...(formattedError.errors && { errors: formattedError.errors }),
      ...(formattedError.details && { details: formattedError.details }),
      ...(formattedError.field && { field: formattedError.field }),
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with email/password
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token and set cookie
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: "Login successful",
      user: { ...user.toJSON(), token },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Sync hasProfile with actual profile existence
    const existingProfile = await Profile.findOne({ userId: user._id });
    if (existingProfile && !user.hasProfile) {
      await User.findByIdAndUpdate(
        user._id,
        { hasProfile: true },
        { runValidators: false }
      );
    } else if (!existingProfile && user.hasProfile) {
      await User.findByIdAndUpdate(
        user._id,
        { hasProfile: false },
        { runValidators: false }
      );
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

// @route   GET /api/auth/verify-token
// @desc    Verify token and get debug information
// @access  Public (for debugging)
router.get("/verify-token", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
        debug: {
          hasAuthHeader: !!req.header("Authorization"),
        },
      });
    }

    // Try to decode without verification first to see the payload
    let decodedPayload;
    try {
      decodedPayload = jwt.decode(token);
      console.log("Token decoded (unverified):", decodedPayload);
    } catch (decodeError) {
      console.error("Token decode error:", decodeError);
    }

    // Now verify the token
    let verifiedPayload;
    try {
      verifiedPayload = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified successfully:", verifiedPayload);
    } catch (verifyError) {
      console.error("Token verification error:", verifyError);
      return res.status(401).json({
        success: false,
        message: "Token verification failed",
        debug: {
          decodedPayload,
          errorName: verifyError.name,
          errorMessage: verifyError.message,
          hasJwtSecret: !!process.env.JWT_SECRET,
          jwtSecretLength: process.env.JWT_SECRET?.length,
        },
      });
    }

    // Look up the user
    const user = await User.findById(verifiedPayload.userId);

    res.json({
      success: true,
      message: "Token is valid",
      debug: {
        tokenPayload: verifiedPayload,
        userFound: !!user,
        userId: verifiedPayload.userId,
        userDetails: user
          ? {
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              hasProfile: user.hasProfile,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Token verification endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token verification",
      debug: {
        errorName: error.name,
        errorMessage: error.message,
      },
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user by clearing cookie
// @access  Public
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
