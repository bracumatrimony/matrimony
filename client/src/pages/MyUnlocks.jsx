import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import profileService from "../services/profileService";
import { useAuth } from "../contexts/AuthContext";

export default function MyUnlocks() {
  const [unlockedProfiles, setUnlockedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.email.endsWith("@gmail.com") && !user.alumniVerified) {
      navigate("/");
      return;
    }

    const fetchUnlockedProfiles = async () => {
      try {
        const res = await profileService.getUnlockedProfiles();
        setUnlockedProfiles(Array.isArray(res.profiles) ? res.profiles : []);
        setError(null); // Clear any previous errors on success
      } catch (err) {
        console.log("Error details:", err); // Debug log
        // Handle different error types
        if (err.response?.status === 404) {
          // Route not found or no profiles - treat as empty state
          console.log("404 error - treating as empty state");
          setUnlockedProfiles([]);
          setError(null);
        } else if (err.message && err.message.includes("Profile not found")) {
          // Server returned "Profile not found" - treat as empty state
          console.log("Profile not found - treating as empty state");
          setUnlockedProfiles([]);
          setError(null);
        } else {
          // Real error
          setError("Failed to load unlocked profiles");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnlockedProfiles();
  }, [user, navigate]);

  // Pagination calculations
  const totalPages = Math.ceil(unlockedProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProfiles = unlockedProfiles.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-gray-800 to-black rounded-lg p-6 text-white shadow-lg animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
          {/* Unlocked Profiles Table Skeleton */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-800 to-black">
                  <tr>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Biodata ID
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Unlocked Date
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="py-4 px-4 md:px-6">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-gray-800 to-black rounded-lg p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">My Unlocks</h1>
            <p className="text-gray-100">
              View all biodata you have unlocked with credits
            </p>
          </div>
        </div>

        {/* Unlocked Profiles List */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {unlockedProfiles.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No unlocked biodata yet
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't unlocked any biodata yet. Browse biodata's and
                unlock contact information using your credits.
              </p>
              <button
                onClick={() => navigate("/search")}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-2 rounded-md transition-colors font-medium cursor-pointer"
              >
                Browse Biodatas
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-800 to-black">
                  <tr>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Biodata ID
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Unlocked Date
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProfiles.map((profile, index) => {
                    const rowBgColor =
                      index % 2 === 0 ? "bg-white" : "bg-gray-50";
                    return (
                      <tr
                        key={profile._id}
                        className={`${rowBgColor} hover:bg-blue-50 transition-colors duration-150`}
                      >
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {profile.biodataId}
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(profile.unlockedAt)}
                        </td>
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                          <button
                            onClick={() =>
                              navigate(`/profile/view/${profile.profileId}`)
                            }
                            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                          >
                            View Biodata
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {unlockedProfiles.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Pagination info */}
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-
              {Math.min(endIndex, unlockedProfiles.length)} of{" "}
              {unlockedProfiles.length} unlocked profiles
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-50 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (num) => {
                  // Show first, last, current, and neighbors; ellipsis for gaps
                  if (
                    num === 1 ||
                    num === totalPages ||
                    Math.abs(num - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={num}
                        onClick={() => handlePageChange(num)}
                        className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                          num === currentPage
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-rose-50 hover:border-rose-400 cursor-pointer"
                        }`}
                        disabled={num === currentPage}
                      >
                        {num}
                      </button>
                    );
                  } else if (
                    num === currentPage - 2 ||
                    num === currentPage + 2
                  ) {
                    return (
                      <span
                        key={num}
                        className="px-2 text-gray-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-50 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
