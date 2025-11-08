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

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  const userAgent = res.req.get("User-Agent") || "";
  const isEmbeddedBrowser = /FBAN|FBAV|Messenger|Instagram/i.test(userAgent);

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isEmbeddedBrowser ? "lax" : isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

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

    let user = await User.findOne({ email });

    if (!user) {
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
        universityKey = universityInfo.key;
        profileId = await User.generateProfileId(universityKey);
        alumniVerified = false;
        verificationRequest = false;
      } else {
        universityKey = null;
        profileId = null;
        alumniVerified = false;
        verificationRequest = true;
      }

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

    const token = generateToken(user._id);
    setTokenCookie(res, token);

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
      token: token,
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

router.post("/google/callback", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    console.log("Google callback received:", { hasCode: !!code, redirectUri });

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const baseUrl =
      process.env.CLIENT_URL ||
      (isProduction
        ? "https://campusmatrimony.vercel.app"
        : "http://localhost:5173");

    const finalRedirectUri = redirectUri || `${baseUrl}/auth/google/callback`;

    console.log("Exchanging code for token...");
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
        redirect_uri: finalRedirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      console.error("Failed to get id_token from Google:", tokenData);
      throw new Error("Google authentication failed");
    }

    console.log("Verifying ID token...");
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified } = payload;

    console.log("Token verified for email:", email);

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified by Google",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      console.log("Creating new user for:", email);
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
        universityKey = universityInfo.key;
        console.log(`Generating profile ID for ${universityKey}...`);
        profileId = await User.generateProfileId(universityKey);
        console.log(`Generated profile ID: ${profileId}`);
        alumniVerified = false;
        verificationRequest = false;
      } else {
        universityKey = null;
        profileId = null;
        alumniVerified = false;
        verificationRequest = true;
      }

      const userData = {
        name,
        email,
        avatar: picture,
        isGoogleUser: true,
        emailVerified: true,
        authProvider: "google",
        alumniVerified,
        verificationRequest,
        credits: initialCredits,
      };

      if (profileId) {
        userData.profileId = profileId;
      }

      userData.university = universityKey;

      user = new User(userData);
      await user.save();
      console.log(`User created successfully: ${email}`);

      if (initialCredits > 0) {
        await CreditedEmail.create({ email: email.toLowerCase() });
      }
    } else {
      console.log("Existing user found:", email);
      if (!user.isGoogleUser) {
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
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

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
      token: token,
    };

    console.log("Sending success response for:", email);
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

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

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
      universityKey = universityInfo.key;
      profileId = await User.generateProfileId(universityKey);
      alumniVerified = false;
      verificationRequest = false;
    } else {
      universityKey = null;
      profileId = null;
      alumniVerified = false;
      verificationRequest = true;
    }

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

    if (profileId) {
      userData.profileId = profileId;
    }

    userData.university = universityKey;

    const user = new User(userData);
    await user.save();

    if (initialCredits > 0) {
      await CreditedEmail.create({ email: email.toLowerCase() });
    }

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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    await user.updateLastLogin();

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

    let decodedPayload;
    try {
      decodedPayload = jwt.decode(token);
      console.log("Token decoded (unverified):", decodedPayload);
    } catch (decodeError) {
      console.error("Token decode error:", decodeError);
    }

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
