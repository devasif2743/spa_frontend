import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  purchaseMembership,
  fetchMemberships,
  membershiphistoryAll,
  membershiphistorydetails,
} from "../contexts/authApi";

export default function MembershipManagement() {
  const [plans, setPlans] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [filter, setFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Transaction details
  const [transactions, setTransactions] = useState({});
  const [loadingTx, setLoadingTx] = useState(null);

  useEffect(() => {
    loadPlans();
    loadMemberships();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await fetchMemberships();
      if (res.status) setPlans(res.memberships);
    } catch (err) {
      console.error("Plans load error", err);
    }
  };

  const loadMemberships = async () => {
    try {
      const res = await membershiphistoryAll();
      if (res.status) setMemberships(res.memberships || []);
    } catch (err) {
      console.error("Memberships load error", err);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setSelectedPlan("");
    setPaymentMethod("cash");
  };

  const handleAddPurchase = async () => {
    if (!name || !phone || !email || !selectedPlan) {
      Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name,
        phone,
        email,
        plan_id: Number(selectedPlan),
        payment_method: paymentMethod,
      };
      const res = await purchaseMembership(payload);
      if (res.data.status) {
        Swal.fire("Success 🎉", "Membership purchased successfully!", "success");
        resetForm();
        setDrawerOpen(false);
        loadMemberships();
      } else {
        Swal.fire("Error", res.data.message || "Failed to purchase.", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (membershipId) => {
    setLoadingTx(membershipId);
    try {
      const res = await membershiphistorydetails(membershipId);
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

  // Filtered and paginated memberships
  const filtered = memberships.filter((m) =>
    [m.customer_name, m.customer_phone, m.plan_name]
      .join(" ")
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Memberships</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Membership
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, phone or plan"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-sm border rounded-lg p-2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Plan</th>
              <th className="px-4 py-2 border">Customer</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Total Services</th>
              <th className="px-4 py-2 border">Used</th>
              <th className="px-4 py-2 border">Remaining</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Payment</th>
              <th className="px-4 py-2 border">Expiry</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((m) => (
              <React.Fragment key={m.id}>
                <tr className="hover:bg-gray-50 text-center">
                  <td className="px-2 py-1 border">{m.plan_name}</td>
                  <td className="px-2 py-1 border">{m.customer_name}</td>
                  <td className="px-2 py-1 border">{m.customer_phone}</td>
                  <td className="px-2 py-1 border">{m.service_count}</td>
                  <td className="px-2 py-1 border">{m.used_services}</td>
                  <td className="px-2 py-1 border">{m.remaining_services}</td>
                  <td className="px-2 py-1 border">
                    ₹{parseFloat(m.amount).toFixed(2)}
                  </td>
                  <td className="px-2 py-1 border">{m.payment_method}</td>
                  <td className="px-2 py-1 border">
                    {m.expiration
                      ? new Date(m.expiration).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-2 py-1 border">
                    <button
                      onClick={() => fetchTransactions(m.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>

                {loadingTx === m.id && (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-2 border text-sm text-gray-600 text-center"
                    >
                      Loading transactions…
                    </td>
                  </tr>
                )}

                {transactions[m.id] && transactions[m.id].length > 0 && (
                  <tr>
                    <td colSpan="10" className="p-0">
                      <table className="w-full text-sm border-t">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 border">Customer</th>
                            <th className="p-2 border">Service</th>
                            <th className="p-2 border">Start</th>
                            <th className="p-2 border">End</th>
                            <th className="p-2 border">Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions[m.id].map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-gray-50 text-center"
                            >
                              <td className="p-2 border">{t.customer_name}</td>
                              <td className="p-2 border">{t.service_name}</td>
                              <td className="p-2 border">
                                {new Date(t.start_time).toLocaleString()}
                              </td>
                              <td className="p-2 border">
                                {new Date(t.end_time).toLocaleString()}
                              </td>
                              <td className="p-2 border">{t.staff_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {currentRecords.length === 0 && (
              <tr>
                <td
                  colSpan="10"
                  className="p-4 text-center text-gray-500 border"
                >
                  No memberships found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <div className="space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Right Drawer */}
      <div
        className={`fixed inset-0 z-50 flex transition ${
          drawerOpen ? "visible" : "invisible"
        }`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-40 transition-opacity ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        ></div>

        {/* Drawer Panel */}
        <div
          className={`ml-auto w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4">Add Membership Purchase</h2>

          <label className="block mb-3">
            <span className="text-sm">Customer Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm">Membership Plan</span>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="">-- Select Plan --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} – ₹{p.price}
                </option>
              ))}
            </select>
          </label>

          <label className="block mb-5">
            <span className="text-sm">Payment Method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </label>

          <button
            disabled={loading}
            onClick={handleAddPurchase}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Save Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
