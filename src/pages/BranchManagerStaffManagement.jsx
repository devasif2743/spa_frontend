import React, { useState, useEffect } from "react";
import {
  fetchStaff,
  add_staff_branch,
  updateStaff,
  deleteStaff,
} from "../contexts/authApi";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Grid,
  List,
  Table,
  Mail,
  Phone,
} from "lucide-react";

const BranchManagerStaffManagement = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // ✅ filter
  const [view, setView] = useState("card");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    password: "",
    email: "",
    role: "",
    branchId: user?.branchId || "",
  });

  // Load staff list
  const loadStaff = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchStaff(page, 10, searchTerm, roleFilter);
      if (res.status) {
        setStaff(res.branches || []);
        setPagination({
          current_page: res.pagination?.current_page || 1,
          last_page: res.pagination?.last_page || 1,
          total: res.pagination?.total || 0,
        });
      }
    } catch {
      Swal.fire("Error!", "Failed to load staff.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [searchTerm, roleFilter]);

  // Save staff
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingStaff) {
        res = await updateStaff(editingStaff.id, formData);
      } else {
        res = await add_staff_branch(formData);
      }

      if (res.status) {
        Swal.fire("✅ Success", res.message || "Staff saved!", "success");
        loadStaff(pagination.current_page);
        handleCloseDrawer();
      } else {
        Swal.fire("❌ Error", res.message || "Something went wrong", "error");
      }
    } catch {
      Swal.fire("Error!", "Failed to save staff.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setEditingStaff(m);
    setFormData({
      name: m.name,
      contact: m.contact,
      password: "",
      email: m.email,
      role: m.role,
      branchId: user?.branchId,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This staff member will be deleted.",
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
          loadStaff(pagination.current_page);
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
      branchId: user?.branchId,
    });
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) loadStaff(page);
  };

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
          <h1 className="text-2xl font-bold text-gray-800">POS Staff</h1>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Staff
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center justify-between mb-6 space-x-4">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg w-72"
          />

          {/* <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Roles</option>
            <option value="pos">POS Operator</option>
            <option value="manager">Manager</option>
            <option value="therapist">Therapist</option>
          </select> */}

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

        {/* Card View */}
        {view === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {staff.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md group"
              >
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                    <p className="text-sm text-purple-600">{m.role}</p>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(m)} className="text-purple-600 p-2">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-1" /> {m.contact}
                </p>
                <p className="text-sm flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-1" /> {m.email}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <ul className="divide-y bg-white rounded-xl shadow-sm">
            {staff.map((m) => (
              <li key={m.id} className="flex justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-gray-600">{m.contact} • {m.email}</p>
                  <p className="text-sm text-gray-600">{m.role}</p>
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

        {/* Table View */}
        {view === "table" && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3">{m.contact}</td>
                    <td className="px-4 py-3">{m.email}</td>
                    <td className="px-4 py-3">{m.role}</td>
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
              className="px-3 py-1 border rounded-lg disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`px-3 py-1 rounded-lg ${
                  pagination.current_page === page ? "bg-purple-600 text-white" : "bg-white border"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => changePage(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 border rounded-lg disabled:opacity-40"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border rounded-lg p-2"
              required={!editingStaff}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            />

            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Select Role</option>
              <option value="pos">POS Operator</option>
              <option value="manager">Manager</option>
              <option value="therapist">Therapist</option>
            </select>
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              {editingStaff ? "Update" : "Save"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchManagerStaffManagement;
