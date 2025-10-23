import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";   // ⬅️ install: npm install sweetalert2
import { purchaseMembership, fetchMemberships } from "../contexts/authApi";

export default function MembershipPurchase() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetchMemberships();
        if (res.status) setPlans(res.memberships);
      } catch (err) {
        console.error("Error loading plans", err);
      }
    };
    loadPlans();
  }, []);

  const handleSubmit = async () => {
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
        Swal.fire({
          title: "Success 🎉",
          text: "Membership purchased successfully!",
          icon: "success",
          confirmButtonColor: "#2563eb",
        }).then(() => {
          // reset form after success
          setName("");
          setPhone("");
          setEmail("");
          setSelectedPlan("");
          setPaymentMethod("cash");
        });
      } else {
        Swal.fire("Error", res.data.message || "Failed to purchase.", "error");
      }
    } catch (err) {
      Swal.fire("Failed", err.message || "Server Error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Purchase Membership
      </h2>

      <label className="block mb-4">
        <span className="text-sm text-gray-600">Customer Name</span>
        <input
          type="text"
          className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter full name"
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-600">Phone</span>
        <input
          type="tel"
          className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit number"
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-600">Email</span>
        <input
          type="email"
          className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@domain.com"
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-600">Membership Plan</span>
        <select
          className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
        >
          <option value="">-- Select Plan --</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} – ₹{p.price} / {p.duration} days
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-6">
        <span className="text-sm text-gray-600">Payment Method</span>
        <select
          className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
      </label>

      <button
        disabled={loading}
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Purchase"}
      </button>
    </div>
  );
}
