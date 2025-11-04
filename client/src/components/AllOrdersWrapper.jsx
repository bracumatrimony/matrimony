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

  
  useEffect(() => {
    const handleConfigChange = () => {
      setMonetizationEnabled(monetizationConfig.isEnabled());
      setIsLoading(false);
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    
    setMonetizationEnabled(monetizationConfig.isEnabled());
    setIsLoading(monetizationConfig.isLoading);

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
    };
  }, []);

  
  if (isLoading) {
    return <PageSpinner text="Loading..." />;
  }

  
  if (!monetizationEnabled) {
    return <FeatureNotAvailable featureName="All Orders" />;
  }

  
  return <AllOrders />;
}
