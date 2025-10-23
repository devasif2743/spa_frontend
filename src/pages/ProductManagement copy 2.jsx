import React, { useState, useEffect } from "react";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../contexts/authApi";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Table,
  List,
  Grid,
  IndianRupee,
  Tag,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

const ProductManagement = () => {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    offer_price: "",
    duration: "",
  });

  const loadProducts = async (page = 1) => {
    setLoading(true);
    try {
      const prodRes = await fetchProducts(page, 6);
      if (prodRes.status) {
        setAllProducts(prodRes.products);
        setProducts(prodRes.products);
        setPagination(prodRes.pagination);
      }
    } catch {
      toast.error("❌ Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, []);

  useEffect(() => {
    const filtered = allProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProducts(filtered);
  }, [searchTerm, allProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));

    setLoading(true);
    try {
      let res;
      if (editingProduct) {
        res = await updateProduct(editingProduct.id, data);
        Swal.fire("Updated!", "✅ Service updated successfully", "success");
      } else {
        res = await addProduct(data);
        Swal.fire("Added!", "✅ Service added successfully", "success");
      }

      if (res?.status) {
        loadProducts(pagination.current_page);
        handleCloseDrawer();
      } else {
        Swal.fire("Error!", res?.message || "❌ Something went wrong", "error");
      }
    } catch {
      Swal.fire("Error!", "❌ Failed to save service", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || "",
      price: p.price,
      offer_price: p.offer_price || "",
      duration: p.duration || "",
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this service?")) {
      setLoading(true);
      try {
        await deleteProduct(id);
        toast.success("🗑️ Service deleted");
        loadProducts(pagination.current_page);
      } catch {
        toast.error("❌ Failed to delete service");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      offer_price: "",
      duration: "",
    });
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      loadProducts(page);
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
          <h1 className="text-2xl font-bold text-gray-800">Service Management</h1>

          {!isManager && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Service
            </button>
          )}
        </div>

        {/* Search + View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex space-x-2">
            {[{ v: "card", Icon: Grid }, { v: "list", Icon: List }, { v: "table", Icon: Table }].map(
              ({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-2 rounded-lg border shadow-sm ${
                    view === v ? "bg-green-600 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* ---------- Table View with S.No & Center Alignment ---------- */}
        {view === "table" && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["S.No", "Name", "Description", "Price", "Offer", "Duration", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-center">
                {products.length > 0 ? (
                  products.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.description ? (
                          <p className="text-gray-600 text-sm">{p.description}</p>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">₹{p.price}</td>
                      <td className="px-4 py-3 text-red-600">
                        {p.offer_price ? `₹${p.offer_price}` : "-"}
                      </td>
                      <td className="px-4 py-3">{p.duration || "-"}</td>
                      <td className="px-4 py-3 space-x-2">
                          {!isManager && (
                            <>
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-green-600 hover:text-green-800 p-1 rounded-lg hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                          </>
                          )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
                      No services found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------- Card and List Views remain unchanged ---------- */}
        {view === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length > 0 ? (
              products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.name}</h3>
                  {p.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <IndianRupee className="h-4 w-4 text-green-600 mr-2" />
                    Price: ₹{p.price}
                  </div>
                  {p.offer_price && (
                    <div className="flex items-center text-sm text-red-600 mb-2">
                      <Tag className="h-4 w-4 mr-2" />
                      Offer: ₹{p.offer_price}
                    </div>
                  )}
                  {p.duration && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Clock className="h-4 w-4 mr-2" />
                      Duration: {p.duration}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     {!isManager && (
                      <>
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                        </>
                     )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No services found</p>
            )}
          </div>
        )}

        {view === "list" && (
          <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow-sm">
            {products.length > 0 ? (
              products.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-start p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 flex items-center mt-1">
                      <IndianRupee className="h-4 w-4 mr-1 text-green-600" /> ₹{p.price}
                      {p.offer_price && (
                        <span className="ml-3 flex items-center text-red-600">
                          <Tag className="h-4 w-4 mr-1" /> ₹{p.offer_price}
                        </span>
                      )}
                      {p.duration && (
                        <span className="ml-3 flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" /> {p.duration}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-3">
                   {!isManager && (
                    <>
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </>
                   )}
                  </div>
                </li>
              ))
            ) : (
              <p className="text-gray-500 p-4">No services found</p>
            )}
          </ul>
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

      {/* Drawer (unchanged) */}
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
            {editingProduct ? "Edit Service" : "Add Service"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: "Service Name", key: "name", type: "text" },
              { label: "Description", key: "description", type: "textarea" },
              { label: "Price (₹)", key: "price", type: "number" },
              { label: "Offer Price (₹)", key: "offer_price", type: "number" },
              { label: "Duration", key: "duration", type: "text" },
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
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <input
                    type={f.type}
                    value={formData[f.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [f.key]: e.target.value })
                    }
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    required={f.key === "name" || f.key === "price"}
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-md"
            >
              {editingProduct ? "Update Service" : "Save Service"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
