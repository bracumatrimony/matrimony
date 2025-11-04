import { useState, useEffect } from "react";
import { CreditCard, Check, X, Calendar, Phone, Hash } from "lucide-react";
import adminService from "../../services/adminService";
import { InlineSpinner } from "../../components/LoadingSpinner";

export default function PendingTransactions({
  onViewProfile,
  showNotification,
  onTransactionUpdate,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, itemsPerPage]);

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
      setProcessing((prev) => ({
        ...prev,
        [`approve_${transactionId}`]: true,
      }));
      const result = await adminService.approveTransaction(transactionId);
      if (result.success) {
        
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
      setProcessing((prev) => ({
        ...prev,
        [`approve_${transactionId}`]: false,
      }));
    }
  };

  const handleRejectTransaction = async (transactionId) => {
    try {
      setProcessing((prev) => ({ ...prev, [`reject_${transactionId}`]: true }));
      const result = await adminService.rejectTransaction(transactionId);
      if (result.success) {
        
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
      setProcessing((prev) => ({
        ...prev,
        [`reject_${transactionId}`]: false,
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {transactions.length > 0 ? (
        <div className="p-8">
          {}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Pending Transactions
              </h2>
              <p className="text-gray-600">
                Review and process credit purchase requests
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      TRX ID
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        {}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                              <CreditCard className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {transaction.user?.name || "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500 font-mono truncate">
                                {transaction.user?.profileId || transaction._id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {}
                        <td className="px-6 py-4 text-center">
                          <div className="text-lg font-bold text-indigo-600">
                            ৳{transaction.amount}
                          </div>
                        </td>

                        {}
                        <td className="px-6 py-4 text-center">
                          <div className="text-lg font-bold text-emerald-600">
                            {transaction.credits || 0}
                          </div>
                        </td>

                        {}
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-mono text-blue-700 truncate max-w-32">
                            {transaction.phoneNumber || "N/A"}
                          </div>
                        </td>

                        {}
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs font-mono text-purple-700 truncate max-w-24">
                            {transaction.transactionId || "N/A"}
                          </div>
                        </td>

                        {}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() =>
                                handleApproveTransaction(transaction._id)
                              }
                              disabled={
                                processing[`approve_${transaction._id}`]
                              }
                              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                            >
                              {processing[`approve_${transaction._id}`] ? (
                                <InlineSpinner color="white" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleRejectTransaction(transaction._id)
                              }
                              disabled={processing[`reject_${transaction._id}`]}
                              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                            >
                              {processing[`reject_${transaction._id}`] ? (
                                <InlineSpinner color="white" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {}
          {totalTransactions > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalTransactions)} of{" "}
                {totalTransactions} transactions
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {}
                {[...Array(Math.ceil(totalTransactions / itemsPerPage))].map(
                  (_, index) => {
                    const pageNum = index + 1;
                    const isNearCurrent = Math.abs(pageNum - currentPage) <= 2;
                    const isFirstOrLast =
                      pageNum === 1 ||
                      pageNum === Math.ceil(totalTransactions / itemsPerPage);

                    if (isNearCurrent || isFirstOrLast) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-lg"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
                        <span key={pageNum} className="px-3 text-gray-400">
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
                        Math.ceil(totalTransactions / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(totalTransactions / itemsPerPage)
                  }
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 px-8">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="h-12 w-12 text-indigo-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">All Clear</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            All transaction requests have been processed. No pending approvals
            at this time.
          </p>
        </div>
      )}
    </div>
  );
}
