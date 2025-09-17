import React from "react";
import Card from "./card";

const Home = () => {
  const checkoutHandler = async (amount) => {
    try {
      // 1) Get key
      const keyRes = await fetch("http://localhost:5001/api/getkey");
      if (!keyRes.ok) {
        const txt = await keyRes.text();
        throw new Error(`Failed to fetch key: ${keyRes.status} ${txt}`);
      }
      const { key } = await keyRes.json();

      // 2) Create order — include returnUrl (only pathname)
      const payload = {
        amount,
        returnUrl: window.location.pathname // e.g. "/dashboard" or "/admin/dashboard"
      };

      const orderRes = await fetch("http://localhost:5001/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!orderRes.ok) {
        let errBody;
        try {
          errBody = await orderRes.json();
        } catch (e) {
          errBody = await orderRes.text();
        }
        throw new Error(`Failed to create order: ${orderRes.status} ${JSON.stringify(errBody)}`);
      }

      const { order } = await orderRes.json();

      // 3) Prepare Razorpay options
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Add <script src=\"https://checkout.razorpay.com/v1/checkout.js\"></script> to your index.html");
      }

      const options = {
        key,
        amount: order.amount,
        currency: "INR",
        name: "Assignment-1",
        description: "Payment Integration",
        image: "", // optional
        order_id: order.id,
        callback_url: "http://localhost:5001/api/paymentverification", // backend verification route
        prefill: {
          name: "Amit Sharma",
          email: "amitsh198@gmail.com",
          contact: "9900000000",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#400d0dff",
        },
      };

      // 4) Open checkout
      const razor = new window.Razorpay(options);
      razor.open();
    } catch (err) {
      console.error("checkoutHandler error:", err);
      const msg = err?.message || "Checkout failed: Network or server error";
      alert(msg);
    }
  };

  return (
    <>
      <Card
        amount={25}
        img={"https://indianhobbyclub.com/wp-content/uploads/2023/04/q1-3.jpg"}
        checkoutHandler={checkoutHandler}
      />
      
    </>
  );
};

export default Home;


// import React from "react";
// import Card from "./card";

// const Home = () => {
//   const checkoutHandler = async (amount) => {
//     try {
//       // 1) Get key
//       const keyRes = await fetch("http://localhost:5001/api/getkey");
//       if (!keyRes.ok) {
//         const txt = await keyRes.text();
//         throw new Error(`Failed to fetch key: ${keyRes.status} ${txt}`);
//       }
//       const { key } = await keyRes.json();

//       // 2) Create order
//       const orderRes = await fetch("http://localhost:5001/api/checkout", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount }),
//       });
//       if (!orderRes.ok) {
//         // try to get JSON error, fallback to text
//         let errBody;
//         try {
//           errBody = await orderRes.json();
//         } catch (e) {
//           errBody = await orderRes.text();
//         }
//         throw new Error(`Failed to create order: ${orderRes.status} ${JSON.stringify(errBody)}`);
//       }
//       const { order } = await orderRes.json();

//       // 3) Prepare Razorpay options
//       if (!window.Razorpay) {
//         throw new Error("Razorpay SDK not loaded. Add <script src=\"https://checkout.razorpay.com/v1/checkout.js\"></script> to your index.html");
//       }

//       const options = {
//         key,
//         amount: order.amount,
//         currency: "INR",
//         name: "Assignment-1",
//         description: "Payment Integration",
//         image: " ",
//         order_id: order.id,
//         callback_url: "http://localhost:5001/api/paymentverification",
//         prefill: {
//           name: "Amit Sharma",
//           email: "amitsh198@gmail.com",
//           contact: "9900000000",
//         },
//         notes: {
//           address: "Razorpay Corporate Office",
//         },
//         theme: {
//           color: "#400d0dff",
//         },
//       };

//       // 4) Open checkout
//       const razor = new window.Razorpay(options);
//       razor.open();
//     } catch (err) {
//       console.error("checkoutHandler error:", err);
//       // show useful message to user
//       const msg = err?.message || "Checkout failed: Network or server error";
//       alert(msg);
//     }
//   };

//   return (
//     <>
//       <Card
//         amount={25}
//         img={"https://indianhobbyclub.com/wp-content/uploads/2023/04/q1-3.jpg"}
//         checkoutHandler={checkoutHandler}
//       />
//     </>
//   );
// };

// export default Home;