import { useEffect, useState } from "react";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import profileService from "../services/profileService";
import { SectionSpinner } from "./LoadingSpinner";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await profileService.getTransactionHistory();
        setTransactions(
          Array.isArray(res.transactions) ? res.transactions : []
        );
      } catch (err) {
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-64">
            <SectionSpinner text="Loading transactions..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-gray-800 to-black rounded-lg p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-gray-100">
              View your credit transactions and purchase history
            </p>
          </div>
        </div>

        {/* Transaction Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-800 to-black">
                <tr>
                  <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Type
                  </th>
                  <th className="py-4 px-4 md:px-6 text-center text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(currentTransactions) &&
                currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          No transactions found
                        </p>
                        <p className="text-sm text-gray-600">
                          Your transaction history will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(currentTransactions)
                    ? currentTransactions
                    : []
                  ).map((tx, index) => {
                    // Skip purchase transactions (only show actual credit additions/deductions)
                    if (tx.type === "purchase") {
                      return null;
                    }

                    let displayType = tx.type.replace("_", " ");
                    let displayDescription = tx.description;
                    let rowBgColor =
                      index % 2 === 0 ? "bg-white" : "bg-gray-50";
                    let amountColor = "text-gray-900";

                    // Credits Purchased
                    if (
                      tx.type === "credit_addition" ||
                      tx.type === "credit_purchase"
                    ) {
                      displayType = "Credits Purchased";
                      displayDescription =
                        "Your purchase was successful. Thank you for using our service.";
                      amountColor = "text-green-600";
                    }
                    // Contact Unlock
                    if (
                      tx.type === "contact_unlock" ||
                      tx.type === "credit_deduction"
                    ) {
                      displayType = "Contact Unlock";
                      displayDescription =
                        tx.description ||
                        "Contact information unlocked for a biodata profile.";
                      // For free unlocks (credits = 0), show as neutral, for paid unlocks show as deduction
                      amountColor =
                        tx.credits === 0 ? "text-blue-600" : "text-red-600";
                    }
                    return (
                      <tr
                        key={tx._id}
                        className={`${rowBgColor} hover:bg-blue-50 transition-colors duration-150`}
                      >
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full mr-3 ${
                                tx.type.includes("credit_addition") ||
                                tx.type.includes("purchase")
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            {displayType}
                          </div>
                        </td>
                        <td
                          className={`py-4 px-4 md:px-6 whitespace-nowrap text-sm text-center font-bold ${amountColor}`}
                        >
                          {tx.type === "contact_unlock" &&
                          (tx.credits === 0 || tx.credits === undefined)
                            ? "Free"
                            : tx.credits || tx.amount}
                        </td>
                        <td className="py-4 px-4 md:px-6 text-sm text-gray-600 max-w-xs md:max-w-none">
                          <div className="truncate md:whitespace-normal md:break-words">
                            {displayDescription}
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap text-sm text-gray-500">
                          <div className="md:hidden">
                            <div className="font-medium">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(tx.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <div className="hidden md:block">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {Array.isArray(currentTransactions) &&
          currentTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg border border-black p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No transactions found
              </p>
              <p className="text-sm text-gray-600">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            (Array.isArray(currentTransactions) ? currentTransactions : [])
              .filter((tx) => tx.type !== "purchase")
              .map((tx, index) => {
                let displayType = tx.type.replace("_", " ");
                let displayDescription = tx.description;
                let amountColor = "text-gray-900";

                // Credits Purchased
                if (
                  tx.type === "credit_addition" ||
                  tx.type === "credit_purchase"
                ) {
                  displayType = "Credits Purchased";
                  displayDescription =
                    "Your purchase was successful. Thank you for using our service.";
                  amountColor = "text-green-600";
                }
                // Contact Unlock
                if (
                  tx.type === "contact_unlock" ||
                  tx.type === "credit_deduction"
                ) {
                  displayType = "Contact Unlock";
                  displayDescription =
                    tx.description ||
                    "Contact information unlocked for a biodata profile.";
                  amountColor =
                    tx.credits === 0 ? "text-blue-600" : "text-red-600";
                }

                return (
                  <div
                    key={tx._id}
                    className="bg-white rounded-lg shadow-lg border border-black p-4 hover:shadow-xl transition-shadow duration-150"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                            tx.type.includes("credit_addition") ||
                            tx.type.includes("purchase")
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {displayType}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(tx.createdAt).toLocaleDateString()} at{" "}
                            {new Date(tx.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold ${amountColor} flex-shrink-0 ml-3`}
                      >
                        {tx.type === "contact_unlock" &&
                        (tx.credits === 0 || tx.credits === undefined)
                          ? "Free"
                          : tx.credits || tx.amount}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {displayDescription}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Pagination Controls */}
        {transactions.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Pagination info */}
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)}{" "}
              of {transactions.length} transactions
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-50 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (num) => {
                  // Show first, last, current, and neighbors; ellipsis for gaps
                  if (
                    num === 1 ||
                    num === totalPages ||
                    Math.abs(num - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={num}
                        onClick={() => handlePageChange(num)}
                        className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                          num === currentPage
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-rose-50 hover:border-rose-400 cursor-pointer"
                        }`}
                        disabled={num === currentPage}
                      >
                        {num}
                      </button>
                    );
                  } else if (
                    num === currentPage - 2 ||
                    num === currentPage + 2
                  ) {
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-50 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transaction;
