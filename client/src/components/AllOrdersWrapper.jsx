import { useState, useEffect } from "react";
import { monetizationConfig } from "../config/monetization";
import AllOrders from "../pages/AllOrders";
import FeatureNotAvailable from "../components/FeatureNotAvailable";
import { PageSpinner } from "../components/LoadingSpinner";

export default function AllOrdersWrapper() {
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const [isLoading, setIsLoading] = useState(monetizationConfig.isLoading);

  // Listen for monetization config changes
  useEffect(() => {
    const handleConfigChange = () => {
      setMonetizationEnabled(monetizationConfig.isEnabled());
      setIsLoading(false);
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    // Initial check
    setMonetizationEnabled(monetizationConfig.isEnabled());
    setIsLoading(monetizationConfig.isLoading);

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
    };
  }, []);

  // Show loading while config is being fetched
  if (isLoading) {
    return <PageSpinner text="Loading..." />;
  }

  // Show 404 if monetization is disabled
  if (!monetizationEnabled) {
    return <FeatureNotAvailable featureName="All Orders" />;
  }

  // Show orders page if monetization is enabled
  return <AllOrders />;
}
