const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      console.log("Auth middleware: No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    console.log("Auth middleware: Token received, verifying...");

    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Auth middleware: Token decoded successfully", {
        userId: decoded.userId,
      });
    } catch (verifyError) {
      console.error(
        "Auth middleware: Token verification failed",
        verifyError.message
      );
      throw verifyError;
    }

    
    const user = await User.findById(decoded.userId)
      .select(
        "name email profileId isActive role credits alumniVerified verificationRequest unlockedContacts"
      )
      .lean();

    console.log("Auth middleware: User lookup result", {
      userId: decoded.userId,
      found: !!user,
      isActive: user?.isActive,
      role: user?.role,
    });

    if (!user) {
      console.error(
        "Auth middleware: User not found in database for userId:",
        decoded.userId
      );
      return res.status(401).json({
        success: false,
        message: "Token is not valid, user not found",
      });
    }

    if (!user.isActive) {
      console.log("Auth middleware: User account is deactivated");
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    
    req.user = { ...user, id: user._id };
    console.log(
      "Auth middleware: Authentication successful, proceeding to next middleware"
    );
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      console.error("JWT Error Details:", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      console.error("Token expired at:", error.expiredAt);
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

module.exports = auth;
