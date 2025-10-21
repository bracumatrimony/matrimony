import { useState, useEffect } from "react";
import { User, Check, X } from "lucide-react";
import adminService from "../../services/adminService";
import { InlineSpinner } from "../../components/LoadingSpinner";
import RejectionModal from "../../components/RejectionModal";

export default function PendingBiodata({
  onApprove,
  onReject,
  onViewProfile,
  showNotification,
}) {
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalPendingProfiles, setTotalPendingProfiles] = useState(0);
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    profileId: null,
    profileName: "",
  });

  useEffect(() => {
    loadPendingProfiles();
  }, [currentPage, itemsPerPage]);

  const loadPendingProfiles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingProfiles(
        currentPage,
        itemsPerPage
      );
      if (response.success) {
        setPendingProfiles(response.profiles || []);
        setTotalPendingProfiles(response.total || 0);
      }
    } catch (error) {
      console.error("Failed to load pending profiles:", error);
      showNotification?.("Failed to load pending profiles.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`approve_${profileId}`]: true }));
      await adminService.approveProfile(profileId);

      // Remove approved profile from local list instead of reloading
      setPendingProfiles((prev) =>
        prev.filter((p) => p.profileId !== profileId)
      );
      setTotalPendingProfiles((prev) => Math.max(0, prev - 1));

      showNotification?.("Biodata approved successfully", "success");
      onApprove?.(profileId);
    } catch (error) {
      console.error("Failed to approve profile:", error);
      showNotification?.(
        "Failed to approve profile. Please try again.",
        "error"
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`approve_${profileId}`]: false,
      }));
    }
  };

  const handleReject = async (profileId) => {
    // Find the profile to get its name
    const profile = pendingProfiles.find((p) => p.profileId === profileId);
    const profileName =
      profile?.userId?.name || profile?.fullName || profile?.name || profileId;

    setRejectionModal({
      isOpen: true,
      profileId,
      profileName,
    });
  };

  const confirmRejection = async (reason) => {
    const { profileId } = rejectionModal;

    try {
      setActionLoading((prev) => ({
        ...prev,
        [`reject_${profileId}`]: true,
      }));
      await adminService.rejectProfile(profileId, reason);

      // Remove rejected profile from local list instead of reloading
      setPendingProfiles((prev) =>
        prev.filter((p) => p.profileId !== profileId)
      );
      setTotalPendingProfiles((prev) => Math.max(0, prev - 1));

      showNotification?.("Profile rejected successfully!", "success");
      onReject?.(profileId);
    } catch (error) {
      console.error("Failed to reject profile:", error);
      showNotification?.(
        "Failed to reject profile. Please try again.",
        "error"
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`reject_${profileId}`]: false,
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() =>
          setRejectionModal({ isOpen: false, profileId: null, profileName: "" })
        }
        onConfirm={confirmRejection}
        profileName={rejectionModal.profileName}
      />

      {pendingProfiles.length > 0 ? (
        <div className="space-y-4">
          {/* Items per page selector */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
              >
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">profiles per page</span>
            </div>
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalPendingProfiles)} of{" "}
              {totalPendingProfiles} profiles
            </div>
          </div>

          {/* Compact table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingProfiles.map((profile) => (
                    <tr
                      key={profile._id || profile.id}
                      onClick={() => onViewProfile?.(profile.profileId)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {profile.userId?.name ||
                                  profile.fullName ||
                                  profile.name}
                              </span>
                              {profile.editCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Edited
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              ID: {profile.profileId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm text-gray-900">
                          <span className="capitalize">{profile.gender}</span>
                          {profile.age && <span>, {profile.age}y</span>}
                          {profile.profession && (
                            <span> • {profile.profession}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {profile.userId?.email || profile.email}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm text-gray-900">
                          {formatDate(
                            profile.lastEditDate ||
                              profile.createdAt ||
                              profile.submittedAt
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {profile.editCount > 0 ? "Last edited" : "Created"}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(profile.profileId);
                            }}
                            disabled={
                              actionLoading[`approve_${profile.profileId}`]
                            }
                            className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {actionLoading[`approve_${profile.profileId}`] ? (
                              <InlineSpinner color="emerald" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(profile.profileId);
                            }}
                            disabled={
                              actionLoading[`reject_${profile.profileId}`]
                            }
                            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {actionLoading[`reject_${profile.profileId}`] ? (
                              <InlineSpinner color="rose" />
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

          {/* Pagination */}
          {totalPendingProfiles > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Page {currentPage} of{" "}
                {Math.ceil(totalPendingProfiles / itemsPerPage)}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {[...Array(Math.ceil(totalPendingProfiles / itemsPerPage))].map(
                  (_, index) => {
                    const pageNum = index + 1;
                    const isNearCurrent = Math.abs(pageNum - currentPage) <= 2;
                    const isFirstOrLast =
                      pageNum === 1 ||
                      pageNum ===
                        Math.ceil(totalPendingProfiles / itemsPerPage);

                    if (isNearCurrent || isFirstOrLast) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                        <span key={pageNum} className="px-2 text-gray-400">
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
                        Math.ceil(totalPendingProfiles / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(totalPendingProfiles / itemsPerPage)
                  }
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No pending approvals
          </h3>
          <p className="text-gray-600 text-lg">
            All profile submissions have been reviewed.
          </p>
        </div>
      )}
    </div>
  );
}
