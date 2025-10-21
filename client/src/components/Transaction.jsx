import { useEffect, useState } from "react";
import profileService from "../services/profileService";

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Type</th>
            <th className="py-2 px-4 border">Amount</th>
            <th className="py-2 px-4 border">Description</th>
            <th className="py-2 px-4 border">Date</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(transactions) && transactions.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-4">
                No transactions found.
              </td>
            </tr>
          ) : (
            (Array.isArray(transactions) ? transactions : []).map((tx) => {
              let displayType = tx.type.replace("_", " ");
              let displayDescription = tx.description;
              // Credits Purchased
              if (
                tx.type === "credit_addition" ||
                tx.type === "credit_purchase"
              ) {
                displayType = "Credits Purchased";
                displayDescription =
                  "Your purchase was successful. Thank you for using our professional matchmaking service.";
              }
              // Contact Unlock
              if (
                tx.type === "contact_unlock" ||
                tx.type === "credit_deduction"
              ) {
                displayType = "Contact Unlock";
                displayDescription =
                  "You have unlocked contact information for a profile.";
              }
              return (
                <tr key={tx._id}>
                  <td className="py-2 px-4 border">{displayType}</td>
                  <td className="py-2 px-4 border">{tx.amount}</td>
                  <td className="py-2 px-4 border">{displayDescription}</td>
                  <td className="py-2 px-4 border">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Transaction;
