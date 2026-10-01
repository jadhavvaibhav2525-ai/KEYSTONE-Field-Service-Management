import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./CustomerDashboard.css";

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  location: string;
  customerId: number | null;
  facilityId: number | null;
  equipmentId: number | null;
  status: string;
  priority: string;
  technicianId: number | null;
  scheduledDate: string | null;
  createdAt: string;
}

interface CustomerUser {
  name?: string;
  email?: string;
  role?: string;
}

function CustomerDashboard() {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let user: CustomerUser | null = null;

  try {
    const userData = localStorage.getItem("user");
    user = userData ? JSON.parse(userData) : null;
  } catch {
    user = null;
  }

  const customerName = user?.name || "Customer";

  // Load work orders belonging to the authenticated customer
  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<WorkOrder[]>(
        "/api/work-orders/customer/me"
      );

      setWorkOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load customer work orders:", err);
      setError("Unable to load your work orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWorkOrders();
  }, [fetchWorkOrders]);

  // Dashboard statistics
  const pendingCount = workOrders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const inProgressCount = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completedCount = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Open service requests page
  const handleCreateServiceRequest = () => {
    navigate("/customer/service-requests");
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not scheduled";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not scheduled";
    }

    return parsedDate.toLocaleString();
  };

  const getStatusClass = (status: string) => {
    return status.toLowerCase().replaceAll("_", "-");
  };

  const getPriorityClass = (priority: string) => {
    return priority.toLowerCase();
  };

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <header className="customer-header">
        <div className="customer-brand">
          <div className="customer-brand-name">KEYSTONE</div>
          <div className="customer-brand-subtitle">Customer Portal</div>
        </div>

        <div className="customer-header-actions">
          <div className="customer-user-info">
            <span className="customer-avatar">
              {customerName.charAt(0).toUpperCase()}
            </span>

            <div className="customer-user-text">
              <strong>{customerName}</strong>
              <span>{user?.email || "Customer account"}</span>
            </div>
          </div>

          <button
            className="customer-logout-button"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="customer-main">
        <section className="customer-welcome-section">
          <div>
            <p className="customer-eyebrow">CUSTOMER OVERVIEW</p>
            <h1>Welcome, {customerName}</h1>
            <p className="customer-welcome-description">
              Manage your service requests and track your work orders.
            </p>
          </div>

          <button
            className="customer-primary-button"
            onClick={handleCreateServiceRequest}
            type="button"
          >
            <span aria-hidden="true">+</span>
            Create Service Request
          </button>
        </section>

        {/* Error message */}
        {error && (
          <div className="customer-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void fetchWorkOrders()}>
              Retry
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="customer-statistics">
          <article className="customer-stat-card">
            <div className="customer-stat-icon total-icon">▤</div>
            <div>
              <p>Total Work Orders</p>
              <h2>{workOrders.length}</h2>
            </div>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon pending-icon">◷</div>
            <div>
              <p>Pending</p>
              <h2>{pendingCount}</h2>
            </div>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon progress-icon">↻</div>
            <div>
              <p>In Progress</p>
              <h2>{inProgressCount}</h2>
            </div>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon completed-icon">✓</div>
            <div>
              <p>Completed</p>
              <h2>{completedCount}</h2>
            </div>
          </article>
        </section>

        {/* Profile */}
        <section className="customer-panel customer-profile-panel">
          <div className="customer-panel-heading">
            <div>
              <h2>My Profile</h2>
              <p>Your account information</p>
            </div>
            <span className="customer-profile-badge">Customer</span>
          </div>

          <div className="customer-profile-grid">
            <div className="customer-profile-field">
              <span>Name</span>
              <strong>{user?.name || "-"}</strong>
            </div>

            <div className="customer-profile-field">
              <span>Email Address</span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div className="customer-profile-field">
              <span>Account Role</span>
              <strong>{user?.role || "CUSTOMER"}</strong>
            </div>
          </div>
        </section>

        {/* Work orders */}
        <section className="customer-panel customer-workorders-panel">
          <div className="customer-panel-heading">
            <div>
              <h2>My Work Orders</h2>
              <p>View the status and schedule of your maintenance work.</p>
            </div>

            <button
              className="customer-refresh-button"
              type="button"
              onClick={() => void fetchWorkOrders()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="customer-loading">
              <span className="customer-spinner" />
              <p>Loading your work orders...</p>
            </div>
          ) : workOrders.length === 0 ? (
            <div className="customer-empty-state">
              <div className="customer-empty-icon">▤</div>
              <h3>No work orders yet</h3>
              <p>
                When work orders are created for your account, they will appear
                here.
              </p>
              <button
                className="customer-primary-button"
                onClick={handleCreateServiceRequest}
                type="button"
              >
                Create Service Request
              </button>
            </div>
          ) : (
            <div className="customer-table-wrapper">
              <table className="customer-workorders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>Facility</th>
                    <th>Equipment</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Scheduled Date</th>
                  </tr>
                </thead>

                <tbody>
                  {workOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="customer-order-id">#{order.id}</td>
                      <td className="customer-service-title">
                        {order.title || "Service"}
                      </td>
                      <td>
                        {order.facilityId
                          ? `Facility #${order.facilityId}`
                          : "-"}
                      </td>
                      <td>
                        {order.equipmentId
                          ? `Equipment #${order.equipmentId}`
                          : "-"}
                      </td>
                      <td>{order.location || "-"}</td>
                      <td>
                        <span
                          className={`customer-priority-badge ${getPriorityClass(
                            order.priority || "normal"
                          )}`}
                        >
                          {order.priority || "NORMAL"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`customer-status-badge ${getStatusClass(
                            order.status || "pending"
                          )}`}
                        >
                          {(order.status || "PENDING").replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{formatDate(order.scheduledDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="customer-footer">
          KEYSTONE Customer Portal
        </footer>
      </main>
    </div>
  );
}

export default CustomerDashboard;