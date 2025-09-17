import React from "react";
import { useSearchParams } from "react-router-dom";


const PaymentSuccess = () => {
  const searchQuery = useSearchParams()[0];
  const referenceNum = searchQuery.get("reference");

  return (
    <div className="container">
      <div className="content">
        <h1 className="heading">Order Successful</h1>
        <p className="text">Reference No. {referenceNum}</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;