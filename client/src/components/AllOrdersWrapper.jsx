import { useState, useEffect } from "react";
import { monetizationConfig } from "../config/monetization";
import AllOrders from "../pages/AllOrders";
import FeatureNotAvailable from "../components/FeatureNotAvailable";

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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Show 404 if monetization is disabled
  if (!monetizationEnabled) {
    return <FeatureNotAvailable featureName="All Orders" />;
  }

  // Show orders page if monetization is enabled
  return <AllOrders />;
}
