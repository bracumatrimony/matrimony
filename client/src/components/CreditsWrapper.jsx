import { useState, useEffect } from "react";
import { monetizationConfig } from "../config/monetization";
import Credits from "../pages/Credits";
import NotFound from "../components/NotFound";
import { PageSpinner } from "../components/LoadingSpinner";

export default function CreditsWrapper() {
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Listen for monetization config changes
  useEffect(() => {
    const handleConfigChange = () => {
      setMonetizationEnabled(monetizationConfig.isEnabled());
      setIsLoading(false);
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    // Initial check - only show loading if config is actually still loading and not loaded
    setMonetizationEnabled(monetizationConfig.isEnabled());
    if (monetizationConfig.isLoading && !monetizationConfig.isLoaded()) {
      setIsLoading(true);
    }

    // Set a timeout to prevent infinite loading (500ms max)
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
      clearTimeout(timeout);
    };
  }, []);

  // Show loading while config is being fetched
  if (isLoading) {
    return <PageSpinner text="Loading credits..." />;
  }

  // Show 404 if monetization is disabled
  if (!monetizationEnabled) {
    return <NotFound message="Credits Feature Not Available" />;
  }

  // Show credits page if monetization is enabled
  return <Credits />;
}
