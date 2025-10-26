import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import profileService from "../services/profileService";
import { SectionSpinner } from "./LoadingSpinner";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
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
                {Array.isArray(transactions) && transactions.length === 0 ? (
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
                  (Array.isArray(transactions) ? transactions : []).map(
                    (tx, index) => {
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
                        // For free unlocks (amount = 0), show as neutral, for paid unlocks show as deduction
                        amountColor =
                          tx.amount === 0 ? "text-blue-600" : "text-red-600";
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
                            {tx.type === "contact_unlock" && tx.amount === 0
                              ? "Free"
                              : tx.amount}
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
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transaction;
