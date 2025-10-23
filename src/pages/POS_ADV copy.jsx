import React, { useEffect, useState, useMemo } from "react";
import {
  fetchProducts,
  addBilling,
  advBilling,
  staff,
  allstaff,
  advstaff,
  checkCustomerPhone,
  checkMembership,
} from "../contexts/authApi";

export default function POS_ADV() {
  // ---------- State ----------
  const [staffList, setStaffList] = useState([]);
  const [allstaffList, allsetStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [customerSource, setCustomerSource] = useState("walkin");
  const [billedById, setBilledById] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);

 
const [staffAvailability, setStaffAvailability] = useState([]);

  // const [appointmentDate, setAppointmentDate] = useState(() => {
  //   const now = new Date();
  //   return now.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm (for input type="datetime-local")
  // });

const [appointmentDate, setAppointmentDate] = useState(() => {
  const now = new Date();
  now.setSeconds(0, 0); // remove seconds & ms

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
});



  // New state at top of component
const [selectedOption, setSelectedOption] = useState(""); // "voucher" | "membership" | ""

  // Customer modal
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Staff & payment
  const [staffId, setStaffId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [changeDue, setChangeDue] = useState(null);

  // ===== Membership =====
  const [memberPhone, setMemberPhone] = useState("");
  const [memberInfo, setMemberInfo] = useState(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");

    const [voucherCode, setVoucherCode] = useState("");
  const [voucherServiceId, setVoucherServiceId] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);

const [voucherApplied, setVoucherApplied] = useState(false);

  // NEW: hold all memberships + selection
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);

  const handleMemberSearch = async () => {
    if (!memberPhone.trim()) return;
    setMemberLoading(true);
    setMemberError("");
    setMemberships([]);
    setSelectedMembership(null);
    setMemberInfo(null);
    try {
      const data = await checkMembership(memberPhone.trim());
      if (data.has_membership) {
        setMemberships(data.memberships || []);
      } else {
        setMemberError("No active memberships found.");
      }
    } catch (err) {
      console.error(err);
      setMemberError("Error checking membership.");
    } finally {
      setMemberLoading(false);
    }
  };

  const chooseMembership = (m) => {
    setSelectedMembership(m.id);
    setMemberInfo({
      ...m,
      free_remaining: m.remaining_services,
      plan_name: m.plan_name,
      expires_on: m.expires_on,
      id: m.id,
    });
  };

  // ---------- Load Data ----------
  useEffect(() => {
    fetchProducts().then((res) => {
      if (res?.status) setServices(res.products);
    });
    staff().then((res) => {
      if (res.status) setStaffList(res.staff);
    });
    // allstaff().then((res) => {
    //   if (res.status) allsetStaffList(res.staff);
    // });

    //   advstaff().then((res) => {
    //     console.log("Dd",res);
    //   // if (res.status) allsetStaffList(res.staff);
    // });

      advstaff({ date: appointmentDate }).then((res) => {
    console.log("Dd", res);
    // if (res.status) allsetStaffList(res.staff);
    // if (res.status) setStaffAvailability(res.staff);


    if (res.status) {
        setStaffAvailability(res.staff);
        allsetStaffList(res.staff);
      } else {
        setStaffAvailability([]);
      }
  });

    
  }, [appointmentDate]);

  // ---------- Customer Search ----------
  const searchCustomer = async () => {
    const phone = customerPhone.trim();
    if (!phone) return alert("Enter a phone number");
    try {
      const res = await checkCustomerPhone(phone);
      if (res.exists) {
        setCustomerName(res.customer_name);
        setCustomerPhone(res.customer_phone);
        setSearchResult(res);
        alert(`Customer found: ${res.customer_name}`);
      } else {
        setSearchResult(null);
        alert("No customer found. Enter details to create a new one.");
      }
    } catch (err) {
      console.error("Phone check failed", err);
      alert("Error checking phone number");
    }
  };

  // ---------- Totals ----------
  const filteredServices = useMemo(
    () =>
      services.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [services, searchTerm]
  );

  const totalMinutes = useMemo(
    () => cart.reduce((sum, i) => sum + (i.duration || 0) * i.quantity, 0),
    [cart]
  );

  const itemTotal = useMemo(
    () =>
      cart.reduce(
        (sum, i) => sum + Math.max(0, i.price * i.quantity - (i.discount || 0)),
        0
      ),
    [cart]
  );

  const totalCartServices = useMemo(
    () => cart.reduce((n, i) => n + i.quantity, 0),
    [cart]
  );

  const freeRemainingAfterCart = useMemo(() => {
    if (!memberInfo) return 0;
    const before = memberInfo.free_remaining ?? 0;
    return Math.max(0, before - totalCartServices);
  }, [memberInfo, totalCartServices]);

  const membershipDiscount = useMemo(() => {
    if (!memberInfo || memberInfo.expired) return 0;
    const freeLeft = memberInfo.free_remaining ?? 0;
    if (freeLeft <= 0) return 0;
    const prices = cart
      .flatMap((item) => Array(item.quantity).fill(item.price))
      .sort((a, b) => b - a);
    return prices.slice(0, freeLeft).reduce((sum, p) => sum + p, 0);
  }, [memberInfo, cart]);

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

  const finalTotal = useMemo(
    () => grandTotal + gstAmount,
    [grandTotal, gstAmount]
  );

    // ---------- Voucher handler ----------
  const applyVoucher = () => {
    if (!voucherCode.trim()) return alert("Enter a voucher code");
    // Here you can validate via API if needed
    setVoucherApplied(true);
    setBillDiscount(itemTotal); // make bill zero
    alert(`Voucher "${voucherCode}" applied. Bill set to zero.`);
  };



  // ---------- Cart Helpers ----------
  const addToCart = (service) => {
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

  const updateQuantity = (id, qty) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  const resetAll = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setSearchResult(null);
    setCashReceived("");
    setTransactionNumber("");
    setPaymentMethod("cash");
    setChangeDue(null);
    setStaffId("");
    setBillDiscount(0);
    setGstPercent(0);
    setShowModal(false);
    setMemberInfo(null);
    setMemberPhone("");
    setMemberships([]);
    allsetStaffList([]);
    setSelectedMembership(null);
    setSelectedOption("")
  };

  const handleCheckout = () => setShowModal(true);

  function getStartTime(staffObj) {
    const now = new Date();
    const buffer = staffObj?.free_time ? parseInt(staffObj.free_time, 10) : 0;
    return new Date(now.getTime() + buffer * 60000).toISOString();
  }

  const submitOrder = async (orderPayload) => {
    try {
      const data = await advBilling(orderPayload);

          console.log(data.status);

          // if(data.status==true){
          //      alert("Appointment stored successfully!");
          //   resetAll();

          //     allstaff().then((res) => {
          //           if (res.status) allsetStaffList(res.staff);
          //     });
          //   console.log("Saved:", data);
          // }else if(data.status==false){
          //     alert("Appointment stored successfully!",data.message);
          // }
          
          if (data.status === true) {
              alert("✅ Appointment stored successfully!");
              resetAll();

              allstaff().then((res) => {
                  if (res.status) allsetStaffList(res.staff);
              });
              console.log("Saved:", data);
          } else {
              alert("❌ Failed to store appointment: " + (data.message || "Unknown error"));
          }
     
    } catch (err) {
      console.error("API error:", err);
      alert("Failed to save appointment: " + JSON.stringify(err.errors || err));
    }
  };

  const confirmPayment = () => {
    if (!customerName || !customerPhone) {
      alert("Please enter customer details.");
      return;
    }
    if (!staffId) {
      alert("Please select a staff member.");
      return;
    }

    const selectedStaff = staffList.find((s) => s.id === Number(staffId));
    const billedStaffObj = staffList.find(
      (s) => s.id === Number(billedById)
    );

    const orderPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      staff_id: Number(staffId),
      billed_staff_id: Number(billedById),
      billed_staff_name: billedStaffObj?.name || "",
      staff_name: selectedStaff?.name || "",
      payment_method: paymentMethod,
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
      free_services_used: Math.min(
        memberInfo?.free_remaining || 0,
        totalCartServices
      ),
      grand_total: grandTotal,
      gst_percent: parseFloat(gstPercent) || 0,
      gst_amount: gstAmount,
      final_total: finalTotal,
      total_duration: totalMinutes,
      // start_time: getStartTime(selectedStaff),
      // scheduled_date: new Date(appointmentDate).toISOString(),
       scheduled_date: appointmentDate + ":00",
      customer_source: customerSource,
      membership_id: memberInfo?.id || null,
      voucherCode: voucherCode || null,
      totalCartServices: totalCartServices,
    };

    if (finalTotal > 0) {
      if (paymentMethod === "cash") {
        const cash = parseFloat(cashReceived);
        if (isNaN(cash) || cash < finalTotal) {
          alert("Cash received must be ≥ final total.");
          return;
        }
        orderPayload.cash_received = cash;
        orderPayload.change_due = cash - finalTotal;
        setChangeDue((cash - finalTotal).toFixed(2));
        submitOrder(orderPayload);
      } else {
        if (!transactionNumber) {
          alert("Please enter the transaction/reference number.");
          return;
        }
        orderPayload.transaction_number = transactionNumber;
        submitOrder(orderPayload);
      }
    } else {
      // No amount to collect
      submitOrder(orderPayload);
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== Services ===== */}
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search services…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-xl p-3 text-lg mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                onClick={() => addToCart(srv)}
                className="cursor-pointer bg-white border rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {srv.name}
                  </h3>
                  {srv.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {srv.description}
                    </p>
                  )}
                  {srv.duration && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {srv.duration} Min
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-green-600 text-xl font-bold">
                    ₹ {parseFloat(srv.final_price).toFixed(2)}
                  </span>
                  {parseFloat(srv.discount_percent) > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {srv.discount_percent}% OFF
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredServices.length === 0 && (
              <p className="col-span-full text-gray-500 text-center">
                No services found.
              </p>
            )}
          </div>
        </div>

        {/* ===== Cart ===== */}
        <div className="bg-gray-50 rounded-xl p-5 shadow-md flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Cart</h2>
          {cart.length === 0 && (
            <p className="text-gray-500 mb-4">Cart is empty.</p>
          )}
          <div className="space-y-4 flex-1 overflow-auto">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col bg-white rounded-lg p-3 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      ₹ {item.price.toFixed(2)} 
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="px-2 py-1 border rounded-lg hover:bg-gray-100"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      –
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      className="px-2 py-1 border rounded-lg hover:bg-gray-100"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex justify-between items-center">
                  <label className="text-sm text-gray-600">Item Duration</label>
                  <p>{item.duration * item.quantity} min</p>
                </div>
              </div>
            ))}
          </div>

          {/* Overall bill discount & GST */}
          <div className="mt-4 space-y-2">
            <label className="flex justify-between items-center text-sm">
              <span>Overall Bill Discount ($)</span>
              <input
                type="number"
                min="0"
                className="border rounded p-1 w-24 text-right"
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
              />
            </label>
            <label className="flex justify-between items-center text-sm">
              <span>GST (%)</span>
              <input
                type="number"
                min="0"
                className="border rounded p-1 w-24 text-right"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
              />
            </label>
          </div>

           {/* ===== NEW Voucher Section ===== */}
        

          {/* ===== NEW Voucher Section ===== */}
