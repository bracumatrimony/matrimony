import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  profileName = "this profile",
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    onConfirm(reason.trim());
    handleClose();
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Reject Biodata
              </h3>
              <p className="text-sm text-gray-500">{profileName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label
            htmlFor="rejection-reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            placeholder="Please provide a clear reason for rejecting this biodata..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
            rows="4"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
