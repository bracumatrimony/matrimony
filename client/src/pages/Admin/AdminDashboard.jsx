import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Check,
  X,
  Eye,
  Menu,
  Clock,
  FileText,
  UserCheck,
  Shield,
  Mail,
  Calendar,
  Flag,
  Heart,
  Star,
  Activity,
  User,
} from "lucide-react";
import adminService from "../../services/adminService";
import { SectionSpinner, InlineSpinner } from "../../components/LoadingSpinner";
import PendingBiodata from "./PendingBiodata";
import AllUsers from "./AllUsers";
import AllBiodata from "./AllBiodata";
import Reports from "./Reports";
import VerificationRequests from "./VerificationRequests";
import "../../styles/admin.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [stats, setStats] = useState({
    totalProfiles: 0,
    approvedProfiles: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    activeUsers: 0,
    verificationRequests: 0,
    pendingTransactions: 0,
  });
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load reports when reports tab becomes active
  useEffect(() => {
    if (activeTab === "reports" && !reportsLoaded) {
      // Reports component will handle loading
      setReportsLoaded(true);
    }
  }, [activeTab, reportsLoaded]);

  // Load transactions when transactions tab becomes active
  useEffect(() => {
    if (activeTab === "transactions" && !transactionsLoaded) {
      loadPendingTransactions();
    }
  }, [activeTab, transactionsLoaded]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard stats (includes verification requests count)
      const dashboardData = await adminService.getDashboardStats();
      if (dashboardData.success) {
        setStats({
          totalProfiles: dashboardData.stats.totalProfiles,
          approvedProfiles: dashboardData.stats.approvedProfiles,
          pendingApprovals: dashboardData.stats.pendingApprovals,
          totalRevenue: dashboardData.stats.totalRevenue,
          activeUsers: dashboardData.stats.activeUsers,
          verificationRequests: dashboardData.stats.verificationRequests,
          pendingTransactions: dashboardData.stats.pendingTransactions || 0,
        });
        setPendingProfiles(dashboardData.recentPending || []);
        setReports(dashboardData.recentReports || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTransactions = async () => {
    try {
      const transactionsData = await adminService.getPendingTransactions();
      if (transactionsData.success) {
        setPendingTransactions(transactionsData.transactions);
        setTransactionsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load pending transactions:", error);
      showNotification?.("Failed to load pending transactions.", "error");
    }
  };

  // Local stat update functions
  const updatePendingApprovals = (change) => {
    setStats((prev) => ({
      ...prev,
      pendingApprovals: Math.max(0, prev.pendingApprovals + change),
      approvedProfiles:
        change > 0
          ? prev.approvedProfiles
          : prev.approvedProfiles + Math.abs(change),
    }));
  };

  const updateVerificationRequests = (change) => {
    setStats((prev) => ({
      ...prev,
      verificationRequests: Math.max(0, prev.verificationRequests + change),
    }));
  };

  const updateReports = (change) => {
    setStats((prev) => ({
      ...prev,
      totalReports: Math.max(0, (prev.totalReports || 0) + change),
    }));
  };

  const updatePendingTransactions = (change) => {
    setStats((prev) => ({
      ...prev,
      pendingTransactions: Math.max(0, prev.pendingTransactions + change),
    }));
  };

  const handleViewProfile = (profileId) => {
    // Open biodata in a new tab with admin parameter
    const url = `/profile/view/${profileId}?admin=true`;
    window.open(url, "_blank");
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApproveTransaction = async (transactionId) => {
    try {
      const result = await adminService.approveTransaction(transactionId);
      if (result.success) {
        // Remove from pending transactions list
        setPendingTransactions((prev) =>
          prev.filter((t) => t._id !== transactionId)
        );
        updatePendingTransactions(-1);
        // Refresh user data in case the admin approved their own transaction
        await refreshUser();
        showNotification("Transaction approved successfully!", "success");
      } else {
        showNotification("Failed to approve transaction", "error");
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      showNotification("Failed to approve transaction", "error");
    }
  };

  const handleRejectTransaction = async (transactionId) => {
    try {
      const result = await adminService.rejectTransaction(transactionId);
      if (result.success) {
        // Remove from pending transactions list
        setPendingTransactions((prev) =>
          prev.filter((t) => t._id !== transactionId)
        );
        updatePendingTransactions(-1);
        showNotification("Transaction rejected successfully!", "success");
      } else {
        showNotification("Failed to reject transaction", "error");
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      showNotification("Failed to reject transaction", "error");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReportPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-700 bg-gradient-to-r from-red-100 to-red-200";
      case "medium":
        return "text-amber-700 bg-gradient-to-r from-amber-100 to-amber-200";
      case "low":
        return "text-emerald-700 bg-gradient-to-r from-emerald-100 to-emerald-200";
      default:
        return "text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200";
    }
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-amber-800 bg-gradient-to-r from-amber-100 to-amber-200";
      case "under_review":
        return "text-blue-800 bg-gradient-to-r from-blue-100 to-blue-200";
      case "resolved":
        return "text-emerald-800 bg-gradient-to-r from-emerald-100 to-emerald-200";
      case "dismissed":
        return "text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200";
      default:
        return "text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex admin-dashboard">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[45] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-green-500 border border-green-600 text-white"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === "success" ? (
              <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-red-600" />
              </div>
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white p-4 text-center shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:sticky top-0 h-screen z-50 transition-transform duration-300 ${
          sidebarOpen ? "w-80" : "lg:w-20 w-80"
        } bg-white shadow-xl flex flex-col border-r border-gray-100`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center space-x-3 ${
                !sidebarOpen && "hidden lg:flex"
              }`}
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <Menu className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("overview");
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <TrendingUp
                className={`h-5 w-5 ${
                  activeTab === "overview"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <span className="font-medium lg:inline">Overview</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("pending");
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "pending"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Clock
                className={`h-5 w-5 ${
                  activeTab === "pending"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between lg:flex">
                  <span className="font-medium">Pending Biodata</span>
                  {stats.pendingApprovals > 0 && (
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full px-2 py-1 font-medium shadow-sm">
                      {stats.pendingApprovals}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("biodata");
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "biodata"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FileText
                className={`h-5 w-5 ${
                  activeTab === "biodata"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between lg:flex">
                  <span className="font-medium">All Biodata</span>
                  {stats.approvedProfiles > 0 && (
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full px-2 py-1 font-medium shadow-sm">
                      {stats.approvedProfiles}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("users");
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Users
                className={`h-5 w-5 ${
                  activeTab === "users"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between lg:flex">
                  <span className="font-medium">All Users</span>
                  {stats.activeUsers > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full px-2 py-1 font-medium shadow-sm">
                      {stats.activeUsers}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("verification");
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "verification"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <UserCheck
                className={`h-5 w-5 ${
                  activeTab === "verification"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between lg:flex">
                  <span className="font-medium">Verification Requests</span>
                  {stats.verificationRequests > 0 && (
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full px-2 py-1 font-medium shadow-sm">
                      {stats.verificationRequests}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("transactions");
                setCurrentPage(1);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "transactions"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <CreditCard
                className={`h-5 w-5 ${
                  activeTab === "transactions"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between lg:flex">
                  <span className="font-medium">Pending Transactions</span>
                  {stats.pendingTransactions > 0 && (
                    <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs rounded-full px-2 py-1 font-medium shadow-sm">
                      {stats.pendingTransactions}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "reports"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Flag
                className={`h-5 w-5 ${
                  activeTab === "reports"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between lg:flex">
                  <span className="font-medium">Report Status</span>
                  {reports.filter((r) => r.status === "pending").length > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-1 font-medium shadow-sm">
                      {reports.filter((r) => r.status === "pending").length}
                    </span>
                  )}
                </div>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-full shadow-2xl hover:shadow-xl transition-all duration-200"
        >
          <Menu className="h-6 w-6" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <SectionSpinner text="Loading dashboard..." />
          </div>
        ) : (
          <>
            {/* Content based on active tab */}
            {activeTab === "overview" && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Total Profiles
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.totalProfiles}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Pending Approvals
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.pendingApprovals}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Total Revenue
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          ৳{stats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Total Users
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.activeUsers}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        Recent Pending Profiles
                      </h2>
                      <div className="p-2 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    {pendingProfiles.slice(0, 3).map((profile) => (
                      <div
                        key={profile._id || profile.id}
                        className="border-b border-gray-100 py-4 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">
                              {profile.userId?.name ||
                                profile.fullName ||
                                profile.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {profile.userId?.email || profile.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {profile.profileId}
                            </p>
                          </div>
                          <span className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                    {pendingProfiles.length > 3 && (
                      <button
                        onClick={() => setActiveTab("pending")}
                        className="w-full mt-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 text-sm font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-lg"
                      >
                        View all {pendingProfiles.length} pending profiles →
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        Recent Reports
                      </h2>
                      <div className="p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg">
                        <Flag className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    {reports.slice(0, 3).map((report) => (
                      <div
                        key={report.id}
                        className="border-b border-gray-100 py-4 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">
                              Profile{" "}
                              {report.reportedProfile?.profileId ||
                                report.reportedProfile}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {report.reason}
                            </p>
                            <p className="text-xs text-gray-500">
                              By:{" "}
                              {report.reportedBy?.email || report.reportedBy}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${getReportStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {reports.length > 3 && (
                      <button
                        onClick={() => setActiveTab("reports")}
                        className="w-full mt-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 text-sm font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer"
                      >
                        View all {reports.length} reports →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "pending" && (
              <PendingBiodata
                onApprove={() => updatePendingApprovals(-1)}
                onReject={() => updatePendingApprovals(-1)}
                onViewProfile={handleViewProfile}
                showNotification={showNotification}
              />
            )}
            {activeTab === "biodata" && (
              <AllBiodata
                onViewProfile={handleViewProfile}
                showNotification={showNotification}
              />
            )}
            {activeTab === "users" && (
              <AllUsers
                onViewProfile={handleViewProfile}
                showNotification={showNotification}
              />
            )}
            {activeTab === "reports" && (
              <Reports
                reports={reports}
                onReportsUpdate={setReports}
                onViewProfile={handleViewProfile}
                onReportActionComplete={() => updateReports(-1)}
                showNotification={showNotification}
              />
            )}
            {activeTab === "verification" && (
              <VerificationRequests
                onActionComplete={() => updateVerificationRequests(-1)}
                showNotification={showNotification}
              />
            )}
            {activeTab === "transactions" &&
              (() => {
                const totalPages = Math.ceil(
                  pendingTransactions.length / itemsPerPage
                );
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentTransactions = pendingTransactions.slice(
                  startIndex,
                  endIndex
                );

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-bold text-gray-900">
                        Pending Transactions
                      </h1>
                      <div className="text-sm text-gray-600">
                        {pendingTransactions.length} pending transaction
                        {pendingTransactions.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {pendingTransactions.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No Pending Transactions
                        </h3>
                        <p className="text-gray-600">
                          All transactions have been processed.
                        </p>
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
                                        {transaction.user?.name ||
                                          "Unknown User"}
                                      </h3>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Pending
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-6 text-sm text-gray-700">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-500">
                                          amount
                                        </span>
                                        <span className="font-semibold text-green-600">
                                          ৳{transaction.price || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-500">
                                          credits
                                        </span>
                                        <span className="font-semibold text-blue-600">
                                          {transaction.credits || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-500">
                                          phone
                                        </span>
                                        <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                          {transaction.phoneNumber || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-500">
                                          txn ID
                                        </span>
                                        <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                          {transaction.transactionId.slice(
                                            -8
                                          ) || "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleApproveTransaction(transaction._id)
                                    }
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectTransaction(transaction._id)
                                    }
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {pendingTransactions.length > itemsPerPage && (
                          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-700">
                                Showing {startIndex + 1} to{" "}
                                {Math.min(endIndex, pendingTransactions.length)}{" "}
                                of {pendingTransactions.length} transactions
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                  }
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
                                    setCurrentPage(
                                      Math.min(totalPages, currentPage + 1)
                                    )
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
              })()}
          </>
        )}
      </div>
    </div>
  );
}
