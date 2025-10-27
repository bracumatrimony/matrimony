import { useState, useEffect } from "react";
import { CreditCard, Check, X, Eye, Search } from "lucide-react";
import adminService from "../../services/adminService";

export default function PendingTransactions({
  onViewProfile,
  showNotification,
  onTransactionUpdate,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [currentPage]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingTransactions();
      if (response.success) {
        setTransactions(response.transactions || []);
        setTotalTransactions(response.transactions?.length || 0);
      }
    } catch (error) {
      console.error("Failed to load pending transactions:", error);
      showNotification?.("Failed to load pending transactions.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (transactionId) => {
    try {
      setProcessing(transactionId);
      const result = await adminService.approveTransaction(transactionId);
      if (result.success) {
        // Remove from list
        setTransactions((prev) => prev.filter((t) => t._id !== transactionId));
        setTotalTransactions((prev) => prev - 1);
        showNotification("Transaction approved successfully!", "success");
        onTransactionUpdate?.();
      } else {
        showNotification("Failed to approve transaction", "error");
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      showNotification("Failed to approve transaction", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectTransaction = async (transactionId) => {
    try {
      setProcessing(transactionId);
      const result = await adminService.rejectTransaction(transactionId);
      if (result.success) {
        // Remove from list
        setTransactions((prev) => prev.filter((t) => t._id !== transactionId));
        setTotalTransactions((prev) => prev - 1);
        showNotification("Transaction rejected successfully!", "success");
        onTransactionUpdate?.();
      } else {
        showNotification("Failed to reject transaction", "error");
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      showNotification("Failed to reject transaction", "error");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
        <h1 className="text-3xl font-bold text-gray-900">
          Pending Transactions
        </h1>
        <div className="text-sm text-gray-600">
          {totalTransactions} pending transaction
          {totalTransactions !== 1 ? "s" : ""}
        </div>
      </div>

      {totalTransactions === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Pending Transactions
          </h3>
          <p className="text-gray-600">All transactions have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction Queue
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and process pending credit purchase requests
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
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {transaction.user?.name || "Unknown User"}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
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
                      </div>
                      {transaction.transactionId && (
                        <div className="text-xs text-gray-500 mt-1">
                          Transaction ID: {transaction.transactionId}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveTransaction(transaction._id)}
                      disabled={processing === transaction._id}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === transaction._id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectTransaction(transaction._id)}
                      disabled={processing === transaction._id}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === transaction._id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-transparent mr-1"></div>
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      Reject
                    </button>
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
