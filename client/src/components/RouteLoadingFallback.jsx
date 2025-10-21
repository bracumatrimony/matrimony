import { useEffect, useState } from "react";

/**
 * Route loading fallback with delayed spinner to avoid flash on fast loads
 */
export default function RouteLoadingFallback() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Only show spinner if loading takes more than 200ms
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (!showSpinner) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}
