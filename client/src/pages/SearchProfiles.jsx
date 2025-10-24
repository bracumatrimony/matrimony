import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, X, Plus } from "lucide-react";
import ProfileCard from "../components/Profile/ProfileCard";
import profileService from "../services/profileService";
import authService from "../services/authService";
import { SectionSpinner } from "../components/LoadingSpinner";
import { locationsByDivision } from "../utils/locationData";
import SEO from "../components/SEO";

export default function SearchProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    ageMin: "",
    ageMax: "",
    district: "",
    religion: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12); // Show 12 per page
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const abortControllerRef = useRef(null);

  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Get current user
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    // Load profiles from API
    loadProfiles();
  }, []);

  // Optimize search with useMemo for filters
  const memoizedFilters = useMemo(
    () => ({
      ...filters,
      searchQuery,
    }),
    [
      filters.gender,
      filters.ageMin,
      filters.ageMax,
      filters.district,
      filters.religion,
      searchQuery,
    ]
  );

  // Auto-reload when search query or filters change - optimized debounce
  useEffect(() => {
    // Skip for initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      setPage(1);
      loadProfiles(memoizedFilters, 1, limit);
    }, 800); // Increased to 800ms for better debouncing

    return () => clearTimeout(timeoutId);
  }, [memoizedFilters, limit]);
  const loadProfiles = useCallback(
    async (searchFilters = {}, pageNum = page, lim = limit) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setLoading(true);
        setError(null);

        // Prepare filters for backend
        const backendFilters = {
          page: pageNum,
          limit: lim,
        };

        if (searchQuery.trim()) backendFilters.search = searchQuery.trim();
        if (searchFilters.gender) backendFilters.gender = searchFilters.gender;
        if (searchFilters.ageMin) backendFilters.minAge = searchFilters.ageMin;
        if (searchFilters.ageMax) backendFilters.maxAge = searchFilters.ageMax;
        if (searchFilters.district && searchFilters.district !== "Any") {
          backendFilters.district = searchFilters.district;
        }
        if (searchFilters.religion)
          backendFilters.religion = searchFilters.religion;

        const response = await profileService.searchProfiles(backendFilters, {
          signal,
        });

        if (response.success) {
          // Profiles are already formatted by the service
          setProfiles(response.profiles || []);
          setTotalPages(response.pagination?.pages || 1);
        } else {
          setError("Failed to load profiles");
        }
      } catch (error) {
        if (error.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        console.error("Error loading profiles:", error);
        setError(error.message || "Failed to load profiles");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, searchQuery]
  );

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const clearFilters = async () => {
    const clearedFilters = {
      gender: "",
      ageMin: "",
      ageMax: "",
      district: "",
      religion: "",
    };
    setFilters(clearedFilters);
    setSearchQuery("");
    setPage(1);
    await loadProfiles({ ...clearedFilters, searchQuery: "" }, 1, limit);
  };

  const handleUnlockProfile = (profileId) => {
    // Implement unlock logic
    console.log("Unlocking profile:", profileId);
  };

  const handleViewProfile = (profileId) => {
    // Open biodata in a new tab
    const url = `/profile/view/${profileId}`;
    window.open(url, "_blank");
  };

  // Pagination handlers
  const handlePrevPage = async () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      await loadProfiles({ ...filters, searchQuery }, newPage, limit);
    }
  };
  const handleNextPage = async () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      await loadProfiles({ ...filters, searchQuery }, newPage, limit);
    }
  };

  return (
    <>
      <SEO
        title="Search Profiles"
        description="Search and find compatible matches from BRACU Matrimony. Browse verified profiles with advanced filters for age, location, and preferences."
        keywords="search profiles, find matches, BRACU matrimony search, biodata search"
      />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile Search Bar */}
        <div className="block lg:hidden px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex gap-2">
            <div className="relative group flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 h-4 w-4 transition-colors" />
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Search and Filters (Desktop) */}
          <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 min-h-full flex-col">
            {/* Search Bar */}
            <div className="hidden p-6 border-b border-gray-100">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 h-4 w-4 transition-colors" />
                <input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-4">
                {/* Gender Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) =>
                      handleFilterChange("gender", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors bg-white"
                  >
                    <option value="">Any Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Age Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Age Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.ageMin}
                      onChange={(e) =>
                        handleFilterChange("ageMin", e.target.value)
                      }
                      className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.ageMax}
                      onChange={(e) =>
                        handleFilterChange("ageMax", e.target.value)
                      }
                      className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Preferred District/Region
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) =>
                      handleFilterChange("district", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors bg-white"
                  >
                    {locationsByDivision[""].map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {Object.entries(locationsByDivision).map(
                      ([division, locations]) => {
                        if (division === "") return null;
                        return (
                          <optgroup key={division} label={division}>
                            {locations.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </optgroup>
                        );
                      }
                    )}
                  </select>
                </div>

                {/* Religion Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Religion
                  </label>
                  <select
                    value={filters.religion}
                    onChange={(e) =>
                      handleFilterChange("religion", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors bg-white"
                  >
                    <option value="">Any Religion</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Christian">Christian</option>
                    <option value="Buddhist">Buddhist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Apply Filter Button */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setPage(1);
                      loadProfiles({ ...filters, searchQuery }, 1, limit);
                    }}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filter Drawer */}
          {isFilterOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              />

              {/* Drawer */}
              <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden flex flex-col shadow-xl">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Filters & Search
                  </h2>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Search Bar in Drawer */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 h-4 w-4 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search profiles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Filters
                      </h3>
                      <button
                        onClick={clearFilters}
                        className="text-xs text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Gender Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={filters.gender}
                          onChange={(e) =>
                            handleFilterChange("gender", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors bg-white"
                        >
                          <option value="">Any Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      {/* Age Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Age Range
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters.ageMin}
                            onChange={(e) =>
                              handleFilterChange("ageMin", e.target.value)
                            }
                            className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters.ageMax}
                            onChange={(e) =>
                              handleFilterChange("ageMax", e.target.value)
                            }
                            className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Preferred District/Region
                        </label>
                        <select
                          value={filters.district}
                          onChange={(e) =>
                            handleFilterChange("district", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors bg-white"
                        >
                          {locationsByDivision[""].map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                          {Object.entries(locationsByDivision).map(
                            ([division, locations]) => {
                              if (division === "") return null;
                              return (
                                <optgroup key={division} label={division}>
                                  {locations.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            }
                          )}
                        </select>
                      </div>

                      {/* Religion Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Religion
                        </label>
                        <select
                          value={filters.religion}
                          onChange={(e) =>
                            handleFilterChange("religion", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors bg-white"
                        >
                          <option value="">Any Religion</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Christian">Christian</option>
                          <option value="Buddhist">Buddhist</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <button
                    onClick={() => {
                      setPage(1);
                      loadProfiles({ ...filters, searchQuery }, 1, limit);
                      setIsFilterOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Grid */}
            <div className="px-4 sm:px-6 py-4 sm:py-8">
              <div className="max-w-7xl mx-auto">
                {loading ? (
                  <div className="text-center py-16">
                    <SectionSpinner text="Loading profiles..." />
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-300 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-white text-2xl">!</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Failed to load profiles
                    </h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                      onClick={loadProfiles}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : profiles.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {profiles.map((profile, index) => (
                        <div
                          key={profile._id || profile.id}
                          className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow animate-fadeInUp"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <ProfileCard
                            profile={profile}
                            onViewProfile={handleViewProfile}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex flex-wrap justify-center items-center mt-6 sm:mt-8 gap-1 sm:gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className={`px-3 sm:px-4 py-2 rounded-full font-semibold transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-100 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm sm:text-base ${
                          page === 1
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        &larr;
                      </button>
                      {/* Page number buttons */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (num) => {
                          // Show first, last, current, and neighbors; ellipsis for gaps
                          if (
                            num === 1 ||
                            num === totalPages ||
                            Math.abs(num - page) <= 1
                          ) {
                            return (
                              <button
                                key={num}
                                onClick={() => {
                                  if (num !== page) {
                                    setPage(num);
                                    loadProfiles(
                                      { ...filters, searchQuery },
                                      num,
                                      limit
                                    );
                                  }
                                }}
                                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-semibold transition-colors shadow-sm border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                                  num === page
                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-rose-50 hover:border-rose-400 cursor-pointer"
                                }`}
                                disabled={num === page}
                              >
                                {num}
                              </button>
                            );
                          } else if (num === page - 2 || num === page + 2) {
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
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className={`px-3 sm:px-4 py-2 rounded-full font-semibold transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-100 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm sm:text-base ${
                          page === totalPages
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        &rarr;
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-full">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Filter className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        No profiles found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your search criteria or filters to find
                        more profiles.
                      </p>
                      <button
                        onClick={clearFilters}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer font-medium"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button - Only for BRACU Google users */}
        {currentUser &&
          currentUser.isGoogleUser &&
          authService.isValidBRACUEmail(currentUser.email) && (
            <button
              onClick={() => navigate("/profile/create")}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-rose-300 z-50 border-2 border-white cursor-pointer"
              title="Create New Profile"
            >
              <Plus className="h-8 w-8" />
            </button>
          )}
      </div>
    </>
  );
}
