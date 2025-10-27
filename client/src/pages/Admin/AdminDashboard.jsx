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
  RefreshCw,
} from "lucide-react";
import adminService from "../../services/adminService";
import { SectionSpinner, InlineSpinner } from "../../components/LoadingSpinner";
import PendingBiodata from "./PendingBiodata";
import AllUsers from "./AllUsers";
import AllBiodata from "./AllBiodata";
import Reports from "./Reports";
import VerificationRequests from "./VerificationRequests";
import PendingTransactions from "./PendingTransactions";
import AllTransactions from "./AllTransactions";
import { monetizationConfig } from "../../config/monetization";
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [monetizationStatus, setMonetizationStatus] = useState(
    monetizationConfig.isEnabled() ? "ON" : "OFF"
  );

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

  // Listen for monetization config changes
  useEffect(() => {
    const handleConfigChange = () => {
      setMonetizationStatus(monetizationConfig.isEnabled() ? "ON" : "OFF");
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
    };
  }, []);

  const refreshMonetizationConfig = async () => {
    try {
      await monetizationConfig.forceRefresh();
      // Reload dashboard data to reflect any changes
      await loadDashboardData();
      showNotification("Monetization config refreshed successfully", "success");
    } catch (error) {
      console.error("Failed to refresh monetization config:", error);
      showNotification("Failed to refresh monetization config", "error");
    }
  };

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
                setActiveTab("all-transactions");
                setCurrentPage(1);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                activeTab === "all-transactions"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Activity
                className={`h-5 w-5 ${
                  activeTab === "all-transactions"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {sidebarOpen && (
                <span className="font-medium">All Transactions</span>
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

                {/* Content based on active tab */}
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
            {activeTab === "transactions" && (
              <PendingTransactions
                onViewProfile={handleViewProfile}
                showNotification={showNotification}
                onTransactionUpdate={() => {
                  // Refresh dashboard stats when transactions are processed
                  loadDashboardData();
                }}
              />
            )}
            {activeTab === "all-transactions" && (
              <AllTransactions
                onViewProfile={handleViewProfile}
                showNotification={showNotification}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