<div className="mt-4 p-3 border rounded-lg bg-white shadow-sm space-y-2">
  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
    <input
      type="radio"
      name="discountOption"
      value="voucher"
      checked={selectedOption === "voucher"}
      onChange={() => setSelectedOption("voucher")}
    />
    <span>Apply Voucher</span>
  </label>

  <div className="flex space-x-2">
    <input
      type="text"
      placeholder="Voucher code"
      value={voucherCode}
      onChange={(e) => setVoucherCode(e.target.value)}
      className="flex-1 border rounded p-2"
      disabled={selectedOption !== "voucher" || voucherApplied}
    />
    <button
      onClick={applyVoucher}
      disabled={selectedOption !== "voucher" || voucherApplied}
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
    >
      {voucherApplied ? "Applied" : "Apply"}
    </button>
  </div>

  {voucherApplied && (
    <p className="text-green-600 text-sm">
      Voucher applied. Total set to $0.
    </p>
  )}
</div>


          {/* -------- Membership Search -------- */}
      
          {/* -------- Membership Search -------- */}
<div className="mt-4 p-3 border rounded-lg bg-white shadow-sm space-y-2">
  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
    <input
      type="radio"
      name="discountOption"
      value="membership"
      checked={selectedOption === "membership"}
      onChange={() => setSelectedOption("membership")}
    />
    <span>Check Membership</span>
  </label>

  <div className="flex space-x-2">
    <input
      type="text"
      placeholder="Enter phone or email"
      value={memberPhone}
      onChange={(e) => setMemberPhone(e.target.value)}
      className="flex-1 border rounded p-2"
      disabled={selectedOption !== "membership"}
    />
    <button
      onClick={handleMemberSearch}
      disabled={selectedOption !== "membership"}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
    >
      Search
    </button>
  </div>

  {selectedOption === "membership" && memberLoading && (
    <p className="text-sm text-blue-600">Checking…</p>
  )}
  {selectedOption === "membership" && memberError && (
    <p className="text-sm text-red-600">{memberError}</p>
  )}

  {selectedOption === "membership" && memberships.length > 1 && (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-gray-700 font-medium">
        Select a Membership:
      </p>
      {memberships.map((m) => (
        <label
          key={m.id}
          className="flex items-center space-x-2 text-sm text-gray-700"
        >
          <input
            type="radio"
            name="membershipChoice"
            value={m.id}
            checked={selectedMembership === m.id}
            onChange={() => chooseMembership(m)}
          />
          <span>
            {m.plan_name} – exp {new Date(m.expires_on).toLocaleDateString()} (
            {m.remaining_services} free left)
          </span>
        </label>
      ))}
    </div>
  )}

  {selectedOption === "membership" && memberInfo && (
    <div className="text-sm text-green-700 space-y-1 mt-2">
      <p>
        <strong>{memberInfo.plan_name}</strong> plan – expires on{" "}
        {new Date(memberInfo.expires_on).toLocaleDateString()}
      </p>
      <p>Free services remaining: {memberInfo.free_remaining}</p>
      <p>
        After this cart: <strong>{freeRemainingAfterCart}</strong>
      </p>
    </div>
  )}
