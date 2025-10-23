import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Filter,
  CreditCard 
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import jsPDF from "jspdf";
import { fetchBranchesadmin, fetchbranchReports } from "../contexts/authApi";

const Reports = () => {
  const { user } = useAuth();
   const navigate = useNavigate();
     const goToBilling = () => {
    navigate("/manager/billing"); // change to your billing route
  };

  // ⬇️ start/end dates default to last 7 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  // const [endDate, setEndDate] = useState(() =>
  //   new Date().toISOString().slice(0, 10)
  // );
   const today = new Date().toISOString().slice(0, 10);
  const [endDate, setEndDate] = useState(today);

  const [selectedBranch, setSelectedBranch] = useState("all");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);

  // fetch branch list only for admin
  useEffect(() => {
    if (user.role === "admin") {
      fetchBranchesadmin()
        .then(setBranches)
        .catch(err => console.error("Failed to load branches:", err));
    }
  }, [user.role]);

  // fetch report when dates/branch change
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const branch = user.role === "admin" ? selectedBranch : user.branchId;
        // ✅ pass start & end date to your API
        const data = await fetchbranchReports(startDate, endDate, branch);
        console.log("dashboard",data);
        setReportData(data);
      } catch (err) {
        console.error("Failed to fetch report:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [startDate, endDate, selectedBranch, user]);

  const exportToPDF = () => {
    if (!reportData) return;
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text("Sales Report", 20, 30);
    pdf.setFontSize(12);
    pdf.text(`Period: ${startDate} to ${endDate}`, 20, 45);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 55);
    pdf.text(`Total Revenue: ₹${reportData.totalRevenue.toFixed(2)}`, 20, 75);
    pdf.text(`Total Transactions: ${reportData.totalTransactions}`, 20, 85);
    pdf.text(
      `Average Transaction: ₹${reportData.avgTransaction.toFixed(2)}`,
      20,
      95
    );
    pdf.text("Top Services:", 20, 115);
    reportData.categoryPerformance.slice(0, 5).forEach((p, i) => {
      pdf.text(
        `${i + 1}. ${p.name}: ₹${p.revenue.toFixed(2)}`,
        25,
        125 + i * 10
      );
    });
    pdf.save("sales-report.pdf");
  };

  if (loading || !reportData) {
    return <div className="p-6">Loading report...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:pl-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Service Revenue Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Analytics and insights for your services
            </p>
          </div>
          {/* <button
            onClick={exportToPDF}
            className="mt-4 sm:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Export PDF
          </button> */}

          {/* <button
            onClick={goToBilling}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Go to Billing 
          </button> */}

              {user.role !== "admin" && (
            <button
              onClick={goToBilling}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Go to Billing
            </button>
          )}


        </div>

        

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              {/* <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              /> */}

               <input
                  type="date"
                  value={endDate}
                  max={today} // ✅ Prevents future date selection
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected <= today) {
                      setEndDate(selected);
                    }
                  }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
            </div>

            {/* Branch (admins only) */}
            {user.role === "admin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Transactions summary */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {reportData.totalTransactions} transactions analyzed
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Metric
            icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
            title="Total Revenue"
            value={`₹${reportData.totalRevenue.toFixed(2)}`}
            bg="bg-emerald-100"
          />
          <Metric
            icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
            title="Transactions"
            value={reportData.totalTransactions}
            bg="bg-blue-100"
          />
          <Metric
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            title="Avg Transaction"
            value={`₹${reportData.avgTransaction.toFixed(2)}`}
            bg="bg-purple-100"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard
            title="Revenue Trend"
            icon={<TrendingUp className="h-5 w-5 mr-2" />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={v => [`₹${Number(v).toFixed(2)}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: "#8B5CF6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Service Performance"
            icon={<BarChart3 className="h-5 w-5 mr-2" />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={v => [`₹${v.toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Customer Source"
            icon={<BarChart3 className="h-5 w-5 mr-2" />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.customerSourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={v => [`${v}`, "Customers"]} />
                <Bar dataKey="count" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ icon, title, value, bg }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

export default Reports;
