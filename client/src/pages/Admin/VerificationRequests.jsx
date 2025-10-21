import { useState, useEffect } from "react";
import { Check, X, UserCheck, Search } from "lucide-react";
import adminService from "../../services/adminService";
import { SectionSpinner, InlineSpinner } from "../../components/LoadingSpinner";

export default function VerificationRequests({
  onActionComplete,
  showNotification,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalRequests, setTotalRequests] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset to first page when searching
    }, 800); // 800ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadVerificationRequests();
  }, [currentPage, itemsPerPage, searchQuery]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all verification requests by paginating through all pages
      let allRequests = [];
      let page = 1;
      const pageSize = 100; // Fetch in chunks to avoid large responses

      while (true) {
        const response = await adminService.getVerificationRequests(
          page,
          pageSize
        );
        if (response.success && response.requests.length > 0) {
          allRequests = allRequests.concat(response.requests);
          if (response.requests.length < pageSize) break; // Last page
          page++;
        } else {
          break;
        }
      }

      let filteredRequests = allRequests;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredRequests = filteredRequests.filter(
          (req) =>
            req.name.toLowerCase().includes(query) ||
            req.email.toLowerCase().includes(query)
        );
      }

      setTotalRequests(filteredRequests.length);

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

      setRequests(paginatedRequests);
    } catch (error) {
      console.error("Error loading verification requests:", error);
      setError("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const handleApprove = async (userId) => {
    try {
      setProcessing(userId);
      const response = await adminService.approveVerification(userId);
      if (response.success) {
        showNotification(
          "Verification request approved successfully",
          "success"
        );
        // Remove approved request from local list instead of reloading
        setRequests((prev) => prev.filter((req) => req._id !== userId));
        setTotalRequests((prev) => Math.max(0, prev - 1));
        onActionComplete();
      } else {
        showNotification(
          response.message || "Failed to approve request",
          "error"
        );
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      showNotification("Failed to approve verification request", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setProcessing(userId);
      const response = await adminService.rejectVerification(userId);
      if (response.success) {
        showNotification(
          "Verification request rejected successfully",
          "success"
        );
        // Remove rejected request from local list instead of reloading
        setRequests((prev) => prev.filter((req) => req._id !== userId));
        setTotalRequests((prev) => Math.max(0, prev - 1));
        onActionComplete();
      } else {
        showNotification(
          response.message || "Failed to reject request",
          "error"
        );
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
      showNotification("Failed to reject verification request", "error");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadVerificationRequests}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Alumni Verification Requests
            </h1>
            <p className="text-gray-600 mt-2">
              Review and approve alumni verification requests from users
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {totalRequests > 0 || searchInput ? (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
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
                <span className="text-sm text-gray-600">requests per page</span>
              </div>
            </div>

            {/* Table */}
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
                        Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending Review
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm text-gray-900 break-words min-w-[200px]">
                            {request.email}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(request.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(request._id)}
                              disabled={processing === request._id}
                              className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              title="Approve verification"
                            >
                              {processing === request._id ? (
                                <InlineSpinner />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              disabled={processing === request._id}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Reject verification"
                            >
                              {processing === request._id ? (
                                <InlineSpinner />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
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
            {totalRequests > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of{" "}
                  {Math.ceil(totalRequests / itemsPerPage)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          Math.ceil(totalRequests / itemsPerPage),
                          currentPage + 1
                        )
                      )
                    }
                    disabled={
                      currentPage === Math.ceil(totalRequests / itemsPerPage)
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending requests
            </h3>
            <p className="text-gray-600">
              All verification requests have been processed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
