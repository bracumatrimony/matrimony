import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Bookmark,
  BookmarkX,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import bookmarkService from "../services/bookmarkService";
import { useAuth } from "../contexts/AuthContext";
import { InlineSpinner } from "../components/LoadingSpinner";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingBookmark, setRemovingBookmark] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookmarks: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 16,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadBookmarks(1);
  }, [user, navigate]);

  const loadBookmarks = async (page = 1) => {
    try {
      setLoading(true);
      const limit = pagination?.limit || 9;
      const response = await bookmarkService.getBookmarks(page, limit);
      if (response.success) {
        setBookmarks(response.bookmarks);
        setPagination(response.pagination);
      } else {
        setError(response.message || "Failed to load bookmarks");
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setError("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (profileId) => {
    try {
      setRemovingBookmark(profileId);
      const response = await bookmarkService.removeBookmark(profileId);
      if (response.success) {
        
        
        const remainingItems = bookmarks.length - 1;
        if (remainingItems === 0 && pagination.currentPage > 1) {
          loadBookmarks(pagination.currentPage - 1);
        } else {
          
          loadBookmarks(pagination.currentPage);
        }
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
    } finally {
      setRemovingBookmark(null);
    }
  };

  const handleViewProfile = (profileId) => {
    
    const url = `/profile/view/${profileId}`;
    window.open(url, "_blank");
  };

  const pageButtons = useMemo(() => {
    return Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
      .map((num) => {
        
        if (
          num === 1 ||
          num === pagination.totalPages ||
          Math.abs(num - pagination.currentPage) <= 1
        ) {
          return (
            <button
              key={num}
              onClick={() => {
                if (num !== pagination.currentPage) {
                  loadBookmarks(num);
                }
              }}
              className={`px-3 py-2 rounded-full font-semibold transition-colors shadow-sm border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                num === pagination.currentPage
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-rose-50 hover:border-rose-400 cursor-pointer"
              }`}
              disabled={num === pagination.currentPage}
            >
              {num}
            </button>
          );
        } else if (
          num === pagination.currentPage - 2 ||
          num === pagination.currentPage + 2
        ) {
          return (
            <span key={num} className="px-2 text-gray-400 select-none">
              ...
            </span>
          );
        }
        return null;
      })
      .filter(Boolean);
  }, [pagination.totalPages, pagination.currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse"
              >
                {}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                  </div>
                  {}
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                  </div>
                </div>
                {}
                <div className="p-4 bg-gray-50">
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                {}
                <div className="px-6 py-3 bg-gray-50 border-t">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error Loading Bookmarks
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => loadBookmarks(1)}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
            </div>
            {pagination &&
              typeof pagination.totalBookmarks === "number" &&
              pagination.totalBookmarks > 0 && (
                <div className="text-sm text-gray-600">
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalBookmarks
                  )}{" "}
                  of {pagination.totalBookmarks} bookmarks
                </div>
              )}
          </div>
        </div>
        {}
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Bookmarks Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring profiles and bookmark the ones you're interested
              in.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Browse Profiles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bookmarks.map((bookmark) => {
              const profile = bookmark.profile;
              return (
                <div
                  key={profile._id}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Profile Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {profile.profileId}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{profile.age} years</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveBookmark(profile.profileId)}
                        disabled={removingBookmark === profile.profileId}
                        className={`p-2 rounded-md transition-colors ${
                          removingBookmark === profile.profileId
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:bg-red-50 cursor-pointer"
                        }`}
                        title="Remove bookmark"
                      >
                        {removingBookmark === profile.profileId ? (
                          <InlineSpinner />
                        ) : (
                          <BookmarkX className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {profile.presentAddressDistrict &&
                          profile.presentAddressDivision
                            ? `${profile.presentAddressDistrict}, ${profile.presentAddressDivision}`
                            : profile.presentAddressDistrict ||
                              profile.presentAddressDivision ||
                              "Location not specified"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {profile.graduationSubject ||
                            "Education not specified"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {profile.profession || "Profession not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProfile(profile.profileId)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors cursor-pointer bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Biodata
                      </button>
                    </div>
                  </div>

                  {/* Bookmark Date */}
                  <div className="px-6 py-3 bg-gray-50 border-t">
                    <p className="text-xs text-gray-500">
                      Bookmarked on{" "}
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination &&
          typeof pagination.totalPages === "number" &&
          pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => loadBookmarks(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 rounded-full font-semibold transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-100 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  !pagination.hasPrevPage
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
              </button>

              {pageButtons}

              <button
                onClick={() => loadBookmarks(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-full font-semibold transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-100 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  !pagination.hasNextPage
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
