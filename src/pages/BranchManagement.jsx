import React, { useState, useEffect } from "react";
import {
  fetchBranches,
  addBranch,
  updateBranch,
  deleteBranch,
} from "../contexts/authApi";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Phone,
  Mail,
  User,
  Building,
  List,
  Table,
  Grid,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("table");
  const [errors, setErrors] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  // Load branches (server-side)
  const loadBranches = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await fetchBranches(page, 10, search);
      console.log("branch",res);
      if (res.status) {
        setBranches(res.branches); // Laravel pagination
        setPagination({
          current_page: res.pagination.current_page,
          last_page: res.pagination.last_page,
          total: res.pagination.total,
        });
      }
    } catch {
      toast.error("❌ Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches(1, "");
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadBranches(1, searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      let res;
      if (editingBranch) {
        res = await updateBranch(editingBranch.id, formData);
      } else {
        res = await addBranch(formData);
      }
      if (res.status) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.message || "Branch saved successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
        loadBranches(pagination.current_page, searchTerm);
        handleCloseDrawer();
      } else {
        if (typeof res.message === "object") setErrors(res.message);
        else Swal.fire("Error!", res.message || "Something went wrong", "error");
      }
    } catch {
      Swal.fire("Error!", "Failed to save branch", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This branch will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await deleteBranch(id);
        if (res.status) {
          Swal.fire("Deleted!", res.message || "Branch deleted.", "success");
          loadBranches(pagination.current_page, searchTerm);
        } else {
          Swal.fire("Error!", res.message || "Failed to delete branch.", "error");
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
    setEditingBranch(null);
    setFormData({ name: "", address: "", phone: "", email: "" });
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      loadBranches(page, searchTerm);
    }
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
          <h1 className="text-2xl font-bold text-gray-800">Branch Management</h1>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Branch
          </button>
        </div>

        {/* Search + View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.length > 0 ? (
              branches.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg mr-4">
                        <Building className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{branch.name}</h3>
                        <p className="text-sm text-gray-500">ID: #{branch.id}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-gray-600 text-sm">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" /> {branch.address}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" /> {branch.phone}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" /> {branch.email}
                    </div>
                    {/* <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {branch.manager ? (
                        <span className="font-medium">{branch.manager}</span>
                      ) : (
                        <span className="text-red-500">No manager</span>
                      )}
                    </div> */}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No branches found</p>
            )}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow-sm">
            {branches.map((branch) => (
              <li key={branch.id} className="flex justify-between items-start p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{branch.name}</p>
                  <p className="text-sm text-gray-600">{branch.address}</p>
                  <p className="text-sm text-gray-600">
                    {branch.phone} • {branch.email}
                  </p>
                </div>
                <div className="flex space-x-2 ml-3">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                  >
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
                  {["S.No", "Name", "Address", "Phone", "Email", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-center">
                {branches.map((branch, idx) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{branch.name}</td>
                    <td className="px-4 py-3">{branch.address}</td>
                    <td className="px-4 py-3">{branch.phone}</td>
                    <td className="px-4 py-3">{branch.email}</td>
                   
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="text-purple-600 hover:text-purple-800 p-1 rounded-lg hover:bg-purple-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50"
                      >
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

      {/* Drawer */}
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
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">
            {editingBranch ? "Edit Branch" : "Add Branch"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: "Branch Name", key: "name", type: "text" },
              { label: "Address", key: "address", type: "textarea" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Email", key: "email", type: "email" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    value={formData[f.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [f.key]: e.target.value })
                    }
                    rows={3}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <input
                    type={f.type}
                    value={formData[f.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [f.key]: e.target.value })
                    }
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all shadow-md"
            >
              {editingBranch ? "Update Branch" : "Save Branch"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchManagement;
