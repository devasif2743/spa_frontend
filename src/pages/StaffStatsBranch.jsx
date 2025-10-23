import React, { useState, useEffect } from "react";
import { BarChart3, RefreshCcw } from "lucide-react";
import { fetchStaffStats } from "../contexts/authApi";   // must accept branchId
import { useAuth } from "../contexts/AuthContext";

const StaffStatsBranch = () => {
  const { user } = useAuth();          // user.branchId must be set
  const branchId = user.branchId;      // fixed branch
  const [staffStats, setStaffStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await fetchStaffStats(branchId); // your helper: GET /staff-stats?branch_id=#
      setStaffStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch staff stats", err);
      setStaffStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [branchId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <BarChart3 className="mr-2" /> Therapist Availability – {user.branchName}
      </h1>

      <button
        onClick={fetchStats}
        className="mb-4 px-3 py-1 bg-indigo-500 text-white rounded flex items-center"
      >
        <RefreshCcw size={16} className="mr-1" /> Refresh
      </button>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              {/* <th className="p-2 border">Status</th>
              <th className="p-2 border">Next Free (min)</th> */}
              <th className="p-2 border">Appts Today</th>
              <th className="p-2 border">Revenue Today</th>
            </tr>
          </thead>
          <tbody>
            {staffStats.map(s => (
              <tr key={s.id}>
                <td className="border p-2">{s.name}</td>
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

export default StaffStatsBranch;
