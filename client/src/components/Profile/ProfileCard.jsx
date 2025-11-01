import {
  ExternalLink,
  Navigation,
  Building2,
  UserCircle,
  CalendarDays,
  BookOpen,
  BookmarkX,
} from "lucide-react";
import BookmarkButton from "../BookmarkButton";
import { InlineSpinner } from "../LoadingSpinner";
import { memo } from "react";

const ProfileCard = memo(function ProfileCard({
  profile,
  onViewProfile,
  onRemoveBookmark,
  removingBookmark,
  showBookmarkDate = false,
}) {
  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(profile.profileId);
    } else {
      // Fallback to direct navigation if no prop provided
      const url = `/profile/view/${profile.profileId}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-lg border-2 border-gray-300 overflow-hidden hover:shadow-2xl transition-all duration-300 backdrop-blur-sm hover:border-gray-400 group relative flex flex-col h-full">
      {/* Watched Badge - Conditionally rendered */}
      {profile.isViewed && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2 px-4 shadow-md">
          <span className="font-bold text-sm tracking-wide">WATCHED</span>
        </div>
      )}

      {/* Profile Header */}
      <div
        className={`p-6 bg-gradient-to-r from-blue-50/30 to-purple-50/30 ${
          profile.isViewed ? "" : "pt-8"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-lg group-hover:ring-blue-200 transition-all duration-300">
                {profile.gender === "Male" ? (
                  <img
                    src="https://res.cloudinary.com/dkir6pztp/image/upload/v1761749493/Male_psqwq6.png"
                    alt="Male Profile"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : profile.gender === "Female" ? (
                  <img
                    src="https://res.cloudinary.com/dkir6pztp/image/upload/v1761749492/Female_l2vxzs.png"
                    alt="Female Profile"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <UserCircle className="h-7 w-7 text-black transition-colors duration-300" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-900 transition-colors duration-300">
                {profile.profileId}
              </h3>
              <div className="flex items-center text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded-full mt-1">
                <CalendarDays className="h-3 w-3 mr-1 text-black" />
                <span className="font-medium">{profile.age} years</span>
              </div>
            </div>
          </div>
          {onRemoveBookmark && (
            <button
              onClick={() => onRemoveBookmark(profile.profileId)}
              disabled={removingBookmark === profile.profileId}
              className={`p-2 rounded-md transition-colors ${
                removingBookmark === profile.profileId
                  ? "bg-gray-100 text-gray-400"
                  : "text-red-600 hover:bg-red-50"
              }`}
              title="Remove bookmark"
            >
              {removingBookmark === profile.profileId ? (
                <InlineSpinner />
              ) : (
                <BookmarkX className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <div className="space-y-2">
          <div
            className={`flex items-center ${
              profile.isViewed ? "text-sm" : "text-base"
            } text-gray-600`}
          >
            <Navigation
              className={`h-4 w-4 mr-2 text-black flex-shrink-0 ${
                profile.isViewed ? "" : "h-5 w-5"
              }`}
            />
            <span className="truncate">
              {profile.presentAddressDistrict && profile.presentAddressDivision
                ? `${profile.presentAddressDistrict}, ${profile.presentAddressDivision}`
                : profile.presentAddressDistrict ||
                  profile.presentAddressDivision ||
                  "Location not specified"}
            </span>
          </div>
          <div
            className={`flex items-center ${
              profile.isViewed ? "text-sm" : "text-base"
            } text-gray-600`}
          >
            <BookOpen
              className={`h-4 w-4 mr-2 text-black flex-shrink-0 ${
                profile.isViewed ? "" : "h-5 w-5"
              }`}
            />
            <span className="truncate">
              {profile.graduationSubject || "Education not specified"}
            </span>
          </div>
          <div
            className={`flex items-center ${
              profile.isViewed ? "text-sm" : "text-base"
            } text-gray-600`}
          >
            <Building2
              className={`h-4 w-4 mr-2 text-black flex-shrink-0 ${
                profile.isViewed ? "" : "h-5 w-5"
              }`}
            />
            <span className="truncate">
              {profile.profession || "Profession not specified"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 mt-auto">
        <div className="flex space-x-2">
          <button
            onClick={handleViewProfile}
            className="flex-1 flex items-center justify-center px-3 py-2 text-white text-sm rounded-md transition-colors bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Biodata
          </button>
        </div>
      </div>

      {/* Bookmark Date */}
      {showBookmarkDate && profile.createdAt && (
        <div className="px-6 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-500">
            Bookmarked on {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
});

export default ProfileCard;
