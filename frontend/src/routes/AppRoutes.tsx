import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

import AdminDashboard from "../pages/AdminDashboard";
import Users from "../pages/Users";
import Customers from "../pages/Customers";
import WorkOrders from "../pages/WorkOrders";
import AdminServiceRequests from "../pages/AdminServiceRequests";
import TechnicianDashboard from "../pages/TechnicianDashboard";
import DispatcherDashboard from "../pages/DispatcherDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import CustomerDashboard from "../pages/CustomerDashboard";
import ServiceRequests from "../pages/ServiceRequests";
import SLA from "../pages/SLA";

import AdminLayout from "../layouts/AdminLayout";

function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route path="/login" element={<Login />} />


      {/* =====================================================
          DEFAULT / DASHBOARD
      ===================================================== */}

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />


      {/* =====================================================
          ADMIN ROUTES
      ===================================================== */}

      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminLayout>
            <Users />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/customers"
        element={
          <AdminLayout>
            <Customers />
          </AdminLayout>
        }
      />

      {/* ADMIN SERVICE REQUESTS */}

      <Route
        path="/admin/service-requests"
        element={
          <AdminLayout>
            <AdminServiceRequests />
          </AdminLayout>
        }
      />

      {/* ADMIN WORK ORDERS */}

      <Route
        path="/admin/work-orders"
        element={
          <AdminLayout>
            <WorkOrders />
          </AdminLayout>
        }
      />

      {/* ADMIN TECHNICIANS */}

      <Route
        path="/admin/technicians"
        element={
          <AdminLayout>
            <TechnicianDashboard />
          </AdminLayout>
        }
      />

      {/* ADMIN REPORTS */}

      <Route
        path="/admin/reports"
        element={
          <AdminLayout>
            <SLA />
          </AdminLayout>
        }
      />

      {/* ADMIN SETTINGS */}

      <Route
        path="/admin/settings"
        element={
          <AdminLayout>
            <div>
              <h2>Settings</h2>
              <p>Admin settings page.</p>
            </div>
          </AdminLayout>
        }
      />


      {/* =====================================================
          DISPATCHER ROUTE
      ===================================================== */}

      <Route
        path="/dispatcher"
        element={<DispatcherDashboard />}
      />


      {/* =====================================================
          MANAGER ROUTE
      ===================================================== */}

      <Route
        path="/manager"
        element={<ManagerDashboard />}
      />


      {/* =====================================================
          TECHNICIAN ROUTE
      ===================================================== */}

      <Route
        path="/technician"
        element={<TechnicianDashboard />}
      />


      {/* =====================================================
          CUSTOMER ROUTES
      ===================================================== */}

      <Route
        path="/customer"
        element={<CustomerDashboard />}
      />

      <Route
        path="/customer/service-requests"
        element={<ServiceRequests />}
      />


      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default AppRoutes;