import { Routes, Route } from "react-router-dom";
import Register from "./components/auth/register";
import Login from "./components/auth/login";
import "./App.css";
import Dashboard from "./components/dashboard/dashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import PaymentSuccess from "./components/payment/success";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/paymentsuccess" element={<PaymentSuccess />} />
    
      
     
    </Routes>
  );
}

export default App;