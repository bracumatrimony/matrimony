import { useState, useEffect } from "react";
import { CreditCard, Activity, Search, Check, X } from "lucide-react";
import adminService from "../../services/adminService";

export default function AllTransactions({ onViewProfile, showNotification }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, searchQuery]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTransactions();
      if (response.success) {
        let filteredTransactions = response.transactions || [];

        // Filter by search query if provided
        if (searchQuery) {
          filteredTransactions = filteredTransactions.filter(
            (transaction) =>
              transaction.user?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              transaction.user?.email
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              transaction.transactionId
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              transaction.status
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())
          );
        }

        setTransactions(filteredTransactions);
        setTotalTransactions(filteredTransactions.length);
      }
    } catch (error) {
      console.error("Failed to load all transactions:", error);
      showNotification?.("Failed to load transactions.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
        <div className="text-sm text-gray-600">
          {totalTransactions} transaction{totalTransactions !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user name, email, transaction ID, or status..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {totalTransactions === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Transactions Found
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "No transactions match your search criteria."
              : "No approved or rejected transactions yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              View all approved and rejected transactions
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {currentTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.status === "approved"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {getStatusIcon(transaction.status)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {transaction.user?.name || "Unknown User"}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-700">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">amount</span>
                          <span className="font-medium">
                            ৳{transaction.amount}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">credits</span>
                          <span className="font-medium">
                            {transaction.credits}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">type</span>
                          <span className="font-medium capitalize">
                            {transaction.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-xs text-gray-500 mt-1">
                        <div>Created: {formatDate(transaction.createdAt)}</div>
                        {transaction.processedAt && (
                          <div>
                            Processed: {formatDate(transaction.processedAt)}
                            {transaction.processedBy && (
                              <span> by {transaction.processedBy.name}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {transaction.transactionId && (
                        <div className="text-xs text-gray-500 mt-1">
                          Transaction ID: {transaction.transactionId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, totalTransactions)} of {totalTransactions}{" "}
                  transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
