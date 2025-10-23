import React, { useEffect } from "react";

const RazorpayPayment = () => {
  // ✅ Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log("✅ Razorpay script loaded successfully");
    };

    script.onerror = () => {
      console.error("❌ Failed to load Razorpay script");
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      // Step 1️⃣: Create order from Laravel API
      const orderResponse = await fetch("http://192.168.29.100:8000/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500 }), // ₹500
      });

      const orderData = await orderResponse.json();
      console.log("Order Response:", orderData);

      if (!orderData.status) {
        alert("Failed to create order: " + orderData.message);
        return;
      }

      // Step 2️⃣: Ensure Razorpay is loaded
      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded. Please refresh the page.");
        return;
      }

      // Step 3️⃣: Create payment options
      const options = {
        key: orderData.data?.key || orderData.key,
        amount: orderData.data?.amount || orderData.amount,
        currency: orderData.data?.currency || orderData.currency,
        name: "RayFog Business Solutions",
        description: "Payment Test",
        order_id: orderData.data?.order_id || orderData.order_id,
        handler: async function (response) {
          console.log("Payment Success:", response);

          // Verify payment
        //   const verifyRes = await fetch("http://127.0.0.1:8000/api/razorpay/verify", {
          const verifyRes = await fetch("http://192.168.29.100:8000/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.status) {
            alert("✅ Payment successful and verified!");
          } else {
            alert("❌ Payment verification failed!");
          }
        },
        prefill: {
          name: "Asif Developer",
          email: "asif@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#0d6efd",
        },
      };

      // Step 4️⃣: Open Razorpay popup
      const rzp = new window.Razorpay(options);
      rzp.open();

      // Step 5️⃣: Handle payment failure
      rzp.on("payment.failed", function (response) {
        alert("❌ Payment failed: " + response.error.description);
      });
    } catch (error) {
      console.error("Error in payment:", error);
      alert("Something went wrong while processing payment!");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <h2>Razorpay Payment Integration</h2>
      <p>Click below to pay ₹500 using Razorpay</p>
      <button
        onClick={handlePayment}
        style={{
          backgroundColor: "#0d6efd",
          color: "#fff",
          border: "none",
          padding: "12px 24px",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Pay ₹500 Now
      </button>
    </div>
  );
};

export default RazorpayPayment;
