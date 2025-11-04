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

  
  useEffect(() => {
    const handleConfigChange = () => {
      setMonetizationEnabled(monetizationConfig.isEnabled());
      setIsLoading(false);
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    
    setMonetizationEnabled(monetizationConfig.isEnabled());
    if (monetizationConfig.isLoading && !monetizationConfig.isLoaded()) {
      setIsLoading(true);
    }

    
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

  
  if (isLoading) {
    return <PageSpinner text="Loading credits..." />;
  }

  
  if (!monetizationEnabled) {
    return <NotFound message="Credits Feature Not Available" />;
  }

  
  return <Credits />;
}
