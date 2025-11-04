import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import bookmarkService from "../services/bookmarkService";
import { useAuth } from "../contexts/AuthContext";

export default function BookmarkButton({
  profileId,
  className = "",
  showText = true,
  size = "lg",
  variant = "default",
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && profileId) {
      checkBookmarkStatus();
    }
  }, [user, profileId]);

  const checkBookmarkStatus = async () => {
    try {
      setChecking(true);
      const response = await bookmarkService.isBookmarked(profileId);
      if (response.success) {
        setIsBookmarked(response.isBookmarked);
      }
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const response = await bookmarkService.toggleBookmark(profileId);
      if (response.success) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  
  const sizeConfig = {
    sm: {
      padding: "px-2 py-1",
      iconSize: "h-3 w-3",
      textSize: "text-xs",
      spinnerSize: "h-3 w-3",
    },
    md: {
      padding: "px-4 py-2",
      iconSize: "h-4 w-4",
      textSize: "text-sm",
      spinnerSize: "h-4 w-4",
    },
    lg: {
      padding: "px-6 py-3",
      iconSize: "h-5 w-5",
      textSize: "text-base",
      spinnerSize: "h-5 w-5",
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const getButtonClass = () => {
    const baseClass = `
      flex items-center justify-center transition-all duration-200 font-medium
      ${showText ? "space-x-2" : ""}
      ${currentSize.padding}
      ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      ${className}
    `;

    if (variant === "minimal") {
      return `${baseClass} rounded-md ${
        isBookmarked
          ? "text-red-600 hover:text-red-700"
          : "text-gray-600 hover:text-gray-700"
      }`;
    }

    return `${baseClass} rounded-md ${
      isBookmarked
        ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
    }`;
  };

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={loading || checking}
      className={getButtonClass()}
      title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
    >
      {loading ? (
        <div
          className={`animate-spin rounded-full border-b-2 border-current ${currentSize.spinnerSize}`}
        ></div>
      ) : isBookmarked ? (
        <BookmarkCheck className={currentSize.iconSize} />
      ) : (
        <Bookmark className={currentSize.iconSize} />
      )}
      {showText && (
        <span className={currentSize.textSize}>
          {loading ? "Updating..." : isBookmarked ? "Bookmarked" : "Bookmark"}
        </span>
      )}
    </button>
  );
}
