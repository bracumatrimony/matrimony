import { useState, useEffect } from "react";
import {
  CreditCard,
  Activity,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import adminService from "../../services/adminService";

export default function AllTransactions({ onViewProfile, showNotification }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); 
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

        
        filteredTransactions = filteredTransactions.filter(
          (transaction) => transaction.type !== "credit_addition"
        );

        
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
              transaction.phoneNumber
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

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user name, email, transaction ID, phone number, or status..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {totalTransactions === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
            <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "No transactions match your search criteria."
                : "No approved or rejected transactions yet."}
            </p>
          </div>
        ) : (
          <>
            {}
            <div className="hidden md:block bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-800 to-black">
                    <tr>
                      <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        User & Transaction
                      </th>
                      <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider min-w-[180px]">
                        Details
                      </th>
                      <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTransactions.map((transaction, index) => {
                      const rowBgColor =
                        index % 2 === 0 ? "bg-white" : "bg-gray-50";
                      return (
                        <tr
                          key={transaction._id}
                          className={`${rowBgColor} hover:bg-blue-50 transition-colors duration-150`}
                        >
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full mr-3 ${
                                  transaction.status === "approved"
                                    ? "bg-green-500"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-500"
                                    : transaction.status === "rejected"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                                }`}
                              ></div>
                              <div
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 md:px-6">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.user?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.transactionId ||
                                `TXN-${transaction._id.slice(-8)}`}
                            </div>
                          </td>
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transaction.phoneNumber ||
                                transaction.user?.phone ||
                                "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-4 md:px-6 min-w-[180px]">
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                <span className="font-medium">Amount:</span> ৳
                                {transaction.amount}
                              </div>
                              <div>
                                <span className="font-medium">Credits:</span>{" "}
                                {transaction.credits}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap text-sm text-gray-500">
                            <div className="md:hidden">
                              <div className="font-medium">
                                {formatDate(transaction.createdAt)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(
                                  transaction.createdAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {transaction.processedAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Processed:{" "}
                                  {formatDate(transaction.processedAt)}
                                </div>
                              )}
                            </div>
                            <div className="hidden md:block">
                              <div>
                                Created:{" "}
                                {new Date(
                                  transaction.createdAt
                                ).toLocaleString()}
                              </div>
                              {transaction.processedAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Processed:{" "}
                                  {new Date(
                                    transaction.processedAt
                                  ).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {}
            <div className="md:hidden space-y-4">
              {currentTransactions.map((transaction, index) => (
                <div
                  key={transaction._id}
                  className="bg-white rounded-lg shadow-lg border border-black p-4 hover:shadow-xl transition-shadow duration-150"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                          transaction.status === "approved"
                            ? "bg-green-500"
                            : transaction.status === "pending"
                            ? "bg-yellow-500"
                            : transaction.status === "rejected"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {transaction.user?.name || "Unknown User"}
                          </h3>
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.createdAt)} at{" "}
                          {new Date(transaction.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                          {transaction.processedAt && (
                            <span className="block text-xs text-gray-400 mt-1">
                              Processed: {formatDate(transaction.processedAt)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900 flex-shrink-0 ml-3">
                      ৳{transaction.amount}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Transaction ID:</span>{" "}
                      {transaction.transactionId ||
                        `TXN-${transaction._id.slice(-8)}`}
                    </div>
                    <div>
                      <span className="font-medium">Phone Number:</span>{" "}
                      {transaction.phoneNumber ||
                        transaction.user?.phone ||
                        "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> ৳
                      {transaction.amount}
                    </div>
                    <div>
                      <span className="font-medium">Credits:</span>{" "}
                      {transaction.credits}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {}
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

                {}
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, totalTransactions)} of {totalTransactions}{" "}
                  transactions
                </div>

                {}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md font-medium transition-colors shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-rose-50 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (num) => {
                      
                      if (
                        num === 1 ||
                        num === totalPages ||
                        Math.abs(num - currentPage) <= 1
                      ) {
                        return (
                          <button
                            key={num}
                            onClick={() => setCurrentPage(num)}
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
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
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
          </>
        )}
      </div>
    </div>
  );
}
