import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Filter, X, Plus } from "lucide-react";
import ProfileCard from "../components/Profile/ProfileCard";
import profileService from "../services/profileService";
import authService from "../services/authService";
import { SectionSpinner } from "../components/LoadingSpinner";
import { locationsByDivision } from "../utils/locationData";
import SEO from "../components/SEO";

export default function SearchProfiles() {
  const navigate = useNavigate();
  const { university: urlUniversity } = useParams();
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
  const [universities, setUniversities] = useState({});
  const [selectedUniversity, setSelectedUniversity] = useState(
    urlUniversity || null
  );
  const abortControllerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const loadUniversities = async () => {
    try {
      const universitiesData = await authService.getUniversities();
      if (universitiesData) {
        setUniversities(universitiesData);
      }
    } catch (error) {
      console.error("Error loading universities:", error);
    }
  };

  const handleUniversitySelect = (universityKey) => {
    navigate(`/search/${universityKey}`);
  };

  useEffect(() => {
    // Get current user
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Redirect restricted or banned users away from search
      if (user.isRestricted || user.isBanned) {
        navigate("/");
        return;
      }
    }

    // Load universities and profiles
    loadUniversities();
    if (!urlUniversity) {
      loadProfiles();
    }
  }, []);

  // Update selectedUniversity when URL university parameter changes
  useEffect(() => {
    setSelectedUniversity(urlUniversity || null);
    if (urlUniversity) {
      setPage(1);
      loadProfiles(
        { ...filters, searchQuery, university: urlUniversity },
        1,
        limit
      );
    }
  }, [urlUniversity]);

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
      loadProfiles(
        { ...memoizedFilters, university: selectedUniversity },
        1,
        limit
      );
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

        if (searchFilters.searchQuery && searchFilters.searchQuery.trim())
          backendFilters.search = searchFilters.searchQuery.trim();
        if (searchFilters.gender) backendFilters.gender = searchFilters.gender;
        if (searchFilters.ageMin) backendFilters.minAge = searchFilters.ageMin;
        if (searchFilters.ageMax) backendFilters.maxAge = searchFilters.ageMax;
        if (searchFilters.district && searchFilters.district !== "Any") {
          backendFilters.district = searchFilters.district;
        }
        if (searchFilters.religion)
          backendFilters.religion = searchFilters.religion;
        // Always include university filter if selectedUniversity exists
        if (selectedUniversity) {
          backendFilters.university = selectedUniversity;
        }
        // Override with searchFilters university if specified
        if (searchFilters.university) {
          backendFilters.university = searchFilters.university;
        }

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
    [page, limit, selectedUniversity]
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
    setSelectedUniversity(null);
    setPage(1);
    navigate("/search");
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
      await loadProfiles(
        { ...filters, searchQuery, university: selectedUniversity },
        newPage,
        limit
      );
    }
  };
  const handleNextPage = async () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      await loadProfiles(
        { ...filters, searchQuery, university: selectedUniversity },
        newPage,
        limit
      );
    }
  };

  return (
    <>
      <SEO
        title="Search Profiles"
        description="Search and find compatible matches from Campus Matrimony. Browse verified profiles with advanced filters for age, location, and preferences."
        keywords="search profiles, find matches, Campus matrimony search, biodata search"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
        {/* Mobile Filter Bar - Only show when university is selected */}
        {selectedUniversity && (
          <div className="block md:hidden bg-white border-b border-slate-200 shadow-sm">
            <div className="px-4 py-3">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Filter className="h-5 w-5" />
                <span className="font-medium">Filter Profiles</span>
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Search and Filters (Desktop) - Only show when university is selected */}
          {selectedUniversity && (
            <div className="hidden md:flex w-80 bg-white border-r border-slate-200 min-h-full flex-col shadow-lg">
              {/* Filters */}
              <div className="p-6 flex-1 bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-800">
                    Refine Your Search
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-slate-600 hover:text-slate-800 transition-colors cursor-pointer underline decoration-slate-300 hover:decoration-slate-600"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Looking for
                    </label>
                    <select
                      value={filters.gender}
                      onChange={(e) =>
                        handleFilterChange("gender", e.target.value)
                      }
                      className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md"
                    >
                      <option value="">Any Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Age Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Age Range
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="number"
                        placeholder="Min age"
                        value={filters.ageMin}
                        onChange={(e) =>
                          handleFilterChange("ageMin", e.target.value)
                        }
                        className="w-1/2 px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                      />
                      <input
                        type="number"
                        placeholder="Max age"
                        value={filters.ageMax}
                        onChange={(e) =>
                          handleFilterChange("ageMax", e.target.value)
                        }
                        className="w-1/2 px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Preferred Location
                    </label>
                    <select
                      value={filters.district}
                      onChange={(e) =>
                        handleFilterChange("district", e.target.value)
                      }
                      className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md"
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
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Religion
                    </label>
                    <select
                      value={filters.religion}
                      onChange={(e) =>
                        handleFilterChange("religion", e.target.value)
                      }
                      className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md"
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
                  <div className="pt-6">
                    <button
                      onClick={() => {
                        setPage(1);
                        loadProfiles(
                          {
                            ...filters,
                            searchQuery,
                            university: selectedUniversity,
                          },
                          1,
                          limit
                        );
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-4 rounded-lg transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Filter Drawer - Only show when university is selected */}
          {selectedUniversity && isFilterOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              />

              {/* Drawer */}
              <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden flex flex-col shadow-2xl border-r border-slate-200">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-xl font-medium text-slate-800">
                    Refine Your Search
                  </h2>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-slate-600" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Filters */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-slate-800">
                        Filters
                      </h3>
                      <button
                        onClick={clearFilters}
                        className="text-xs text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Gender Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Looking for
                        </label>
                        <select
                          value={filters.gender}
                          onChange={(e) =>
                            handleFilterChange("gender", e.target.value)
                          }
                          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md"
                        >
                          <option value="">Any Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      {/* Age Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Age Range
                        </label>
                        <div className="flex space-x-3">
                          <input
                            type="number"
                            placeholder="Min age"
                            value={filters.ageMin}
                            onChange={(e) =>
                              handleFilterChange("ageMin", e.target.value)
                            }
                            className="w-1/2 px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                          />
                          <input
                            type="number"
                            placeholder="Max age"
                            value={filters.ageMax}
                            onChange={(e) =>
                              handleFilterChange("ageMax", e.target.value)
                            }
                            className="w-1/2 px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                          />
                        </div>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Preferred Location
                        </label>
                        <select
                          value={filters.district}
                          onChange={(e) =>
                            handleFilterChange("district", e.target.value)
                          }
                          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md"
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
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Religion
                        </label>
                        <select
                          value={filters.religion}
                          onChange={(e) =>
                            handleFilterChange("religion", e.target.value)
                          }
                          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md"
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
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => {
                      setPage(1);
                      loadProfiles(
                        {
                          ...filters,
                          searchQuery,
                          university: selectedUniversity,
                        },
                        1,
                        limit
                      );
                      setIsFilterOpen(false);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-4 rounded-lg transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* University Selection or Profile Grid */}
            <div className="px-6 sm:px-8 py-8">
              <div className="max-w-7xl mx-auto">
                {selectedUniversity ? (
                  /* Show profiles for selected university */
                  <>
                    {loading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                        {/* Skeleton loading cards */}
                        {Array.from({ length: 12 }).map((_, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-pulse"
                          >
                            {/* Profile image skeleton */}
                            <div className="p-6 bg-gradient-to-r from-blue-50/30 to-purple-50/30 pt-8">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                                <div>
                                  <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                              </div>
                            </div>
                            {/* Action button skeleton */}
                            <div className="p-4 bg-gray-50">
                              <div className="h-10 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                          <span className="text-red-600 text-3xl">!</span>
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-slate-800 mb-4">
                          Unable to Load Profiles
                        </h3>
                        <p className="text-slate-600 mb-8 text-lg">{error}</p>
                        <button
                          onClick={() =>
                            loadProfiles(
                              { ...filters, searchQuery },
                              page,
                              limit
                            )
                          }
                          className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-4 rounded-lg transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : profiles.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                          {profiles.map((profile, index) => (
                            <div
                              key={profile._id || profile.id}
                              className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300 animate-fadeInUp"
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
                        <div className="flex flex-wrap justify-center items-center mt-12 gap-2 sm:gap-3">
                          <button
                            onClick={handlePrevPage}
                            disabled={page === 1}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm sm:text-base ${
                              page === 1
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:shadow-md"
                            }`}
                          >
                            <span className="hidden sm:inline">
                              &larr; Previous
                            </span>
                            <span className="sm:hidden">&larr;</span>
                          </button>
                          {/* Page number buttons */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            {(() => {
                              const pages = [];
                              const showEllipsis = totalPages > 5;

                              if (!showEllipsis) {
                                // Show all pages if 5 or fewer
                                for (let i = 1; i <= totalPages; i++) {
                                  pages.push(
                                    <button
                                      key={i}
                                      onClick={() => {
                                        if (i !== page) {
                                          setPage(i);
                                          loadProfiles(
                                            { ...filters, searchQuery },
                                            i,
                                            limit
                                          );
                                        }
                                      }}
                                      className={`px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-w-[40px] sm:min-w-[44px] ${
                                        i === page
                                          ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer hover:shadow-md"
                                      }`}
                                      disabled={i === page}
                                    >
                                      {i}
                                    </button>
                                  );
                                }
                              } else {
                                // Show limited pages with ellipsis for larger page counts
                                const startPage = Math.max(1, page - 1);
                                const endPage = Math.min(totalPages, page + 1);

                                // Always show first page
                                if (startPage > 1) {
                                  pages.push(
                                    <button
                                      key={1}
                                      onClick={() => {
                                        setPage(1);
                                        loadProfiles(
                                          { ...filters, searchQuery },
                                          1,
                                          limit
                                        );
                                      }}
                                      className={`px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-w-[40px] sm:min-w-[44px] ${
                                        1 === page
                                          ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer hover:shadow-md"
                                      }`}
                                      disabled={1 === page}
                                    >
                                      1
                                    </button>
                                  );
                                  if (startPage > 2) {
                                    pages.push(
                                      <span
                                        key="start-ellipsis"
                                        className="px-1 sm:px-2 text-slate-400 select-none text-sm"
                                      >
                                        ...
                                      </span>
                                    );
                                  }
                                }

                                // Show current page range
                                for (let i = startPage; i <= endPage; i++) {
                                  pages.push(
                                    <button
                                      key={i}
                                      onClick={() => {
                                        if (i !== page) {
                                          setPage(i);
                                          loadProfiles(
                                            { ...filters, searchQuery },
                                            i,
                                            limit
                                          );
                                        }
                                      }}
                                      className={`px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-w-[40px] sm:min-w-[44px] ${
                                        i === page
                                          ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer hover:shadow-md"
                                      }`}
                                      disabled={i === page}
                                    >
                                      {i}
                                    </button>
                                  );
                                }

                                // Always show last page
                                if (endPage < totalPages) {
                                  if (endPage < totalPages - 1) {
                                    pages.push(
                                      <span
                                        key="end-ellipsis"
                                        className="px-1 sm:px-2 text-slate-400 select-none text-sm"
                                      >
                                        ...
                                      </span>
                                    );
                                  }
                                  pages.push(
                                    <button
                                      key={totalPages}
                                      onClick={() => {
                                        setPage(totalPages);
                                        loadProfiles(
                                          { ...filters, searchQuery },
                                          totalPages,
                                          limit
                                        );
                                      }}
                                      className={`px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-w-[40px] sm:min-w-[44px] ${
                                        totalPages === page
                                          ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer hover:shadow-md"
                                      }`}
                                      disabled={totalPages === page}
                                    >
                                      {totalPages}
                                    </button>
                                  );
                                }
                              }

                              return pages;
                            })()}
                          </div>
                          <button
                            onClick={handleNextPage}
                            disabled={page === totalPages}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm sm:text-base ${
                              page === totalPages
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:shadow-md"
                            }`}
                          >
                            <span className="hidden sm:inline">
                              Next &rarr;
                            </span>
                            <span className="sm:hidden">&rarr;</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center py-12 max-w-md mx-auto">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No biodata found
                          </h3>
                          <p className="text-gray-600 mb-4">
                            We couldn't find any biodata matching your criteria.
                            Try adjusting your search filters to discover more
                            potential matches.
                          </p>
                          <button
                            onClick={clearFilters}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-4 rounded-lg transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8">
                    <div className="text-center mb-12">
                      <h1 className="text-4xl font-bold text-slate-800 mb-4">
                        Select Your Institution
                      </h1>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                      {Object.entries(universities).map(([key, university]) => (
                        <div
                          key={key}
                          onClick={() => handleUniversitySelect(key)}
                          className="bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                        >
                          <div className="aspect-video bg-slate-50 relative overflow-hidden">
                            <img
                              src={university.bannerImage}
                              alt={university.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/400x225/64748b/ffffff?text=University";
                              }}
                            />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-semibold text-slate-800 mb-3">
                              {university.name}
                            </h3>
                            <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                              Explore verified biodata from {university.name}{" "}
                              students, faculty and alumni
                            </p>
                            <div className="text-sm font-medium text-slate-700">
                              Browse Biodata →
                            </div>
                          </div>
                        </div>
                      ))}
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
              className="fixed bottom-8 right-8 bg-slate-800 hover:bg-slate-900 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-300 z-50 border-2 border-white cursor-pointer"
              title="Create New Profile"
            >
              <Plus className="h-8 w-8" />
            </button>
          )}
      </div>
    </>
  );
}
