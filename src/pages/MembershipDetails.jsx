import React, { useState } from "react";
import { membershiphistory, membershiphistorydetails } from "../contexts/authApi";

export default function MembershipDetails() {
  const [phone, setPhone] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState({});
  const [loadingTx, setLoadingTx] = useState(null);

  const fetchMemberships = async () => {
    if (!phone) return;
    setLoading(true);
    setError("");
    try {
      const res = await membershiphistory(phone);
      setMemberships(res.memberships || []);
    } catch {
      setError("Failed to fetch memberships");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (membershipId) => {
    setLoadingTx(membershipId);
    try {
      const res = await membershiphistorydetails(membershipId);
      // API returns {status:true, membership_id:'2', transactions:[...] }
      setTransactions((prev) => ({
        ...prev,
        [membershipId]: res.transactions || [],
      }));
    } catch {
      alert("Failed to fetch transactions");
    } finally {
      setLoadingTx(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Membership Details</h1>

      {/* Phone Search */}
      <div className="flex items-center mb-6 space-x-2">
        <input
          type="text"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border rounded p-2 flex-1"
        />
        <button
          onClick={fetchMemberships}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && memberships.length === 0 && <p>No memberships found.</p>}

      {memberships.length > 0 && (
        <table className="min-w-full bg-white border border-gray-200 rounded shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Plan</th>
              <th className="p-2 border">Member</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Total Free</th>
              <th className="p-2 border">Used</th>
              <th className="p-2 border">Remaining</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Payment</th>
              <th className="p-2 border">Expiration</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <React.Fragment key={m.id}>
                <tr className="hover:bg-gray-50">
                  <td className="p-2 border">{m.plan_name}</td>
                  <td className="p-2 border">{m.customer_name}</td>
                  <td className="p-2 border">{m.customer_phone}</td>
                  <td className="p-2 border">{m.service_count}</td>
                  <td className="p-2 border">{m.used_services}</td>
                  <td className="p-2 border">{m.remaining_services}</td>
                  <td className="p-2 border">₹{parseFloat(m.amount).toFixed(2)}</td>
                  <td className="p-2 border">{m.payment_method}</td>
                  <td className="p-2 border">
                    {new Date(m.expiration).toLocaleDateString()}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => fetchTransactions(m.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>

                {/* Transaction Rows */}
                {loadingTx === m.id && (
                  <tr>
                    <td colSpan="10" className="p-2 border text-sm text-gray-600">
                      Loading transactions…
                    </td>
                  </tr>
                )}

                {transactions[m.id] &&
                  transactions[m.id].length > 0 && (
                    <tr>
                      <td colSpan="10" className="p-0">
                        <table className="w-full text-sm border-t">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 border">Customer Name</th>
                              <th className="p-2 border">Service</th>
                              <th className="p-2 border">Start Time</th>
                              <th className="p-2 border">End Time</th>
                              <th className="p-2 border">Staff Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions[m.id].map((t) => (
                              <tr key={t.id} className="hover:bg-gray-50">
                                <td className="p-2 border">{t.customer_name}</td>
                                <td className="p-2 border">{t.service_name}</td>
                                <td className="p-2 border">
                                  {new Date(t.start_time).toLocaleString()}
                                </td>
                                <td className="p-2 border">
                                  {t.end_time
                                    ? new Date(t.end_time).toLocaleString()
                                    : "-"}
                                </td>
                                <td className="p-2 border">
                                 
                                 {t.staff_name}
                                  {/* ₹{parseFloat(t.item_total).toFixed(2)} */}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}

                {transactions[m.id] &&
                  transactions[m.id].length === 0 && (
                    <tr>
                      <td
                        colSpan="10"
                        className="p-2 border text-center text-gray-600 text-sm"
                      >
                        No services found for this membership.
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
