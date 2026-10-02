import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./AdminDashboard.css";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface WorkOrder {
  id: number;
  status: string;
}

interface Facility {
  id: number;
}

interface Equipment {
  id: number;
  status?: string;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboardData();

    const interval = setInterval(() => {
      void loadDashboardData();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        usersResponse,
        workOrdersResponse,
        facilitiesResponse,
        equipmentResponse,
      ] = await Promise.all([
        api.get("/api/users"),
        api.get("/api/work-orders"),
        api.get("/api/facilities"),
        api.get("/api/equipment"),
      ]);

      setUsers(usersResponse.data);
      setWorkOrders(workOrdersResponse.data);
      setFacilities(facilitiesResponse.data);
      setEquipment(equipmentResponse.data);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      alert("Unable to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const technicianCount = users.filter(
    (user) => user.role === "TECHNICIAN"
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "CUSTOMER"
  ).length;

  const completedWorkOrders = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const activeWorkOrders = workOrders.filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "ASSIGNED" ||
      order.status === "IN_PROGRESS"
  ).length;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__header">
          <h2>Dashboard Overview</h2>
        </div>

        <p className="admin-dashboard__loading">
          Loading dashboard data...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="admin-dashboard__header">
        <h2>Dashboard Overview</h2>

        <p className="admin-dashboard__subtitle">
          Monitor KEYSTONE users, service operations, facilities and
          equipment.
        </p>
      </div>

      {/* SLA Management */}
      <section className="admin-dashboard__sla">
        <div>
          <h3>SLA Management</h3>

          <p>
            Monitor service response and resolution targets.
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard__sla-button"
          onClick={() => navigate("/sla")}
        >
          Open SLA Management
        </button>
      </section>

      {/* Dashboard Statistics */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Total Work Orders</h3>
          <p>{workOrders.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Technicians</h3>
          <p>{technicianCount}</p>
        </div>

        <div className="dashboard-card">
          <h3>Customers</h3>
          <p>{customerCount}</p>
        </div>

        <div className="dashboard-card">
          <h3>Facilities</h3>
          <p>{facilities.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Equipment</h3>
          <p>{equipment.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Completed Orders</h3>
          <p>{completedWorkOrders}</p>
        </div>

        <div className="dashboard-card">
          <h3>Active Orders</h3>
          <p>{activeWorkOrders}</p>
        </div>
      </div>

      {/* System Summary */}
      <section className="admin-dashboard__summary">
        <h3>System Summary</h3>

        <div className="admin-dashboard__summary-grid">
          <p className="admin-dashboard__summary-item">
            <span>Total Users</span>
            <strong>{users.length}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Technicians</span>
            <strong>{technicianCount}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Customers</span>
            <strong>{customerCount}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Total Facilities</span>
            <strong>{facilities.length}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Total Equipment</span>
            <strong>{equipment.length}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Total Work Orders</span>
            <strong>{workOrders.length}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Completed Work Orders</span>
            <strong>{completedWorkOrders}</strong>
          </p>

          <p className="admin-dashboard__summary-item">
            <span>Active Work Orders</span>
            <strong>{activeWorkOrders}</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;