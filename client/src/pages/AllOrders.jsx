import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import profileService from "../services/profileService";
import { SectionSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.email.endsWith("@gmail.com") && !user.alumniVerified) {
      navigate("/");
      return;
    }

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
  }, [user, refreshUser, navigate]);

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
            <SectionSpinner text="Loading orders..." />
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
            <h1 className="text-3xl font-bold mb-2">All Orders</h1>
            <p className="text-gray-100">
              View the status of your credit purchase orders
            </p>
          </div>
        </div>

        {/* Orders List - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600">
                You haven't submitted any credit purchase orders yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-800 to-black">
                  <tr>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Transaction Info
                    </th>
                    <th className="py-4 px-4 md:px-6 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order, index) => {
                    const rowBgColor =
                      index % 2 === 0 ? "bg-white" : "bg-gray-50";
                    return (
                      <tr
                        key={order._id}
                        className={`${rowBgColor} hover:bg-blue-50 transition-colors duration-150`}
                      >
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full mr-3 ${
                                order.status === "approved"
                                  ? "bg-green-500"
                                  : order.status === "pending"
                                  ? "bg-yellow-500"
                                  : order.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusText(order.status)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <div className="text-sm font-medium text-gray-900">
                            {order.credits} Credit{order.credits > 1 ? "s" : ""}{" "}
                            - ৳{order.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order #{order._id.slice(-8)}
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              <span className="font-medium">Txn ID:</span>{" "}
                              {order.transactionId}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span>{" "}
                              {order.phoneNumber}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6 whitespace-nowrap text-sm text-gray-500">
                          <div className="md:hidden">
                            <div className="font-medium">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                            {order.processedAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                Processed:{" "}
                                {new Date(
                                  order.processedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="hidden md:block">
                            <div>
                              Submitted:{" "}
                              {new Date(order.createdAt).toLocaleString()}
                            </div>
                            {order.processedAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                Processed:{" "}
                                {new Date(order.processedAt).toLocaleString()}
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
          )}
        </div>

        {/* Orders Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg border border-black p-8 text-center">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600">
                You haven't submitted any credit purchase orders yet.
              </p>
            </div>
          ) : (
            currentOrders.map((order, index) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-lg border border-black p-4 hover:shadow-xl transition-shadow duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1 min-w-0">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                        order.status === "approved"
                          ? "bg-green-500"
                          : order.status === "pending"
                          ? "bg-yellow-500"
                          : order.status === "rejected"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          Order #{order._id.slice(-8)}
                        </h3>
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()} at{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {order.processedAt && (
                          <span className="block text-xs text-gray-400 mt-1">
                            Processed:{" "}
                            {new Date(order.processedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900 flex-shrink-0 ml-3">
                    ৳{order.price}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Credits:</span>{" "}
                    {order.credits} Credit{order.credits > 1 ? "s" : ""}
                  </div>
                  <div>
                    <span className="font-medium">Txn ID:</span>{" "}
                    {order.transactionId}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {order.phoneNumber}
                  </div>
                </div>
              </div>
            ))
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