</div>


          {/* Totals */}
          <div className="mt-6 border-t pt-4 space-y-1">
            <p className="flex justify-between">
              <span>Items Total:</span>
              <span>₹{itemTotal.toFixed(2)}</span>
            </p>
            {membershipDiscount > 0 && (
              <p className="flex justify-between text-green-700">
                <span>Membership Free Services:</span>
                <span>–₹ {membershipDiscount.toFixed(2)}</span>
              </p>
            )}
            {billDiscount > 0 && (
              <p className="flex justify-between text-green-700">
                <span>Bill Discount:</span>
                <span>–₹ {parseFloat(billDiscount).toFixed(2)}</span>
              </p>
            )}
            <p className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span>₹ {grandTotal.toFixed(2)}</span>
            </p>
            {gstAmount > 0 && (
              <p className="flex justify-between">
                <span>GST:</span>
                <span>₹ {gstAmount.toFixed(2)}</span>
              </p>
            )}
            <p className="flex justify-between text-xl font-bold text-gray-800">
              <span>Final Total:</span>
              <span>₹ {finalTotal.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-500">
              Total Duration: {totalMinutes} min
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* ===================== Modal ===================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl relative">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Checkout Details
            </h2>

            {/* Customer Info */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700 text-sm">Customer Name</span>
                <input
                  type="text"
                  className="border rounded p-2 w-full mt-1"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-gray-700 text-sm">Customer Phone</span>
                <div className="flex space-x-2 mt-1">
                  <input
                    type="text"
                    className="border rounded p-2 flex-1"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <button
                    onClick={searchCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
              </label>

                <label className="block">
              <span className="text-gray-700 text-sm">Appointment Date & Time</span>
              <input
                 type="datetime-local"
                className="border rounded p-2 w-full mt-1"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)} // prevent past dates
              />
            </label>

 

              <div className="flex gap-2 border-b">
                {staffAvailability.map((s) => (
                  <button
                    key={s.id}
                   onClick={() => {
                      setSelectedStaff(s);
                      setStaffId(s.id); // 👈 set id here for backend
                    }}
                    className={`px-4 py-2 ${
                      selectedStaff?.id === s.id
                        ? "border-b-2 border-blue-500 font-bold"
                        : "text-gray-600"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedStaff?.slots?.length > 0 ? (
                    selectedStaff.slots.map((slot, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          slot.status === "busy"
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-green-100 text-green-700 border border-green-300"
                        }`}
                      >
                        {slot.from} – {slot.to} {slot.status}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No slots for this staff</p>
                  )}
                </div>





              {/* Staff Selection */}
             {/* <label className="block">
                <span className="text-gray-700 text-sm">Staff sdsd</span>
                <select
                  className="border rounded p-2 w-full mt-1"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">Select staff</option>
                  {allstaffList.map((s) => (
                    <option 
                      key={s.id} 
                      value={s.id} 
                    // 👈 disable if busy
                    >
                      {s.name} – {s.slot} ({s.status})
                    </option>
                  ))}
                </select>
              </label> */}


            

              {/* Billed By */}
              <label className="block">
                <span className="text-gray-700 text-sm">Billed By</span>
                <select
                  className="border rounded p-2 w-full mt-1"
                  value={billedById}
                  onChange={(e) => setBilledById(e.target.value)}
                >
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Only show payment section if finalTotal > 0 */}
              {finalTotal > 0 && (
                <>
                  <label className="block">
                    <span className="text-gray-700 text-sm">Payment Method</span>
                    <select
                      className="border rounded p-2 w-full mt-1"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  {paymentMethod === "cash" && (
                    <label className="block">
                      <span className="text-gray-700 text-sm">Cash Received</span>
                      <input
                        type="number"
                        className="border rounded p-2 w-full mt-1"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                      />
                      {changeDue !== null && (
                        <p className="text-green-600 text-sm mt-1">
                          Change Due: ${changeDue}
                        </p>
                      )}
                    </label>
                  )}

                  {paymentMethod !== "cash" && (
                    <label className="block">
                      <span className="text-gray-700 text-sm">
                        Transaction / Reference #
                      </span>
                      <input
                        type="text"
                        className="border rounded p-2 w-full mt-1"
                        value={transactionNumber}
                        onChange={(e) => setTransactionNumber(e.target.value)}
                      />
                    </label>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
