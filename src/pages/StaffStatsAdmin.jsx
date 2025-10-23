import React, { useState, useEffect } from "react";
import { BarChart3, RefreshCcw } from "lucide-react";
import {
  fetchStaffStats,      // must accept branchId
  fetchBranchesadmin,
} from "../contexts/authApi";

const StaffStatsAdmin = () => {
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [staffStats, setStaffStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load branches once
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await fetchBranchesadmin(); // should return an array
        setBranches(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load branches", err);
        setBranches([]);
      }
    };
    loadBranches();
  }, []);

  // ✅ Fetch stats when branch changes
  const fetchStats = async (selectedBranch = branchId) => {
    setLoading(true);
    try {
      // pass branchId to API so it filters correctly
      const data = await fetchStaffStats(selectedBranch);
      setStaffStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load staff stats", err);
      setStaffStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(branchId);
  }, [branchId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <BarChart3 className="mr-2" /> Therapist Availability
      </h1>

      <div className="flex items-center gap-4 mb-4">
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button
          onClick={() => fetchStats(branchId)}
          className="px-3 py-1 bg-indigo-500 text-white rounded flex items-center"
        >
          <RefreshCcw size={16} className="mr-1" /> Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Branch</th>
              {/* <th className="p-2 border">Status</th>
              <th className="p-2 border">Next Free (min)</th> */}
              <th className="p-2 border">Appts Today</th>
              <th className="p-2 border">Revenue Today</th>
            </tr>
          </thead>
          <tbody>
            {staffStats.map((s) => (
              <tr key={s.id}>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.branch_name}</td>
                {/* <td className="border p-2">
                  <span className={s.status === "busy" ? "text-red-600" : "text-green-600"}>
                    {s.status}
                  </span>
                </td>
                <td className="border p-2">{s.next_free_in ?? "—"}</td> */}
                <td className="border p-2">{s.appointments_today}</td>
                 <td className="border p-2">₹{Number(s.revenue_today).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StaffStatsAdmin;
