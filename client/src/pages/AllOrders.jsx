import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import profileService from "../services/profileService";
import { useAuth } from "../contexts/AuthContext";

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Refresh user data to ensure latest credits are shown in header
        await refreshUser();
        const res = await profileService.getUserOrders();
        setOrders(Array.isArray(res.orders) ? res.orders : []);
      } catch (err) {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [refreshUser]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-700 bg-green-100";
      case "pending":
        return "text-yellow-700 bg-yellow-100";
      case "rejected":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Orders</h1>
          <p className="text-gray-600">
            View the status of your credit purchase orders
          </p>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600">
                You haven't submitted any credit purchase orders yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <div key={order._id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusIcon(order.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {order.credits} Credit
                              {order.credits > 1 ? "s" : ""} - ৳{order.price}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Order #{order._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                          <span>
                            <span className="font-medium">Txn ID:</span>{" "}
                            {order.transactionId}
                          </span>
                          <span>
                            <span className="font-medium">Phone:</span>{" "}
                            {order.phoneNumber}
                          </span>
                          <span>
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          {order.processedAt && (
                            <span>
                              <span className="font-medium">Processed:</span>{" "}
                              {new Date(order.processedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </div>
                      {order.status === "pending" && (
                        <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                          Under review
                        </p>
                      )}
                      {order.status === "approved" && (
                        <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          Credits added
                        </p>
                      )}
                      {order.status === "rejected" && (
                        <p className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                          Rejected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {orders.length > 0 && totalPages > 1 && (
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
              Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of{" "}
              {orders.length} orders
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
}
