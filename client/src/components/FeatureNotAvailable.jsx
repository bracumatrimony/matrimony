import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function FeatureNotAvailable({ featureName = "Feature" }) {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <span className="text-red-600 text-xl font-bold">404</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {featureName} Not Available
        </h2>

        <p className="text-gray-600 mb-6">
          This feature is currently unavailable. Please check back later or
          contact support if you need assistance.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="ml-3 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
