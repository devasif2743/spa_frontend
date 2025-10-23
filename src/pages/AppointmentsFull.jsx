import React, { useEffect, useState } from "react";
import { RefreshCcw, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { fetchAppointmentsFull, fetchBranchesadmin } from "../contexts/authApi";

const AppointmentsFull = ({ branchId: fixedBranchId }) => {
  const [branchId, setBranchId] = useState(fixedBranchId || "all");
  const [branches, setBranches] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search, pagination, date filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");




  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Load branches (admin mode only)
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
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [branchId]);

  /** -------- Filtering & Pagination -------- */
  const filteredAppointments = appointments.filter(a => {
    const customerName = (a.customer_name ?? "").toString().toLowerCase();
    const customerPhone = (a.customer_phone ?? "").toString().toLowerCase();
    const staffName = (a.staff_name ?? "").toString().toLowerCase();
    const payment = (a.payment_method ?? "").toString().toLowerCase();

    const matchesSearch =
      customerName.includes(searchQuery.toLowerCase()) ||
      customerPhone.includes(searchQuery.toLowerCase()) ||
      staffName.includes(searchQuery.toLowerCase()) ||
      payment.includes(searchQuery.toLowerCase());

    // Date filter (inclusive)
    const appointmentDate = new Date(a.appdate);
    const start = startDate ? new Date(startDate + "T00:00:00") : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null;
    const matchesDate =
      (!start || appointmentDate >= start) &&
      (!end || appointmentDate <= end);

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredAppointments.length / rowsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /** -------- Export to Excel -------- */
  const exportToExcel = () => {
    if (!filteredAppointments.length) return;

    const rows = filteredAppointments.map(a => ({
      ID: a.id,
      Customer: a.customer_name,
      Phone: a.customer_phone,
      Staff: a.staff_name,
      Payment: a.payment_method,
      Items: (a.cart || [])
        .map(it => `${it.name} x ${it.quantity} (${it.line_total})`)
        .join(", "),
      Final_Total: a.final_total,
      Start: a.start_time_formatted,
      End: a.end_time_formatted,
      Branch: a.branch_id,
      Created: a.created_at_formatted,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appointments");
    XLSX.writeFile(wb, `appointments_${branchId}_${Date.now()}.xlsx`);
  };

  /** -------- Reset Filters -------- */
  const resetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div className="p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Appointment Details</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
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

        <input
          type="text"
          placeholder="Search appointments..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="border rounded p-2 flex-1 min-w-[200px]"
        />

        <input
          type="date"
          value={startDate}
          onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
          className="border rounded p-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
          className="border rounded p-2"
          max={new Date().toISOString().split("T")[0]}
        />

        <button
          onClick={resetFilters}
          className="px-3 py-1 bg-gray-600 text-white rounded"
        >
          Reset Filters
        </button>

        <button
          onClick={loadAppointments}
          className="px-3 py-1 bg-indigo-600 text-white rounded flex items-center"
        >
          <RefreshCcw size={16} className="mr-1" /> Refresh
        </button>

        <button
          onClick={exportToExcel}
          disabled={!filteredAppointments.length}
          className="px-3 py-1 bg-green-600 text-white rounded flex items-center disabled:opacity-50"
        >
          <FileDown size={16} className="mr-1" /> Export Excel
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <table className="w-full text-xs border border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Phone</th>
                <th className="border p-2">Staff</th>
                <th className="border p-2">Payment</th>
                <th className="border p-2">Services</th>


              
                <th className="border p-2">Start</th>
                <th className="border p-2">End</th>
                <th className="border p-2">Branch</th>
                <th className="border p-2">membership_id</th>
                <th className="border p-2">Voacher</th>
                <th className="border p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map(a => (
                <tr key={a.id}>
                  <td className="border p-2">{a.id}</td>
                  <td className="border p-2">

                      {new Date(a.appdate).toLocaleString('en-US', {
                        month: 'short',     // Oct
                        day: 'numeric',     // 1
                        year: 'numeric',    // 2025
                        hour: 'numeric',    // 3
                        minute: '2-digit',  // 30
                        hour12: true        // AM/PM
                      })}
                  </td>
                  <td className="border p-2">{a.customer_name}</td>
                  <td className="border p-2">{a.customer_phone}</td>
                  <td className="border p-2">{a.staff_name}</td>
                  <td className="border p-2">{a.payment_method}</td>
                  {/* <td className="border p-2">{a.final_total}</td> */}

                   <td className="border p-2">
                    {a.cart
                      .map(
                        (service) =>
                          `${service.name} (₹${service.price} × ${service.quantity} = ₹${service.line_total}, ${service.duration} min)`
                      )
                      .join(", ")}
                  </td>
                  <td className="border p-2">{a.start_time_formatted}</td>
                  <td className="border p-2">{a.end_time_formatted}</td>
                  <td className="border p-2">{a.branch_name}</td>
                  <td className="border p-2">{a.membership_id}</td>
                  <td className="border p-2">{a.voacher}</td>
                  <td className="border p-2">{a.created_at_formatted}</td>
                </tr>
              ))}
              {!paginatedAppointments.length && (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-gray-500">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentsFull;
