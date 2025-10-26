import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import profileService from "../services/profileService";
import { SectionSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

export default function MyUnlocks() {
  const [unlockedProfiles, setUnlockedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          <div className="flex justify-center items-center min-h-64">
            <SectionSpinner text="Loading unlocked profiles..." />
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
                  {unlockedProfiles.map((profile, index) => {
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
      </div>
    </div>
  );
}
