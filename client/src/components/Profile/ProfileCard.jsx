import {
  Eye,
  MapPin,
  Briefcase,
  User,
  Calendar,
  GraduationCap,
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
    // Open biodata in a new tab
    const url = `/profile/view/${profile.profileId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {/* Profile Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profile.gender === "Male" ? (
                <img
                  src="https://res.cloudinary.com/dtv7wldhe/image/upload/v1759583572/male_d4wuwd.png"
                  alt="Male Profile"
                  className="w-full h-full object-cover"
                />
              ) : profile.gender === "Female" ? (
                <img
                  src="https://res.cloudinary.com/dtv7wldhe/image/upload/v1759583575/female_p0k4x3.png"
                  alt="Female Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{profile.profileId}</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{profile.age} years</span>
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
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {profile.presentAddressDistrict && profile.presentAddressDivision
                ? `${profile.presentAddressDistrict}, ${profile.presentAddressDivision}`
                : profile.presentAddressDistrict ||
                  profile.presentAddressDivision ||
                  "Location not specified"}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <GraduationCap className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {profile.graduationSubject || "Education not specified"}
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
            onClick={handleViewProfile}
            className="flex-1 flex items-center justify-center px-3 py-2 text-white text-sm rounded-md transition-colors bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 cursor-pointer"
          >
            <Eye className="h-4 w-4 mr-1" />
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
