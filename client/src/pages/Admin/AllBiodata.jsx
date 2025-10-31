import { useState, useEffect } from "react";
import { User, Users, Search, Download, Trash2 } from "lucide-react";
import adminService from "../../services/adminService";

export default function AllBiodata({ onViewProfile, showNotification }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState(false);
  const [restricting, setRestricting] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset to first page when searching
    }, 800); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadProfiles();
  }, [currentPage, itemsPerPage, searchQuery]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getApprovedProfiles(
        currentPage,
        itemsPerPage,
        searchQuery
      );
      if (response.success) {
        setProfiles(response.profiles || []);
        setTotalProfiles(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
      showNotification?.("Failed to load profiles.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (profileId) => {
    if (onViewProfile) {
      onViewProfile(profileId);
    }
  };

  const handleExportEmails = async () => {
    try {
      setExporting(true);
      showNotification?.("Exporting emails...", "info");

      // Fetch all profiles with a high limit to get all emails
      const response = await adminService.getApprovedProfiles(1, 10000, "");
      if (response.success && response.profiles) {
        const emails = response.profiles
          .map((profile) => profile.userId?.email)
          .filter((email) => email) // Remove any null/undefined emails
          .join("\n");

        // Create and download the file
        const blob = new Blob([emails], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `biodata_emails_${
          new Date().toISOString().split("T")[0]
        }.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification?.("Emails exported successfully!", "success");
      } else {
        showNotification?.("Failed to export emails.", "error");
      }
    } catch (error) {
      console.error("Failed to export emails:", error);
      showNotification?.("Failed to export emails.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleRestrictUser = async (userId) => {
    try {
      setRestricting(userId);
      const response = await adminService.restrictUser(userId);
      if (response.success) {
        showNotification?.("User restricted successfully", "success");
        loadProfiles(); // Reload the profiles list
      } else {
        showNotification?.("Failed to restrict user", "error");
      }
    } catch (error) {
      console.error("Failed to restrict user:", error);
      showNotification?.("Failed to restrict user", "error");
    } finally {
      setRestricting(null);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this biodata? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(profileId);
      const response = await adminService.deleteProfile(profileId);
      if (response.success) {
        showNotification?.("Biodata deleted successfully", "success");
        loadProfiles(); // Reload the profiles list
      } else {
        showNotification?.("Failed to delete biodata", "error");
      }
    } catch (error) {
      console.error("Failed to delete biodata:", error);
      showNotification?.("Failed to delete biodata", "error");
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(totalProfiles / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Biodata</h1>
          <p className="text-gray-600 mt-1">
            Manage all approved biodata profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Total: {totalProfiles} profiles
          </span>
          <button
            onClick={handleExportEmails}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 border border-transparent rounded-lg transition-colors duration-200"
            title="Export Emails"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export Emails"}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search profiles by ID, name, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Show per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profiles...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No profiles found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search criteria."
                : "No approved profiles available."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Profile ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Profile Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr
                      key={profile._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewProfile(profile.profileId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.profileId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {profile.userId?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {profile.userId?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {profile.viewCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex items-center justify-start gap-2">
                          <button
                            onClick={() =>
                              handleRestrictUser(profile.userId._id)
                            }
                            disabled={restricting === profile.userId._id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="Restrict User"
                          >
                            <User className="h-4 w-4" />
                            {restricting === profile.userId._id
                              ? "Restricting..."
                              : "Restrict"}
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile._id)}
                            disabled={deleting === profile._id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="Delete Biodata"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleting === profile._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalProfiles)}
                      </span>{" "}
                      of <span className="font-medium">{totalProfiles}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>‹
                      </button>
                      {(() => {
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, startPage + 4);
                        return Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => {
                            const pageNum = startPage + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pageNum === currentPage
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        );
                      })()}
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
