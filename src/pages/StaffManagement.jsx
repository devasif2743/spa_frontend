import React, { useState, useEffect } from "react";
import {
  fetchStaffadmin,
  addStaff,
  updateStaff,
  deleteStaff,
  fetchBranches,
} from "../contexts/authApi";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Grid,
  List,
  Table,
} from "lucide-react";

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [view, setView] = useState("table");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    password: "",
    email: "",
    role: "pos",
    branch_id: "",
  });

  // ---- Helpers ----
  const getBranchName = (branchId) => {
    const b = branches.find((x) => x.id == branchId);
    return b ? b.name : "Unassigned";
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "manager":
        return "Branch Manager";
      case "pos":
        return "POS Operator";
      case "admin":
        return "Admin";
      case "therapist":
        return "Therapist";  
      default:
        return "therapist";
    }
  };

  // ---- Data Loading ----
  const loadStaff = async (page = 1, search = "", role = "") => {
    setLoading(true);
    try {
      const res = await fetchStaffadmin(page, 10, search, role);
      if (res.status) {
        setStaff(res.staff || []);
        setPagination(res.pagination);
      }
    } catch {
      Swal.fire("Error!", "Failed to load staff.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await fetchBranches();
      if (res.status) setBranches(res.branches || []);
    } catch {
      console.error("Failed to load branches");
    }
  };

  useEffect(() => {
    loadBranches();
    loadStaff(1, searchTerm, selectedRole);
  }, []);

  // Debounced search + filter
  useEffect(() => {
    const delay = setTimeout(() => {
      loadStaff(1, searchTerm, selectedRole);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, selectedRole]);

  // ---- CRUD ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingStaff) {
        res = await updateStaff(editingStaff.id, formData);

      } else {
        res = await addStaff(formData);
      }
      if (res.status) {
        Swal.fire("Success!", res.data.message || "Staff saved successfully!", "success");
        loadStaff(pagination.current_page, searchTerm, selectedRole);
        handleCloseDrawer();
      } else {
        Swal.fire("Error!", res.message || "Something went wrong", "error");
      }
    } catch {
      Swal.fire("Error!", "Failed to save staff.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name || "",
      contact: member.contact || "",
      password: "",
      email: member.email || "",
      role: member.role || "pos",
      branch_id: member.branch_id || "",
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This staff member will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await deleteStaff(id);
        if (res.status) {
          Swal.fire("Deleted!", res.message || "Staff deleted.", "success");
          loadStaff(pagination.current_page, searchTerm, selectedRole);
        } else {
          Swal.fire("Error!", res.message || "Failed to delete staff.", "error");
        }
      } catch {
        Swal.fire("Error!", "Something went wrong.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingStaff(null);
    setFormData({
      name: "",
      contact: "",
      password: "",
      email: "",
      role: "pos",
      branch_id: "",
    });
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      loadStaff(page, searchTerm, selectedRole);
    }
  };

  // ---- UI ----
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Staff
          </button>
        </div>

        {/* Search + Filters + View Toggle */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Roles</option>
            <option value="manager">Managers</option>
            <option value="pos">POS Operators</option>
            <option value="admin">Admins</option>
            <option value="therapist">Therapist</option>
          </select>
          <div className="flex space-x-2">
            {[{ v: "card", Icon: Grid }, { v: "list", Icon: List }, { v: "table", Icon: Table }].map(
              ({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-2 rounded-lg border shadow-sm ${
                    view === v ? "bg-purple-600 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* CARD View */}
        {view === "card" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {staff.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                    <p className="text-sm text-purple-600">{getRoleLabel(m.role)}</p>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleEdit(m)}
                      className="text-purple-600 hover:text-purple-800 p-2"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">@ {getBranchName(m.branch_id)} Branch</p>
                <p className="text-sm text-gray-500">{m.email}</p>
                <p className="text-sm text-gray-500">{m.contact}</p>
              </div>
            ))}
          </div>
        )}

        {/* LIST View */}
        {view === "list" && (
          <ul className="divide-y bg-white rounded-xl shadow-sm">
            {staff.map((m) => (
              <li key={m.id} className="flex justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium">
                    {m.name} - @ {getBranchName(m.branch_id)} Branch
                  </p>
                  <p className="text-sm text-gray-600">{m.email}</p>
                  <p className="text-sm text-gray-600">{m.contact}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(m)} className="text-purple-600 p-2">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* TABLE View */}
        {view === "table" && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-center">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">S.No</th>
                  <th className="px-4 py-3 text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-sm font-semibold">Contact</th>
                  <th className="px-4 py-3 text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-sm font-semibold">Branch</th>
                  <th className="px-4 py-3 text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {staff.map((m, idx) => (
                  <tr key={m.id} className="text-center">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">{m.contact}</td>
                    <td className="px-4 py-3">{m.email}</td>
                    <td className="px-4 py-3">{getBranchName(m.branch_id)}</td>
                    <td className="px-4 py-3">{getRoleLabel(m.role)}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => handleEdit(m)} className="text-purple-600 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="text-red-600 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => changePage(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`px-3 py-1 rounded-lg ${
                  pagination.current_page === page
                    ? "bg-purple-600 text-white"
                    : "bg-white border hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => changePage(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Side Drawer */}
      <div className="fixed inset-0 flex justify-end z-50 pointer-events-none">
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            drawerOpen ? "bg-opacity-40 pointer-events-auto" : "bg-opacity-0"
          }`}
          onClick={handleCloseDrawer}
        ></div>
        <div
          className={`relative w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out pointer-events-auto ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            onClick={handleCloseDrawer}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold mb-6">
            {editingStaff ? "Edit Staff" : "Add Staff"}
          </h2>
       <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label className="block mb-1 font-medium">Full Name</label>
    <input
      type="text"
      placeholder="Full Name"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      className="w-full border rounded-lg p-2"
      required
    />
  </div>

  <div>
    <label className="block mb-1 font-medium">Contact</label>
    <input
      type="number"
      placeholder="Contact"
      value={formData.contact}
      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
      className="w-full border rounded-lg p-2"
      required
    />
  </div>

  <div>
    <label className="block mb-1 font-medium">Password</label>
    <input
      type="password"
      placeholder="Password"
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      className="w-full border rounded-lg p-2"
      required={!editingStaff}
    />
  </div>

  <div>
    <label className="block mb-1 font-medium">Email</label>
    <input
      type="email"
      placeholder="Email"
      value={formData.email}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      className="w-full border rounded-lg p-2"
      required
    />
  </div>

  <div>
    <label className="block mb-1 font-medium">Role</label>
    <select
      value={formData.role}
      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      className="w-full border rounded-lg p-2"
      required
    >
      <option value="pos">POS Operator</option>
      <option value="manager">Branch Manager</option>
      <option value="therapist">Therapist</option>
      <option value="admin">Admin</option>
    </select>
  </div>

  <div>
    <label className="block mb-1 font-medium">Branch</label>
    <select
      value={formData.branch_id}
      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
      className="w-full border rounded-lg p-2"
      required
    >
      <option value="">Select Branch</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  </div>

  {/* Full-width submit button spans both columns */}
  <div className="md:col-span-2">
    <button
      type="submit"
      className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
    >
      {editingStaff ? "Update" : "Save"}
    </button>
  </div>
</form>


        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
