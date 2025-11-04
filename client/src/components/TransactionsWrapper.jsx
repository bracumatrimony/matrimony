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

  
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.email.endsWith("@gmail.com") && !user.alumniVerified) {
        navigate("/");
      }
    }
  }, [navigate]);

  
  if (isLoading) {
    return <PageSpinner text="Loading..." />;
  }

  
  if (!monetizationEnabled) {
    return <FeatureNotAvailable featureName="Transactions" />;
  }

  
  return <Transaction />;
}
