import { useState, useEffect } from "react";
import { User, Users, Search, Download, Trash2 } from "lucide-react";
import adminService from "../../services/adminService";

export default function AllUsers({ onViewProfile, showNotification }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState(false);
  const [restricting, setRestricting] = useState(null);
  const [banning, setBanning] = useState(null);
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
    loadUsers();
  }, [currentPage, itemsPerPage, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(
        currentPage,
        itemsPerPage,
        searchQuery
      );
      if (response.success) {
        setUsers(response.users || []);
        setTotalUsers(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      showNotification?.("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportEmails = async () => {
    try {
      setExporting(true);
      showNotification?.("Exporting emails...", "info");

      // Fetch all users with a high limit to get all emails
      const response = await adminService.getUsers(1, 10000, "");
      if (response.success && response.users) {
        const emails = response.users
          .map((user) => user.email)
          .filter((email) => email) // Remove any null/undefined emails
          .join("\n");

        // Create and download the file
        const blob = new Blob([emails], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user_emails_${
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

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const handleRestrictUser = async (userId, e) => {
    e.stopPropagation(); // Prevent row click
    try {
      setRestricting(userId);
      const response = await adminService.restrictUser(userId);
      if (response.success) {
        showNotification?.("User restricted successfully", "success");
        loadUsers(); // Reload the users list
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

  const handleBanUser = async (userId, e) => {
    e.stopPropagation(); // Prevent row click
    try {
      setBanning(userId);
      const response = await adminService.banUser(userId);
      if (response.success) {
        showNotification?.("User banned successfully", "success");
        loadUsers(); // Reload the users list
      } else {
        showNotification?.("Failed to ban user", "error");
      }
    } catch (error) {
      console.error("Failed to ban user:", error);
      showNotification?.("Failed to ban user", "error");
    } finally {
      setBanning(null);
    }
  };

  const handleDeleteUser = async (userId, e) => {
    e.stopPropagation(); // Prevent row click
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this user? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      setDeleting(userId);
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        showNotification?.("User deleted successfully", "success");
        loadUsers(); // Reload the users list
      } else {
        showNotification?.("Failed to delete user", "error");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      showNotification?.("Failed to delete user", "error");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      {users.length > 0 || searchInput ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or profile ID..."
                value={searchInput}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Items per page selector */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
              >
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">users per page</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportEmails}
                disabled={exporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Emails
                  </>
                )}
              </button>
              <div className="text-sm text-gray-600">
                Showing{" "}
                {totalUsers > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
                {Math.min(currentPage * itemsPerPage, totalUsers)} of{" "}
                {totalUsers} users
              </div>
            </div>
          </div>

          {/* Compact table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Profile ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user._id || user.id} className="hover:bg-gray-50">
                      <td
                        className={`px-6 py-3 ${
                          user.profileId ? "cursor-pointer" : ""
                        }`}
                        onClick={() =>
                          user.profileId && onViewProfile?.(user.profileId)
                        }
                      >
                        <div className="flex items-center space-x-3">
                          {user.avatar || user.picture ? (
                            <img
                              src={user.avatar || user.picture}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center"
                            style={{
                              display:
                                user.avatar || user.picture ? "none" : "flex",
                            }}
                          >
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.role === "admin" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-3 ${
                          user.profileId ? "cursor-pointer" : ""
                        }`}
                        onClick={() =>
                          user.profileId && onViewProfile?.(user.profileId)
                        }
                      >
                        <div className="text-sm text-gray-900 break-words min-w-[200px]">
                          {user.email}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-3 ${
                          user.profileId ? "cursor-pointer" : ""
                        }`}
                        onClick={() =>
                          user.profileId && onViewProfile?.(user.profileId)
                        }
                      >
                        <div className="text-sm text-gray-900 font-mono whitespace-nowrap">
                          {user.profileId || (
                            <span className="text-gray-400">No profile</span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-3 ${
                          user.profileId ? "cursor-pointer" : ""
                        }`}
                        onClick={() =>
                          user.profileId && onViewProfile?.(user.profileId)
                        }
                      >
                        <div className="text-sm text-gray-900 whitespace-nowrap">
                          <span className="font-semibold text-blue-600">
                            {user.credits || 0}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-3 ${
                          user.profileId ? "cursor-pointer" : ""
                        }`}
                        onClick={() =>
                          user.profileId && onViewProfile?.(user.profileId)
                        }
                      >
                        <div className="text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleRestrictUser(user._id, e)}
                            disabled={restricting === user._id}
                            className="inline-flex items-center px-2 py-1 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-yellow-500 transition-colors disabled:opacity-50"
                            title="Restrict user"
                          >
                            <User className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => handleBanUser(user._id, e)}
                            disabled={banning === user._id}
                            className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 transition-colors disabled:opacity-50"
                            title="Ban user"
                          >
                            <User className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteUser(user._id, e)}
                            disabled={deleting === user._id}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500 transition-colors disabled:opacity-50"
                            title="Delete user permanently"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalUsers > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalUsers / itemsPerPage)}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {[...Array(Math.ceil(totalUsers / itemsPerPage))].map(
                  (_, index) => {
                    const pageNum = index + 1;
                    const isNearCurrent = Math.abs(pageNum - currentPage) <= 2;
                    const isFirstOrLast =
                      pageNum === 1 ||
                      pageNum === Math.ceil(totalUsers / itemsPerPage);

                    if (isNearCurrent || isFirstOrLast) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 3 ||
                      pageNum === currentPage + 3
                    ) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}

                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(totalUsers / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(totalUsers / itemsPerPage)
                  }
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-600 text-lg">No users have registered yet.</p>
        </div>
      )}
    </div>
  );
}
