import React, { useEffect, useState, useMemo } from "react";
import {
  fetchProducts,
  todayBilling,
  staff,
  allstaff,
  checkCustomerPhone,
  checkMembership,
  checkVoucher,
} from "../contexts/authApi";
import { Search } from "lucide-react";

export default function POS() {
  // ---------- State ----------
  const [staffList, setStaffList] = useState([]);
  const [allstaffList, allsetStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
   const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
const [selectedTime, setSelectedTime] = useState("");
  const [selectedOption, setSelectedOption] = useState("voucher");
  const [customerSource, setCustomerSource] = useState("walkin");

  // Discounts
  const [billDiscountType, setBillDiscountType] = useState("flat"); // "flat" | "percent" (UI optional)
  const [billDiscount, setBillDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  // Future appointment (date + time)
  const [isFutureAppt, setIsFutureAppt] = useState(false);
  const [apptAt, setApptAt] = useState(""); // "YYYY-MM-DDTHH:MM" (local)

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [cart, setCart] = useState([]);

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Staff
  const [staffId, setStaffId] = useState("");
  const [billedById, setBilledById] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [changeDue, setChangeDue] = useState(null);

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);

  // Membership
  const [memberPhone, setMemberPhone] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);

  // ---------- Helpers: datetime-local ----------
  // Build a datetime-local string in local time (YYYY-MM-DDTHH:MM)
  const toLocalDateTime = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Minimum allowed datetime = now + 10 minutes (avoid past)
  const minDateTimeLocal = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    return toLocalDateTime(d);
  }, []);

  // Quick set: Tomorrow at a given time (default 10:00 AM)
  const setTomorrowAt = (hour = 10, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    setIsFutureAppt(true);
    setApptAt(toLocalDateTime(d));
  };

   const formatTo12Hour = (time) => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ---------- Load Products ----------
  const loadProducts = async (page = 1, search = "") => {
    const res = await fetchProducts(page, 12, search);
    if (res?.status) {
      setServices(res.products);
      setPagination(res.pagination);
    }
  };

  useEffect(() => {
    loadProducts(1, ""); // load all services on mount
    staff().then((res) => {
      if (res.status) setStaffList(res.staff);
    });

    allstaff().then((res) => {
      if (res.status) allsetStaffList(res.staff);
    });
  }, []);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      loadProducts(1, searchTerm); // search if term entered, else all
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

   useEffect(() => {
    const now = new Date();
    // Format as "HH:MM" for input type="time"
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setSelectedTime(`${hours}:${minutes}`);
  }, []);

   const getPayload = () => {
    if (!selectedDate || !selectedTime) return null;
    return `${selectedDate}T${selectedTime}:00`; // e.g., 2025-10-01T14:30:00
  };

  const generateTimes = () => {
    const times = [];
    for (let hour = 9; hour <= 22; hour++) {
      for (let min of [0, 30]) {
        if (hour === 22 && min > 0) continue; // don't go past 10:00 PM
        const h = hour.toString().padStart(2, "0");
        const m = min.toString().padStart(2, "0");
        const label = new Date(0, 0, 0, hour, min).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        times.push({ value: `${h}:${m}`, label });
      }
    }
    return times;
  };


  // ---------- Customer ----------
  const searchCustomer = async () => {
    const phone = customerPhone.trim();
    if (!phone) return alert("Enter a phone number");
    try {
      const res = await checkCustomerPhone(phone);
      if (res.exists) {
        setCustomerName(res.customer_name);
        setCustomerPhone(res.customer_phone);
        alert(`Customer found: ${res.customer_name}`);
      } else {
        alert("No customer found. Enter details to create new.");
      }
    } catch (err) {
      console.error("Phone check failed", err);
      alert("Error checking phone number");
    }
  };

  // ---------- Membership ----------
  const handleMemberSearch = async () => {
    if (!memberPhone.trim()) return;
    try {
      const data = await checkMembership(memberPhone.trim());
      if (data.has_membership) {
        setMemberships(data.memberships || []);
      } else {
        alert("No active memberships found.");
      }
    } catch (err) {
      console.error(err);
      alert("Error checking membership.");
    }
  };

  const chooseMembership = (m) => {
    setSelectedMembership(m.id);
    setMemberInfo({
      ...m,
      free_remaining: m.remaining_services,
    });
  };

  // ---------- Totals ----------
  const itemTotal = useMemo(
    () =>
      cart.reduce(
        (sum, i) =>
          sum + Math.max(0, i.price * i.quantity - (i.discount || 0)),
        0
      ),
    [cart]
  );

  const membershipDiscount = useMemo(() => {
    if (!memberInfo) return 0;
    const freeLeft = memberInfo.free_remaining ?? 0;
    if (freeLeft <= 0) return 0;
    const prices = cart
      .flatMap((item) => Array(item.quantity).fill(item.price))
      .sort((a, b) => b - a);
    return prices.slice(0, freeLeft).reduce((sum, p) => sum + p, 0);
  }, [memberInfo, cart]);

  const totalMinutes = useMemo(
    () => cart.reduce((sum, i) => sum + (i.duration || 0) * i.quantity, 0),
    [cart]
  );

  const grandTotal = useMemo(
    () =>
      Math.max(
        0,
        itemTotal - (parseFloat(billDiscount) || 0) - membershipDiscount
      ),
    [itemTotal, billDiscount, membershipDiscount]
  );

  const gstAmount = useMemo(
    () => (grandTotal * (parseFloat(gstPercent) || 0)) / 100,
    [grandTotal, gstPercent]
  );

  const finalTotal = useMemo(() => grandTotal + gstAmount, [grandTotal, gstAmount]);

  // ---------- Voucher ----------
  // If voucher makes bill free, we simply set bill discount = itemTotal here
  const applyVoucher = async () => {
    if (!voucherCode.trim()) return alert("Enter voucher code");
    if (voucherApplied) return alert("Voucher already applied!");

    try {
      const res = await checkVoucher(voucherCode.trim());

      if (res.status) {
        setVoucherApplied(true);
        setBillDiscount(itemTotal || 0); // you can replace with res.amount if API returns
        alert(res.message || `Voucher "${voucherCode}" applied`);
      } else {
        alert(res.message || "Invalid voucher code");
      }
    } catch (err) {
      console.error("Voucher check failed", err);
      alert("Error validating voucher");
    }
  };

  // ---------- Cart ----------
  const addToCart = (service) => {
    // 🚫 Restrict if membership is applied
    if (selectedMembership && memberInfo) {
      const totalInCart = cart.reduce((sum, i) => sum + i.quantity, 0);
      if (totalInCart >= (memberInfo.free_remaining || 0)) {
        alert(
          `❌ You can only add ${memberInfo.free_remaining} services with this membership.`
        );
        return; // stop here
      }
    }

    // ✅ Normal add
    setCart((prev) => {
      const existing = prev.find((i) => i.id === service.id);
      if (existing) {
        return prev.map((i) =>
          i.id === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: service.id,
          name: service.name,
          price: parseFloat(service.final_price),
          quantity: 1,
          discount: 0,
          duration: parseInt(service.duration, 10) || 0,
        },
      ];
    });
  };

  const totalCartServices = useMemo(
    () => cart.reduce((n, i) => n + i.quantity, 0),
    [cart]
  );

  const updateQuantity = (id, qty) => {
    if (selectedMembership && memberInfo) {
      const totalInCart = cart.reduce((sum, i) => sum + i.quantity, 0);
      // 🚫 Restrict if trying to exceed free limit
      if (
        qty > (cart.find((i) => i.id === id)?.quantity || 0) &&
        totalInCart >= (memberInfo.free_remaining || 0)
      ) {
        alert(
          `❌ You can only use ${memberInfo.free_remaining} services with this membership.`
        );
        return; // stop here
      }
    }

    // ✅ Normal update
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  const resetAll_old = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCashReceived("");
    setTransactionNumber("");
    setPaymentMethod("cash");
    setChangeDue(null);
    // setStaffId("");
    setBillDiscount(0);
    setGstPercent(0);
    setMemberInfo(null);
    setMemberPhone("");
    setMemberships([]);
    // allsetStaffList([]);
    setSelectedMembership(null);
    setSelectedOption("");
    setVoucherApplied(false);
    setVoucherCode("");
    // booking reset
    setIsFutureAppt(false);
    setApptAt("");
  };

  const resetAll = () => {
  // Cart
  setCart([]);

  // Customer
  setCustomerName("");
  setCustomerPhone("");
  setMemberPhone("");
  setMemberships([]);
  setSelectedMembership(null);
  setMemberInfo(null);

  // Staff
  setStaffId("");
  setBilledById("");
  // allsetStaffList([]);
  // setStaffList([]);

  // Payment
  setPaymentMethod("cash");
  setCashReceived("");
  setTransactionNumber("");
  setChangeDue(null);

  // Discounts
  setBillDiscount(0);
  setBillDiscountType("flat");
  setGstPercent(0);

  // Voucher
  setVoucherCode("");
  setVoucherApplied(false);

  // Customer source
  setCustomerSource("walkin");

  // Future appointment
  setIsFutureAppt(false);
  setApptAt("");
  setSelectedDate(new Date().toISOString().split("T")[0]); // reset to today
  const now = new Date();
  setSelectedTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);

  // Misc
  setSelectedOption("voucher");
};




  // ---------- Submit ----------
  const confirmPayment = async () => {
    if (!customerName || !customerPhone) return alert("Enter customer details");
    if (!staffId) return alert("Select staff");

    // booking must have a datetime
    if (isFutureAppt && !apptAt) {
      return alert("Please select appointment date & time.");
    }

    const selectedStaffObj = staffList.find((s) => s.id === Number(staffId));
    const billedStaffObj = allstaffList.find((s) => s.id === Number(billedById));

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      staff_id: Number(staffId),
      billed_staff_id: Number(billedById),
      billed_staff_name: billedStaffObj?.name || "",
      staff_name: selectedStaffObj?.name || "",

      // If booking-only, mark as pay_later; otherwise actual payment method
      payment_method: isFutureAppt ? "pay_later" : paymentMethod,

      cart: cart.map((c) => ({
        service_id: c.id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        discount: c.discount,
        line_total: Math.max(0, c.price * c.quantity - c.discount),
        duration: c.duration || 0,
      })),

      item_total: itemTotal,
      bill_discount: parseFloat(billDiscount) || 0,
      membership_discount: membershipDiscount,
      grand_total: grandTotal,
      gst_percent: parseFloat(gstPercent) || 0,
      gst_amount: gstAmount,
      final_total: finalTotal,

      total_duration: totalMinutes,
      customer_source: customerSource,
      membership_id: memberInfo?.id || null,
      voucherCode: voucherCode || null,
      billDiscountType: billDiscountType || null,

      // Future appointment fields
      is_future_appointment: isFutureAppt,
      appointment_at: isFutureAppt ? apptAt : null, // local datetime string
      appointment_at_iso: isFutureAppt && apptAt ? new Date(apptAt).toISOString() : null, // optional ISO

      free_services_used: Math.min(
        memberInfo?.free_remaining || 0,
        totalCartServices
      ),
      totalCartServices: totalCartServices,
      datetime: getPayload(),
    };

    try {
      const data = await todayBilling(payload);
      if (data.status) {
        alert("✅ Appointment stored successfully!");
        resetAll();
      } else {
        alert("❌ Failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("API error:", err);
      alert("Error saving appointment");
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Services */}
        <div>
          <input
            type="text"
            placeholder="Search services…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-xl p-3 text-lg mb-5 w-full max-w-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => addToCart(srv)}
                className="cursor-pointer bg-white border rounded-xl shadow hover:shadow-lg transition p-4"
              >
                <h3 className="font-semibold">{srv.name}</h3>
                {srv.duration && (
                  <p className="text-sm text-gray-500">{srv.duration} Min</p>
                )}
                <p className="text-green-600 font-bold">
                  ₹ {parseFloat(srv.final_price).toFixed(2)}
                </p>
              </div>
            ))}
            {services.length === 0 && (
              <p className="col-span-full text-gray-500 text-center">
                No services found.
              </p>
            )}
          </div>
        </div>

        {/* Right: Cart + Checkout */}
        <div className="bg-gray-50 rounded-xl p-5 shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Cart </h2>

          {cart.length === 0 && (
            <p className="text-gray-500 text-center">Cart is empty.</p>
          )}

          {cart.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg">
                <thead className="bg-gray-100">
                  <tr className="text-left">
                    <th className="px-3 py-2 border">Product Name</th>
                    <th className="px-3 py-2 border text-center">Qty</th>
                    <th className="px-3 py-2 border text-center">Discount</th>
                    <th className="px-3 py-2 border text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">
                        {item.name}
                        <p>{item.duration} Min</p>
                      </td>
                      <td className="px-3 py-2 border text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="px-2 border rounded"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            –
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="px-2 border rounded"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 border text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.discount || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setCart((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, discount: value }
                                  : i
                              )
                            );
                          }}
                          className="w-20 border rounded p-1 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 border text-right font-medium">
                        ₹
                        {Math.max(
                          0,
                          item.price * item.quantity - (item.discount || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Discount Section (Voucher / Membership / Discount) */}
          <div className="mt-4 border rounded-lg bg-white p-3 shadow-sm">
            {/* Toggle Tabs */}
            <div className="flex border-b mb-3">
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  selectedOption === "voucher"
                    ? "border-b-2 border-purple-600 text-purple-600"
                    : "text-gray-600"
                }`}
                onClick={() => setSelectedOption("voucher")}
              >
                Voucher
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  selectedOption === "membership"
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-600"
                }`}
                onClick={() => setSelectedOption("membership")}
              >
                Membership
              </button>

              <button
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  selectedOption === "discount"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => setSelectedOption("discount")}
              >
                Discount
              </button>
            </div>

            {/* Voucher Form */}
            {selectedOption === "voucher" && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Voucher Code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 border rounded p-2 w-full sm:w-auto"
                />
                <button
                  onClick={applyVoucher}
                  disabled={voucherApplied}
                  className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50 w-full sm:w-auto"
                >
                  {voucherApplied ? "Applied" : "Apply"}
                </button>
              </div>
            )}

            {voucherApplied && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVoucherCode("");
                    setVoucherApplied(false);
                    setBillDiscount(0);
                  }}
                  className="text-xs text-red-500 underline hover:text-red-700"
                >
                  Reset Voucher
                </button>
              </div>
            )}

            {/* Membership Form */}
            {selectedOption === "membership" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Phone"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="flex-1 border rounded p-2 w-full sm:w-auto"
                  />
                  <button
                    onClick={handleMemberSearch}
                    className="px-3 py-2 bg-green-600 text-white rounded w-full sm:w-auto"
                  >
                    Search
                  </button>
                </div>

                {memberships.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {memberships.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center space-x-2 text-sm ${
                          m.remaining_services === 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="membership"
                          checked={selectedMembership === m.id}
                          onChange={() => chooseMembership(m)}
                          disabled={m.remaining_services === 0}
                        />
                        <span>
                          {m.plan_name} ({m.remaining_services} left)
                        </span>
                      </label>
                    ))}

                    {/* Reset option */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMembership(null);
                          setMemberInfo(null);
                          setMemberships([]);
                          setMemberPhone("");
                        }}
                        className="text-xs text-red-500 underline hover:text-red-700"
                      >
                        Reset Membership
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Discount Form */}
            {selectedOption === "discount" && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(Number(e.target.value))}
                  className="w-24 border rounded p-2 text-right"
                  placeholder="Discount"
                />
                {/* Optional: enable %/flat selector
                <select
                  value={billDiscountType}
                  onChange={(e) => setBillDiscountType(e.target.value)}
                  className="border rounded p-2"
                >
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Percent</option>
                </select>
                */}
              </div>
            )}
          </div>

          {/* GST Input */}
          <div className="mt-4 flex items-center gap-2">
            <label htmlFor="gst" className="text-sm font-medium">
              GST %
            </label>
            <input
              id="gst"
              type="number"
              min="0"
              max="100"
              value={gstPercent}
              onChange={(e) => setGstPercent(Number(e.target.value))}
              className="w-20 border rounded p-2 text-right"
            />
          </div>

          {/* Future Appointment (Date & Time) */}
          {/* <div className="mt-4 border rounded-lg bg-white p-3 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isFutureAppt}
                onChange={(e) => setIsFutureAppt(e.target.checked)}
              />
              Book for future date & time
            </label>

            {isFutureAppt && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Appointment At
                  </label>
                  <input
                    type="datetime-local"
                    min={minDateTimeLocal}
                    value={apptAt}
                    onChange={(e) => setApptAt(e.target.value)}
                    className="border rounded p-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setTomorrowAt(10, 0)}
                  className="px-3 py-2 border rounded hover:bg-gray-50"
                >
                  Tomorrow (10:00 AM)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setApptAt("");
                    setIsFutureAppt(false);
                  }}
                  className="px-3 py-2 text-red-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div> */}

          {/* Totals */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
            <span>Items Total:</span>
            <span className="text-right">₹{itemTotal.toFixed(2)}</span>

            {membershipDiscount > 0 && (
              <>
                <span>Membership Discount:</span>
                <span className="text-right">–₹{membershipDiscount}</span>
              </>
            )}

            {billDiscount > 0 && (
              <>
                <span>Bill Discount:</span>
                <span className="text-right">–₹{billDiscount}</span>
              </>
            )}

            <span>Subtotal:</span>
            <span className="text-right font-medium">
              ₹{grandTotal.toFixed(2)}
            </span>

            <span>GST:</span>
            <span className="text-right">₹{gstAmount.toFixed(2)}</span>

            <span className="font-bold">Final Total:</span>
            <span className="text-right font-bold">
              ₹{finalTotal.toFixed(2)}
            </span>
          </div>

          {/* Customer + Staff + Payment */}
        

          {/* Customer + Staff + Payment */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border rounded p-2 w-full"
                required
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 border rounded p-2"
                  required
                />
                <button
                  onClick={searchCustomer}
                  className="px-3 bg-blue-600 text-white rounded"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Staff */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Staff <span className="text-red-500">*</span>
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="border rounded p-2 w-full"
                required
              >
                <option value="">Select Staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Billed By */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Billed By <span className="text-red-500">*</span>
              </label>
              <select
                value={billedById}
                onChange={(e) => setBilledById(e.target.value)}
                className="border rounded p-2 w-full"
              >
                <option value="">Select Billed Staff</option>
                {allstaffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment (only if not future appointment / voucher / membership) */}
            {!voucherApplied && !selectedMembership && !isFutureAppt && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {paymentMethod === "cash"
                      ? "Cash Received"
                      : "Transaction Reference"}
                        <span className="text-red-500">*</span>
                  </label> 
                  <input
                    type={paymentMethod === "cash" ? "number" : "text"}
                    placeholder={
                      paymentMethod === "cash"
                        ? "Enter cash amount"
                        : "Enter reference number"
                    }
                    value={
                      paymentMethod === "cash" ? cashReceived : transactionNumber
                    }
                    onChange={(e) =>
                      paymentMethod === "cash"
                        ? setCashReceived(e.target.value)
                        : setTransactionNumber(e.target.value)
                    }
                    className="border rounded p-2 w-full"
                  />
                </div>
              </>
            )}

            {/* Customer Source */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer Source <span className="text-red-500">*</span>
              </label>
              <select
                value={customerSource}
                onChange={(e) => setCustomerSource(e.target.value)}
                className="border rounded p-2 w-full"
              >
                <option value="Walkin">Walk-in</option>
                <option value="Google">Google</option>
                <option value="Reference">Reference</option>
                <option value="Instagram Ads">Instagram Ads</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]} // prevent future
                className="border rounded p-2 w-full"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="border rounded p-2 w-full"
                required
              />
            </div>
          </div>

        
         <button
         
 onClick={confirmPayment}
  disabled={
    cart.length === 0 ||                     // must have at least 1 service
    !customerName.trim() ||                  // customer name required
    customerPhone.trim().length !== 10 ||    // ✅ must be exactly 10 digits
    !staffId ||                              // staff required
    !selectedDate ||                         // date required
    !selectedTime ||                         // time required
    (
      !isFutureAppt &&
      !voucherApplied &&
      !selectedMembership &&
      !paymentMethod                         // payment required unless voucher/membership/future appt
    )
  }
  className={`mt-5 w-full py-3 rounded-lg text-white font-semibold ${
    cart.length === 0 ||
    !customerName.trim() ||
    customerPhone.trim().length !== 10 ||
    !staffId ||
    !selectedDate ||
    !selectedTime ||
    (
      !isFutureAppt &&
      !voucherApplied &&
      !selectedMembership &&
      !paymentMethod
    )
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  Confirm & Save Bill
</button>

        </div>
      </div>
    </div>
  );
}
