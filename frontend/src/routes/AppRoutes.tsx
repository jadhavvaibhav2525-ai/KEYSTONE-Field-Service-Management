import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/AdminDashboard";
import Users from "../pages/Users";
import DispatcherDashboard from "../pages/DispatcherDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import TechnicianDashboard from "../pages/TechnicianDashboard";
import CustomerDashboard from "../pages/CustomerDashboard";
import WorkOrders from "../pages/WorkOrders";
import Customers from "../pages/Customers";
import ServiceRequests from "../pages/ServiceRequests";
import SLA from "../pages/SLA";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DEFAULT */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* GENERAL DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER", "MANAGER", "TECHNICIAN", "CUSTOMER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin - Users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Admin - Work Orders */}
        <Route
          path="/admin/work-orders"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <WorkOrders />
            </ProtectedRoute>
          }
        />

        {/* Admin / Dispatcher / Manager - Customers */}
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "DISPATCHER", "MANAGER"]}
            >
              <Customers />
            </ProtectedRoute>
          }
        />

        {/* SLA Management - Admin / Dispatcher / Manager */}
        <Route
          path="/sla"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "DISPATCHER", "MANAGER"]}
            >
              <SLA />
            </ProtectedRoute>
          }
        />

        {/* DISPATCHER */}
        <Route
          path="/dispatcher"
          element={
            <ProtectedRoute allowedRoles={["DISPATCHER"]}>
              <DispatcherDashboard />
            </ProtectedRoute>
          }
        />

        {/* MANAGER */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* TECHNICIAN */}
        <Route
          path="/technician"
          element={
            <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />

        {/* CUSTOMER */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer - Service Requests */}
        <Route
          path="/customer/service-requests"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <ServiceRequests />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;