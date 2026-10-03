import { useEffect, useState } from "react";
import api from "../api/axios";

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  location: string;
  customerId?: number;
  facilityId?: number;
  equipmentId?: number;
  status: string;
  priority: string;
  technicianId?: number | null;
  scheduledDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] =
    useState<WorkOrder | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [priority, setPriority] = useState("MEDIUM");
  const [technicianId, setTechnicianId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Fetch work orders and technicians
  const fetchData = async () => {
    try {
      setError("");

      const [workOrdersResponse, usersResponse] =
        await Promise.all([
          api.get("/api/work-orders"),
          api.get("/api/users"),
        ]);

      setWorkOrders(workOrdersResponse.data);

      const technicianUsers = usersResponse.data.filter(
        (user: User) => user.role === "TECHNICIAN"
      );

      setTechnicians(technicianUsers);
    } catch (err) {
      console.error("Error loading work orders:", err);
      setError("Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Technician name
  const getTechnicianName = (
    technicianId?: number | null
  ) => {
    if (!technicianId) {
      return "Not Assigned";
    }

    const technician = technicians.find(
      (user) => user.id === technicianId
    );

    return technician
      ? technician.name
      : `Technician #${technicianId}`;
  };

  // Create work order
  const handleCreateWorkOrder = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/api/work-orders", {
        title,
        description,
        customerName,
        customerEmail,
        customerPhone,
        location,
        status,
        priority,
        technicianId: technicianId
          ? Number(technicianId)
          : null,
        scheduledDate: scheduledDate
          ? scheduledDate
          : null,
      });

      alert("Work order created successfully.");

      resetForm();
      await fetchData();
    } catch (err) {
      console.error(err);
      setError("Unable to create work order.");
    } finally {
      setSaving(false);
    }
  };

  // Edit
  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);

    setTitle(workOrder.title);
    setDescription(workOrder.description || "");
    setCustomerName(workOrder.customerName);
    setCustomerEmail(workOrder.customerEmail || "");
    setCustomerPhone(workOrder.customerPhone || "");
    setLocation(workOrder.location || "");
    setStatus(workOrder.status);
    setPriority(workOrder.priority);

    setTechnicianId(
      workOrder.technicianId
        ? String(workOrder.technicianId)
        : ""
    );

    setScheduledDate(
      workOrder.scheduledDate
        ? workOrder.scheduledDate.substring(0, 16)
        : ""
    );

    setShowForm(true);
    setError("");
  };

  // Update
  const handleUpdateWorkOrder = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!editingWorkOrder) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/api/work-orders/${editingWorkOrder.id}`,
        {
          title,
          description,
          customerName,
          customerEmail,
          customerPhone,
          location,
          status,
          priority,
          technicianId: technicianId
            ? Number(technicianId)
            : null,
          scheduledDate: scheduledDate
            ? scheduledDate
            : null,
        }
      );

      alert("Work order updated successfully.");

      resetForm();
      await fetchData();
    } catch (err) {
      console.error(err);
      setError("Unable to update work order.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (
    workOrder: WorkOrder
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete work order "${workOrder.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/api/work-orders/${workOrder.id}`
      );

      alert("Work order deleted successfully.");

      await fetchData();
    } catch (err) {
      console.error(err);
      setError("Unable to delete work order.");
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setLocation("");
    setStatus("PENDING");
    setPriority("MEDIUM");
    setTechnicianId("");
    setScheduledDate("");

    setEditingWorkOrder(null);
    setShowForm(false);
  };

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(
    (workOrder) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        workOrder.title
          .toLowerCase()
          .includes(searchText) ||
        workOrder.customerName
          .toLowerCase()
          .includes(searchText) ||
        workOrder.location
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        workOrder.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        workOrder.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    }
  );
  // Summary counts
  const pendingCount = workOrders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const assignedCount = workOrders.filter(
    (order) => order.status === "ASSIGNED"
  ).length;

  const inProgressCount = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completedCount = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const urgentCount = workOrders.filter(
    (order) => order.priority === "URGENT"
  ).length;

  return (
    <div className="work-orders-page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2>Work Order Management</h2>

          <p style={{ color: "#666" }}>
            Manage KEYSTONE service requests and work orders.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingWorkOrder(null);
            }
          }}
          style={primaryButtonStyle}
        >
          {showForm
            ? "Cancel"
            : "+ Create Work Order"}
        </button>
      </div>

      {/* Summary Cards */}
      <div
        className="work-orders-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <SummaryCard
          title="Total"
          value={workOrders.length}
        />

        <SummaryCard
          title="Pending"
          value={pendingCount}
        />

        <SummaryCard
          title="Assigned"
          value={assignedCount}
        />

        <SummaryCard
          title="In Progress"
          value={inProgressCount}
        />

        <SummaryCard
          title="Completed"
          value={completedCount}
        />

        <SummaryCard
          title="Urgent"
          value={urgentCount}
        />
      </div>

      {/* Form */}
      {showForm && (
        <div
          className="dashboard-card"
          style={{
            marginBottom: "25px",
            padding: "25px",
          }}
        >
          <h3>
            {editingWorkOrder
              ? "Edit Work Order"
              : "Create New Work Order"}
          </h3>

          <form
            onSubmit={
              editingWorkOrder
                ? handleUpdateWorkOrder
                : handleCreateWorkOrder
            }
            style={{ marginTop: "20px" }}
          >
            <div style={formGroupStyle}>
              <label>Title</label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
                placeholder="Service title"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label>Description</label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={4}
                placeholder="Describe the service request"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label>Customer Name</label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                required
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label>Customer Email</label>

              <input
                type="email"
                value={customerEmail}
                onChange={(e) =>
                  setCustomerEmail(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label>Customer Phone</label>

              <input
                type="text"
                value={customerPhone}
                onChange={(e) =>
                  setCustomerPhone(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label>Location</label>

              <input
                type="text"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label>Status</label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                style={inputStyle}
              >
                <option value="PENDING">
                  PENDING
                </option>
                <option value="ASSIGNED">
                  ASSIGNED
                </option>
                <option value="IN_PROGRESS">
                  IN PROGRESS
                </option>
                <option value="COMPLETED">
                  COMPLETED
                </option>
                <option value="CANCELLED">
                  CANCELLED
                </option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label>Priority</label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value)
                }
                style={inputStyle}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Technician */}
            <div style={formGroupStyle}>
              <label>Assign Technician</label>

              <select
                value={technicianId}
                onChange={(e) =>
                  setTechnicianId(e.target.value)
                }
                style={inputStyle}
              >
                <option value="">
                  Not Assigned
                </option>

                {technicians.map((technician) => (
                  <option
                    key={technician.id}
                    value={technician.id}
                  >
                    {technician.name} —{" "}
                    {technician.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label>Scheduled Date</label>

              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) =>
                  setScheduledDate(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                opacity: saving ? 0.6 : 1,
                marginRight: "10px",
              }}
            >
              {saving
                ? "Saving..."
                : editingWorkOrder
                ? "Update Work Order"
                : "Create Work Order"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "12px 15px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div
        className="dashboard-card"
        style={{
          marginBottom: "20px",
          padding: "20px",
        }}
      >
        <h3>Search & Filter Work Orders</h3>

        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            marginTop: "15px",
          }}
        >
          <input
            type="text"
            placeholder="Search title, customer or location..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              ...inputStyle,
              width: "300px",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              ...inputStyle,
              width: "200px",
            }}
          >
            <option value="ALL">
              All Statuses
            </option>
            <option value="PENDING">
              PENDING
            </option>
            <option value="ASSIGNED">
              ASSIGNED
            </option>
            <option value="IN_PROGRESS">
              IN PROGRESS
            </option>
            <option value="COMPLETED">
              COMPLETED
            </option>
            <option value="CANCELLED">
              CANCELLED
            </option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value)
            }
            style={{
              ...inputStyle,
              width: "200px",
            }}
          >
            <option value="ALL">
              All Priorities
            </option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">
              MEDIUM
            </option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">
              URGENT
            </option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
            }}
            style={secondaryButtonStyle}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p>Loading work orders...</p>
      )}

      {/* Table */}
      {!loading && (
        <div
          className="dashboard-card"
          style={{
            padding: "25px",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
            }}
          >
            <h3>All Work Orders</h3>

            <span style={{ color: "#666" }}>
              Showing {filteredWorkOrders.length} of{" "}
              {workOrders.length}
            </span>
          </div>

          {filteredWorkOrders.length === 0 ? (
            <p>
              No work orders match your filters.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1200px",
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>
                    ID
                  </th>

                  <th style={tableHeaderStyle}>
                    Service
                  </th>

                  <th style={tableHeaderStyle}>
                    Customer
                  </th>

                  <th style={tableHeaderStyle}>
                    Location
                  </th>

                  <th style={tableHeaderStyle}>
                    Priority
                  </th>

                  <th style={tableHeaderStyle}>
                    Technician
                  </th>

                  <th style={tableHeaderStyle}>
                    Scheduled
                  </th>

                  <th style={tableHeaderStyle}>
                    Status
                  </th>

                  <th style={tableHeaderStyle}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredWorkOrders.map(
                  (workOrder) => (
                    <tr key={workOrder.id}>
                      <td style={tableCellStyle}>
                        {workOrder.id}
                      </td>

                      <td style={tableCellStyle}>
                        <strong>
                          {workOrder.title}
                        </strong>

                        {workOrder.description && (
                          <>
                            <br />
                            <small>
                              {workOrder.description}
                            </small>
                          </>
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        <strong>
                          {workOrder.customerName}
                        </strong>

                        {workOrder.customerEmail && (
                          <>
                            <br />
                            <small>
                              {workOrder.customerEmail}
                            </small>
                          </>
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        {workOrder.location ||
                          "-"}
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            fontWeight: "bold",
                          }}
                        >
                          {workOrder.priority}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        {getTechnicianName(
                          workOrder.technicianId
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        {workOrder.scheduledDate
                          ? new Date(
                              workOrder.scheduledDate
                            ).toLocaleString()
                          : "Not Scheduled"}
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            padding: "5px 9px",
                            borderRadius: "5px",
                            fontWeight: "bold",
                            fontSize: "12px",
                            backgroundColor:
                              workOrder.status ===
                              "COMPLETED"
                                ? "#d4edda"
                                : workOrder.status ===
                                  "IN_PROGRESS"
                                ? "#fff3cd"
                                : workOrder.status ===
                                  "ASSIGNED"
                                ? "#cce5ff"
                                : workOrder.status ===
                                  "CANCELLED"
                                ? "#f8d7da"
                                : "#eee",
                          }}
                        >
                          {workOrder.status}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        <button
                          onClick={() =>
                            handleEdit(
                              workOrder
                            )
                          }
                          style={{
                            ...actionButtonStyle,
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              workOrder
                            )
                          }
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div style={summaryCardStyle}>
      <h4>{title}</h4>

      <p
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          margin: "8px 0 0",
        }}
      >
        {value}
      </p>
    </div>
    
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "#2563eb",
  color: "white",
  fontSize: "14px",
  fontWeight: "bold",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "white",
  color: "#333",
  fontSize: "14px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "white",
  padding: "18px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "15px",
  display: "flex",
  flexDirection: "column",
  maxWidth: "400px",
  gap: "6px",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};

const tableHeaderStyle = {
  padding: "12px",
  textAlign: "left" as const,
  borderBottom: "2px solid #ddd",
  whiteSpace: "nowrap" as const,
};

const tableCellStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top" as const,
};

const actionButtonStyle: React.CSSProperties = {
  padding: "7px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "7px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  backgroundColor: "#dc3545",
  color: "white",
};

export default WorkOrders;


