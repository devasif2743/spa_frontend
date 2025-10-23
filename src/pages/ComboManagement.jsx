import React, { useState, useEffect } from "react";
import {
  fetchMemberships,
  addMembership,
  updateMembership,
  deleteMembership,
} from "../contexts/authApi";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Grid,
  List,
  Table,
  Clock,
  Layers,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const ComboManagement = () => {
  const [memberships, setMemberships] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("table");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [formData, setFormData] = useState({
    name: "",
    expiration: "",
    price: "",
    offer_price: "",
    service_count: "",
  });

  // ---- Load memberships from API ----
  const loadMemberships = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await fetchMemberships(page, 10, search);
      if (res.status) {
        setMemberships(res.memberships);
        setPagination(res.pagination);
      }
    } catch {
      Swal.fire("Error!", "Failed to load memberships.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberships(1, "");
  }, []);

  // ---- Debounced search ----
  useEffect(() => {
    const delay = setTimeout(() => {
      loadMemberships(1, searchTerm);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // ---- Pagination ----
  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      loadMemberships(page, searchTerm);
    }
  };

  // ---- CRUD ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingMembership) {
        res = await updateMembership(editingMembership.id, formData);
      } else {
        res = await addMembership(formData);
      }
      if (res.status) {
        Swal.fire("✅ Success", res.message || "Membership saved!", "success");
        loadMemberships(pagination.current_page, searchTerm);
        handleCloseDrawer();
      } else {
        Swal.fire("❌ Error", res.message || "Something went wrong", "error");
      }
    } catch {
      Swal.fire("❌ Error", "Failed to save membership", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setEditingMembership(m);
    setFormData({
      name: m.name,
      expiration: m.expiration,
      price: m.price,
      offer_price: m.offer_price || "",
      service_count: m.service_count,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This membership will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await deleteMembership(id);
        if (res.status) {
          Swal.fire("Deleted!", res.message || "Membership deleted", "success");
          loadMemberships(pagination.current_page, searchTerm);
        }
      } catch {
        Swal.fire("❌ Error", "Failed to delete", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingMembership(null);
    setFormData({
      name: "",
      expiration: "",
      price: "",
      offer_price: "",
      service_count: "",
    });
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
          <h1 className="text-2xl font-bold text-gray-800">Membership Management</h1>
          {!isManager && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
            >
              <Plus className="h-5 w-5 mr-2" /> Add Membership
            </button>
          )}
        </div>

        {/* Search + View toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search memberships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex space-x-2">
            {[{ v: "card", Icon: Grid }, { v: "list", Icon: List }, { v: "table", Icon: Table }].map(
              ({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-2 rounded-lg border ${
                    view === v ? "bg-green-600 text-white" : "bg-white text-gray-600"
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
            {memberships.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{m.name}</h3>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                    {!isManager && (
                      <>
                        <button onClick={() => handleEdit(m)} className="text-green-600 p-2">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-red-600 p-2">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Exp: {m.expiration} days
                </p>
                <p className="text-sm text-gray-600">
                  ₹{m.offer_price || m.price}
                  {m.offer_price && (
                    <span className="ml-2 line-through text-red-500">₹{m.price}</span>
                  )}
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <Layers className="h-4 w-4 mr-1" /> Services: {m.service_count}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <ul className="divide-y bg-white rounded-xl shadow-sm">
            {memberships.map((m) => (
              <li key={m.id} className="flex justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-gray-600">
                    Exp: {m.expiration} days • Services: {m.service_count}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!isManager && (
                    <>
                      <button onClick={() => handleEdit(m)} className="text-green-600 p-2">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="text-red-600 p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Table View */}
        {view === "table" && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-center">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">S.No</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Expiration</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Offer Price</th>
                  <th className="px-4 py-3 font-semibold">Services</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {memberships.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3">{m.expiration} days</td>
                    <td className="px-4 py-3">₹{m.price}</td>
                    <td className="px-4 py-3">{m.offer_price ? `₹${m.offer_price}` : "-"}</td>
                    <td className="px-4 py-3">{m.service_count}</td>
                    {!isManager && (
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(m)} className="text-green-600 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-red-600 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
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
                    ? "bg-green-600 text-white"
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

    <h2 className="text-xl font-bold mb-6">
      {editingMembership ? "Edit Membership" : "Add Membership"}
    </h2>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-1 font-medium">
          Membership Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="Membership Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="expiration" className="block mb-1 font-medium">
          Expiration (days)
        </label>
        <input
          id="expiration"
          type="number"
          placeholder="Expiration (days)"
          value={formData.expiration}
          onChange={(e) =>
            setFormData({ ...formData, expiration: e.target.value })
          }
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="price" className="block mb-1 font-medium">
          Price
        </label>
        <input
          id="price"
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="offer_price" className="block mb-1 font-medium">
          Offer Price
        </label>
        <input
          id="offer_price"
          type="number"
          placeholder="Offer Price"
          value={formData.offer_price}
          onChange={(e) =>
            setFormData({ ...formData, offer_price: e.target.value })
          }
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label htmlFor="service_count" className="block mb-1 font-medium">
          Service Count
        </label>
        <input
          id="service_count"
          type="number"
          placeholder="Service Count"
          value={formData.service_count}
          onChange={(e) =>
            setFormData({ ...formData, service_count: e.target.value })
          }
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
      >
        {editingMembership ? "Update" : "Save"}
      </button>
    </form>
  </div>
</div>

    </div>
  );
};

export default ComboManagement;
