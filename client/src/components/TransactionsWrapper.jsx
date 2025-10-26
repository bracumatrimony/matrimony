import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { monetizationConfig } from "../config/monetization";
import Transaction from "../components/Transaction";
import FeatureNotAvailable from "../components/FeatureNotAvailable";
import { PageSpinner } from "../components/LoadingSpinner";

export default function TransactionsWrapper() {
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const [isLoading, setIsLoading] = useState(monetizationConfig.isLoading);
  const navigate = useNavigate();

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

  // Check user access
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.email.endsWith("@gmail.com") && !user.alumniVerified) {
        navigate("/");
      }
    }
  }, [navigate]);

  // Show loading while config is being fetched
  if (isLoading) {
    return <PageSpinner text="Loading..." />;
  }

  // Show 404 if monetization is disabled
  if (!monetizationEnabled) {
    return <FeatureNotAvailable featureName="Transactions" />;
  }

  // Show transactions page if monetization is enabled
  return <Transaction />;
}
