import { useState, useEffect } from "react";
import { Flag, Mail, Calendar, Eye, Shield, Check, X } from "lucide-react";
import adminService from "../../services/adminService";

export default function Reports({
  reports: initialReports,
  onReportsUpdate,
  onViewProfile,
  onReportActionComplete,
  showNotification,
}) {
  const [reports, setReports] = useState(initialReports || []);
  const [loading, setLoading] = useState(
    !initialReports || initialReports.length === 0
  );
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!initialReports || initialReports.length === 0) {
      loadReports();
    }
  }, []);

  useEffect(() => {
    if (initialReports) {
      setReports(initialReports);
      setLoading(false);
    }
  }, [initialReports]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await adminService.getReports();
      if (reportsData.success) {
        setReports(reportsData.reports);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      showNotification?.("Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTakeReportAction = async (reportId, action) => {
    const notes =
      action === "dismiss"
        ? prompt("Enter notes for dismissing this report:")
        : prompt("Enter action notes:");

    if (notes !== null) {
      try {
        setActionLoading((prev) => ({
          ...prev,
          [`report_${reportId}_${action}`]: true,
        }));
        await adminService.takeReportAction(reportId, action, notes);

        
        setReports((prevReports) => {
          const updatedReports = prevReports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status: action === "dismiss" ? "dismissed" : "resolved",
                }
              : report
          );
          onReportsUpdate?.(updatedReports);
          return updatedReports;
        });

        showNotification?.(`Report ${action} successfully!`, "success");
        onReportActionComplete?.(reportId, action);
      } catch (error) {
        console.error("Failed to take action on report:", error);
        showNotification?.(
          "Failed to process report action. Please try again.",
          "error"
        );
      } finally {
        setActionLoading((prev) => ({
          ...prev,
          [`report_${reportId}_${action}`]: false,
        }));
      }
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Reports</h2>
          <p className="text-gray-600 mt-1">{reports.length} total reports</p>
        </div>
        <div className="bg-gradient-to-r from-red-100 to-red-200 px-4 py-2 rounded-full">
          <span className="text-red-800 font-bold text-lg">
            {reports.length}
          </span>
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      <Flag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Report #{report.id}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-medium ${getReportStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-medium ${getReportPriorityColor(
                            report.priority
                          )}`}
                        >
                          {report.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-900 font-bold mb-1">
                          Reported Profile:
                        </p>
                        <p className="text-gray-700">
                          {report.reportedProfile?.fullName} (
                          {report.reportedProfile?.profileId})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold mb-1">
                          Reported By:
                        </p>
                        <p className="text-gray-700 flex items-center">
                          <Mail className="inline h-4 w-4 mr-1" />
                          {report.reportedBy?.email}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Profile: {report.reportedBy?.profileId}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-900 font-bold mb-1">Reason:</p>
                        <p className="text-gray-700">{report.reason}</p>
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold mb-1">
                          Description:
                        </p>
                        <p className="text-gray-700">{report.description}</p>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        <span className="text-sm">
                          Reported: {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {report.status === "pending" && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() =>
                      onViewProfile?.(report.reportedProfile?.profileId)
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Biodata</span>
                  </button>
                  <button
                    onClick={() =>
                      handleTakeReportAction(report.id, "investigate")
                    }
                    disabled={actionLoading[`report_${report.id}_investigate`]}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 hover:from-amber-100 hover:to-amber-200 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Investigate</span>
                  </button>
                  <button
                    onClick={() => handleTakeReportAction(report.id, "resolve")}
                    disabled={actionLoading[`report_${report.id}_resolve`]}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-4 w-4" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleTakeReportAction(report.id, "dismiss")}
                    disabled={actionLoading[`report_${report.id}_dismiss`]}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                    <span>Dismiss</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No reports</h3>
          <p className="text-gray-600 text-lg">
            No user reports have been submitted.
          </p>
        </div>
      )}
    </div>
  );
}
