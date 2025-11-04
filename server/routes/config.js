const express = require("express");
const monetizationConfig = require("../config/monetization");
const { getAllUniversities } = require("../config/universities");

const router = express.Router();




router.get("/universities", (req, res) => {
  try {
    const universities = getAllUniversities();

    res.json({
      success: true,
      universities,
      serverTimestamp: global.SERVER_STARTUP_TIME || Date.now(),
    });
  } catch (error) {
    console.error("Error getting university config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get university configuration",
      serverTimestamp: Date.now(),
    });
  }
});




router.get("/monetization", (req, res) => {
  try {
    const config = monetizationConfig.getConfigSummary();

    res.json({
      success: true,
      monetization: config.monetization,
      creditSystemEnabled: config.creditSystem,
      freeAccess: config.freeAccess,
      message: config.message,
      serverTimestamp: global.SERVER_STARTUP_TIME || Date.now(),
    });
  } catch (error) {
    console.error("Error getting monetization config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get configuration",
      
      monetization: "off",
      creditSystemEnabled: false,
      freeAccess: true,
      serverTimestamp: Date.now(),
    });
  }
});

module.exports = router;
