import React, { useEffect, useState } from "react";
import { RefreshCcw, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  fetchAppointmentsFull,   // GET /appointments-full?branch_id=
  fetchBranchesadmin       // GET list of {id,name}
} from "../contexts/authApi";

/**
 * props:
 *   branchId (string|number) – optional.
 *     - If omitted → admin mode with branch selector.
 *     - If provided → branch mode locked to that branch.
 */
const AppointmentsFull = ({ branchId: fixedBranchId }) => {
  const [branchId, setBranchId] = useState(fixedBranchId || "all");
  const [branches, setBranches] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load branch list (admin only)
  useEffect(() => {
    if (!fixedBranchId) {
      (async () => {
        try {
          const b = await fetchBranchesadmin();
          setBranches(Array.isArray(b) ? b : []);
        } catch (err) {
          console.error("Failed to load branches", err);
        }
      })();
    }
  }, [fixedBranchId]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await fetchAppointmentsFull(branchId);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, [branchId]);

  /** -------- Export to Excel -------- */
  const exportToExcel = () => {
    if (!appointments.length) return;

    // Convert appointment objects to plain rows for Excel
    const rows = appointments.map(a => ({
      ID: a.id,
      Customer: a.customer_name,
      Phone: a.customer_phone,
      Staff: a.staff_name,
      Payment: a.payment_method,
      Items: (a.cart || [])
        .map(it => `${it.name} x ${it.quantity} (${it.line_total})`)
        .join(", "),
      Item_Total: a.item_total,
      Bill_Discount: a.bill_discount,
      GST_Percent: a.gst_percent,
      GST_Amount: a.gst_amount,
      Final_Total: a.final_total,
      Billed_By: a.billed_staff_name,
      Membership: a.membership_id ? "Yes" : "No",
      Membership_Name: a.membership?.name || "N/A",
      Voucher: a.voacher || "N/A",
      Start_Time: a.start_time,
      End_Time: a.end_time,
      Branch_ID: a.branch_id,
      Created_At: a.created_at
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appointments");

    XLSX.writeFile(wb, `appointments_${branchId || "all"}_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">
        Appointment Details
      </h1>

      {/* Branch selector + buttons */}
      <div className="flex items-center gap-4 mb-4">
        {!fixedBranchId && (
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={loadAppointments}
          className="px-3 py-1 bg-indigo-600 text-white rounded flex items-center"
        >
          <RefreshCcw size={16} className="mr-1" /> Refresh
        </button>
        <button
          onClick={exportToExcel}
          disabled={!appointments.length}
          className="px-3 py-1 bg-green-600 text-white rounded flex items-center disabled:opacity-50"
        >
          <FileDown size={16} className="mr-1" /> Export Excel
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full text-xs border border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Staff</th>
              <th className="border p-2">Payment</th>
              <th className="border p-2">Items</th>
              <th className="border p-2">Item Total</th>
              <th className="border p-2">Discount</th>
              <th className="border p-2">GST %</th>
              <th className="border p-2">GST Amount</th>
              <th className="border p-2">Final Amount</th>
              <th className="border p-2">Billed By</th>
              <th className="border p-2">Membership</th>
              <th className="border p-2">Membership Details</th>
              <th className="border p-2">Voucher</th>
              <th className="border p-2">Start</th>
              <th className="border p-2">End</th>
              <th className="border p-2">Branch</th>
              <th className="border p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id}>
                <td className="border p-2">{a.id}</td>
                <td className="border p-2">{a.customer_name}</td>
                <td className="border p-2">{a.customer_phone}</td>
                <td className="border p-2">{a.staff_name}</td>
                <td className="border p-2">{a.payment_method}</td>
                <td className="border p-2">
                  {a.cart?.map((item,i)=>(
                    <div key={i}>
                      {item.name} × {item.quantity} (${item.line_total})
                    </div>
                  ))}
                </td>
                <td className="border p-2">{a.item_total}</td>
                <td className="border p-2">{a.bill_discount}</td>
                <td className="border p-2">{a.gst_percent}</td>
                <td className="border p-2">{a.gst_amount}</td>
                <td className="border p-2">{a.final_total}</td>
                <td className="border p-2">{a.billed_staff_name}</td>
                <td className="border p-2">{a.membership_id ? "Membership" : "N/A"}</td>
                <td className="border p-2">{a.membership?.name || "N/A"}</td>
                <td className="border p-2">{a.voacher || "N/A"}</td>
                <td className="border p-2">{a.start_time_formatted || "—"}</td>
                <td className="border p-2">{a.end_time_formatted || "—"}</td>
                <td className="border p-2">{a.branch_id}</td>
                <td className="border p-2">{a.created_at_formatted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AppointmentsFull;
