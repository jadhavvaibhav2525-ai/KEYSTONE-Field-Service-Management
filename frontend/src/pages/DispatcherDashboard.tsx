import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import api from "../api/axios";
import "./DispatcherDashboard.css";

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  location: string;
  status: string;
  priority: string;
  technicianId: number | null;
  scheduledDate: string | null;
}

interface Technician {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ServiceRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  facilityId?: number;
  equipmentId?: number;
  problemDescription: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  technicianId?: number;
  technicianName?: string;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceReport {
  id: number;
  workOrderId: number;
  technicianId: number;
  workPerformed?: string;
  technicianRemarks?: string;
  partsUsed?: string;
  issuesFound?: string;
  serviceDurationMinutes?: number;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StatCardProps {
  title: string;
  value: number;
}

interface StatusBadgeProps {
  status: string;
}

interface PriorityBadgeProps {
  priority: string;
}

function DispatcherDashboard() {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceRequestLoading, setServiceRequestLoading] = useState(true);
  const [assigningServiceRequestId, setAssigningServiceRequestId] =
    useState<number | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [technicianFilter, setTechnicianFilter] = useState("ALL");

  const [serviceRequestTechnicians, setServiceRequestTechnicians] =
    useState<Record<number, string>>({});

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [technicianId, setTechnicianId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(
    null
  );
  const [selectedReportWorkOrder, setSelectedReportWorkOrder] =
    useState<WorkOrder | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setServiceRequestLoading(true);
      setError("");

      const [workOrderResponse, serviceRequestResponse, userResponse] =
        await Promise.all([
          api.get("/api/work-orders"),
          api.get("/api/service-requests"),
          api.get("/api/users"),
        ]);

      setWorkOrders(workOrderResponse.data);
      setServiceRequests(serviceRequestResponse.data);

      const technicianUsers = userResponse.data.filter(
        (item: Technician) => item.role === "TECHNICIAN"
      );

      setTechnicians(technicianUsers);

      const initialAssignments: Record<number, string> = {};

      serviceRequestResponse.data.forEach((request: ServiceRequest) => {
        if (request.technicianId) {
          initialAssignments[request.id] = String(request.technicianId);
        }
      });

      setServiceRequestTechnicians(initialAssignments);
    } catch (err) {
      console.error(err);
      setError("Unable to load dispatcher data.");
    } finally {
      setLoading(false);
      setServiceRequestLoading(false);
    }
  };

  const getTechnicianName = (id: number | null) => {
    if (!id) return "Not Assigned";

    const technician = technicians.find((item) => item.id === id);
    return technician ? technician.name : `ID ${id}`;
  };

  const getTechnicianEmail = (id: number | null) => {
    if (!id) return "-";

    const technician = technicians.find((item) => item.id === id);
    return technician?.email || "-";
  };

  const assignServiceRequest = async (request: ServiceRequest) => {
    const selectedTechnicianId = serviceRequestTechnicians[request.id];

    if (!selectedTechnicianId) {
      setError(
        `Please select a technician for Service Request #${request.id}.`
      );
      return;
    }

    const technician = technicians.find(
      (item) => item.id === Number(selectedTechnicianId)
    );

    if (!technician) {
      setError("Selected technician was not found.");
      return;
    }

    try {
      setAssigningServiceRequestId(request.id);
      setError("");

      await api.put(`/api/service-requests/${request.id}/assign`, {
        technicianId: technician.id,
        technicianName: technician.name,
      });

      alert(
        `Technician ${technician.name} assigned to Service Request #${request.id}.`
      );

      await loadData();
    } catch (err) {
      console.error("Unable to assign service request:", err);
      setError("Unable to assign technician to the service request.");
    } finally {
      setAssigningServiceRequestId(null);
    }
  };

  const viewServiceReport = async (order: WorkOrder) => {
    try {
      setSelectedReportWorkOrder(order);
      setSelectedReport(null);
      setReportError("");
      setReportLoading(true);
      setShowReportModal(true);

      const response = await api.get(
        `/api/service-reports/work-order/${order.id}`
      );

      if (response.data) {
        setSelectedReport(response.data);
      } else {
        setReportError(
          "No service report has been submitted for this work order."
        );
      }
    } catch (err) {
      console.error("Error loading service report:", err);
      setReportError("Unable to load the service report.");
    } finally {
      setReportLoading(false);
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
    setSelectedReportWorkOrder(null);
    setReportError("");
  };

  const downloadServiceReportPDF = () => {
    if (!selectedReport) {
      alert("Service report is not available.");
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("KEYSTONE", margin, y);

    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Field Service Management Platform", margin, y);

    y += 10;
    pdf.setDrawColor(180);
    pdf.line(margin, y, pageWidth - margin, y);

    y += 12;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("SERVICE REPORT", margin, y);

    y += 12;

    const checkPage = () => {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }
    };

    const addField = (label: string, value: string) => {
      checkPage();

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(label, margin, y);

      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const lines = pdf.splitTextToSize(value || "Not provided", contentWidth);
      pdf.text(lines, margin, y);

      y += lines.length * 5 + 6;
      checkPage();
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Work Order Information", margin, y);
    y += 8;

    addField("Work Order ID:", `#${selectedReport.workOrderId}`);
    addField("Service:", selectedReportWorkOrder?.title || "N/A");
    addField("Description:", selectedReportWorkOrder?.description || "N/A");
    addField("Customer:", selectedReportWorkOrder?.customerName || "N/A");
    addField("Customer Email:", selectedReportWorkOrder?.customerEmail || "N/A");
    addField("Customer Phone:", selectedReportWorkOrder?.customerPhone || "N/A");
    addField("Location:", selectedReportWorkOrder?.location || "N/A");
    addField("Priority:", selectedReportWorkOrder?.priority || "N/A");
    addField("Status:", selectedReportWorkOrder?.status || "N/A");
    addField(
      "Technician:",
      getTechnicianName(selectedReport.technicianId)
    );
    addField("Technician ID:", String(selectedReport.technicianId));

    checkPage();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Service Details", margin, y);
    y += 8;

    addField(
      "Work Performed:",
      selectedReport.workPerformed || "No information provided."
    );
    addField(
      "Technician Remarks:",
      selectedReport.technicianRemarks || "No remarks provided."
    );
    addField(
      "Issues Found:",
      selectedReport.issuesFound || "No issues reported."
    );
    addField("Parts Used:", selectedReport.partsUsed || "No parts recorded.");
    addField(
      "Service Duration:",
      selectedReport.serviceDurationMinutes !== undefined
        ? `${selectedReport.serviceDurationMinutes} minutes`
        : "Not specified"
    );
    addField(
      "Scheduled Date:",
      selectedReportWorkOrder?.scheduledDate
        ? new Date(selectedReportWorkOrder.scheduledDate).toLocaleString()
        : "Not scheduled"
    );
    addField(
      "Completed At:",
      selectedReport.completedAt
        ? new Date(selectedReport.completedAt).toLocaleString()
        : "Not specified"
    );
    addField(
      "Report Created:",
      selectedReport.createdAt
        ? new Date(selectedReport.createdAt).toLocaleString()
        : "Not specified"
    );
    addField(
      "Last Updated:",
      selectedReport.updatedAt
        ? new Date(selectedReport.updatedAt).toLocaleString()
        : "Not specified"
    );

    pdf.setDrawColor(180);
    pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "Generated by KEYSTONE Field Service Management Platform",
      margin,
      pageHeight - 12
    );
    pdf.text(
      `Work Order #${selectedReport.workOrderId}`,
      pageWidth - margin - 45,
      pageHeight - 12
    );

    pdf.save(
      `KEYSTONE_Service_Report_${selectedReport.workOrderId}.pdf`
    );
  };

  const filteredWorkOrders = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return workOrders.filter((order) => {
      const matchesSearch =
        !searchText ||
        order.title.toLowerCase().includes(searchText) ||
        order.customerName.toLowerCase().includes(searchText) ||
        order.location.toLowerCase().includes(searchText) ||
        order.description.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || order.priority === priorityFilter;

      const matchesTechnician =
        technicianFilter === "ALL" ||
        String(order.technicianId) === technicianFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesTechnician
      );
    });
  }, [
    workOrders,
    search,
    statusFilter,
    priorityFilter,
    technicianFilter,
  ]);

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

  const openAssign = (order: WorkOrder) => {
    setSelectedOrder(order);
    setTechnicianId(order.technicianId ? String(order.technicianId) : "");
    setScheduledDate(
      order.scheduledDate ? order.scheduledDate.substring(0, 16) : ""
    );
    setError("");
  };

  const closeAssign = () => {
    setSelectedOrder(null);
    setTechnicianId("");
    setScheduledDate("");
  };

  const saveAssignment = async () => {
    if (!selectedOrder) return;

    if (!technicianId) {
      setError("Please select a technician.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(`/api/work-orders/${selectedOrder.id}`, {
        title: selectedOrder.title,
        description: selectedOrder.description,
        customerName: selectedOrder.customerName,
        customerEmail: selectedOrder.customerEmail,
        customerPhone: selectedOrder.customerPhone,
        location: selectedOrder.location,
        status: "ASSIGNED",
        priority: selectedOrder.priority,
        technicianId: Number(technicianId),
        scheduledDate: scheduledDate || null,
      });

      alert("Technician assigned successfully.");
      closeAssign();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to assign technician.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (order: WorkOrder, status: string) => {
    try {
      setSaving(true);
      setError("");

      await api.put(`/api/work-orders/${order.id}`, {
        title: order.title,
        description: order.description,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        location: order.location,
        status,
        priority: order.priority,
        technicianId: order.technicianId,
        scheduledDate: order.scheduledDate,
      });

      alert("Status updated successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to update status.");
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTechnicianFilter("ALL");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dispatcher-page" style={pageStyle}>
      {/* HEADER */}
      <header className="dispatcher-header" style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>KEYSTONE</h2>
          <p style={subtitleStyle}>Dispatcher Portal</p>
        </div>

        <div className="dispatcher-header-right" style={headerRightStyle}>
          <div>
            <strong>{user?.name || "Dispatcher"}</strong>
            <div style={roleTextStyle}>DISPATCHER</div>
          </div>

          <button onClick={logout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="dispatcher-main" style={mainStyle}>
        <h1>Welcome, {user?.name || "Dispatcher"}</h1>

        <p style={descriptionStyle}>
          Manage work orders, assign technicians and monitor service progress.
        </p>

        {error && (
          <div className="dispatcher-error" style={errorStyle}>
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <div className="dispatcher-stats-grid" style={statsGridStyle}>
          <StatCard title="Total" value={workOrders.length} />
          <StatCard title="Pending" value={pendingCount} />
          <StatCard title="Assigned" value={assignedCount} />
          <StatCard title="In Progress" value={inProgressCount} />
          <StatCard title="Completed" value={completedCount} />
          <StatCard title="Urgent" value={urgentCount} />
        </div>

        {/* AVAILABLE TECHNICIANS */}
        <section className="dispatcher-section" style={sectionStyle}>
          <div
            className="dispatcher-section-header"
            style={sectionHeaderStyle}
          >
            <div>
              <h2 style={{ marginBottom: "5px" }}>
                Available Technicians
              </h2>
              <p style={mutedTextStyle}>
                Technicians available for work order assignment
              </p>
            </div>

            <div className="dispatcher-count" style={technicianCountStyle}>
              {technicians.length} Technicians
            </div>
          </div>

          {technicians.length === 0 ? (
            <p>No technicians found.</p>
          ) : (
            <div className="dispatcher-table-wrapper" style={tableWrapperStyle}>
              <table className="dispatcher-table" style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Technician</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Assigned Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((technician) => {
                    const assignedOrders = workOrders.filter(
                      (order) =>
                        order.technicianId === technician.id &&
                        order.status !== "COMPLETED"
                    ).length;

                    return (
                      <tr key={technician.id}>
                        <td style={tdStyle}>{technician.id}</td>
                        <td style={tdStyle}>
                          <strong>{technician.name}</strong>
                        </td>
                        <td style={tdStyle}>{technician.email}</td>
                        <td style={tdStyle}>
                          <span className="dispatcher-order-count" style={badgeStyle}>
                            {assignedOrders}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SERVICE REQUEST MANAGEMENT */}
        <section className="dispatcher-section" style={sectionStyle}>
          <div
            className="dispatcher-section-header"
            style={sectionHeaderStyle}
          >
            <div>
              <h2 style={{ marginBottom: "5px" }}>
                Service Request Management
              </h2>
              <p style={mutedTextStyle}>
                View customer service requests and assign technicians.
              </p>
            </div>

            <div className="dispatcher-count" style={resultCountStyle}>
              {serviceRequests.length} Service Requests
            </div>
          </div>

          {serviceRequestLoading ? (
            <p>Loading service requests...</p>
          ) : serviceRequests.length === 0 ? (
            <div className="dispatcher-empty" style={emptyStyle}>
              <strong>No service requests found.</strong>
              <p>Customer service requests will appear here.</p>
            </div>
          ) : (
            <div className="dispatcher-table-wrapper" style={tableWrapperStyle}>
              <table className="dispatcher-table" style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Problem</th>
                    <th style={thStyle}>Facility</th>
                    <th style={thStyle}>Equipment</th>
                    <th style={thStyle}>Priority</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Technician</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request) => (
                    <tr key={request.id}>
                      <td style={tdStyle}>
                        <strong>#{request.id}</strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>{request.customerName}</strong>
                        <br />
                        <small style={mutedTextStyle}>
                          {request.customerEmail || "-"}
                        </small>
                      </td>

                      <td style={tdStyle}>{request.problemDescription}</td>

                      <td style={tdStyle}>
                        {request.facilityId
                          ? `Facility #${request.facilityId}`
                          : "-"}
                      </td>

                      <td style={tdStyle}>
                        {request.equipmentId
                          ? `Equipment #${request.equipmentId}`
                          : "-"}
                      </td>

                      <td style={tdStyle}>
                        <PriorityBadge priority={request.priority} />
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge status={request.status} />
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {request.technicianName ||
                            (request.technicianId
                              ? getTechnicianName(request.technicianId)
                              : "Not Assigned")}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <select
                          className="dispatcher-input"
                          value={serviceRequestTechnicians[request.id] || ""}
                          onChange={(e) =>
                            setServiceRequestTechnicians((previous) => ({
                              ...previous,
                              [request.id]: e.target.value,
                            }))
                          }
                          style={filterInputStyle}
                          disabled={
                            assigningServiceRequestId === request.id
                          }
                        >
                          <option value="">Select Technician</option>
                          {technicians.map((technician) => (
                            <option
                              key={technician.id}
                              value={technician.id}
                            >
                              {technician.name}
                            </option>
                          ))}
                        </select>

                        <button
                          className="dispatcher-button dispatcher-button-primary"
                          onClick={() => assignServiceRequest(request)}
                          style={{
                            ...actionButtonStyle,
                            marginTop: "6px",
                          }}
                          disabled={
                            assigningServiceRequestId === request.id ||
                            request.status === "COMPLETED" ||
                            request.status === "CANCELLED"
                          }
                        >
                          {assigningServiceRequestId === request.id
                            ? "Assigning..."
                            : request.technicianId
                              ? "Reassign"
                              : "Assign"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* WORK ORDER DISPATCH */}
        <section className="dispatcher-section" style={sectionStyle}>
          <div
            className="dispatcher-section-header"
            style={sectionHeaderStyle}
          >
            <div>
              <h2 style={{ marginBottom: "5px" }}>
                Work Order Dispatch
              </h2>
              <p style={mutedTextStyle}>
                Search, filter and manage work order assignments.
              </p>
            </div>

            <div className="dispatcher-count" style={resultCountStyle}>
              Showing {filteredWorkOrders.length} of {workOrders.length}
            </div>
          </div>

          {/* FILTERS */}
          <div
            className="dispatcher-filter-grid"
            style={filterGridStyle}
          >
            <div>
              <label style={labelStyle}>Search</label>
              <input
                className="dispatcher-input"
                type="text"
                placeholder="Search service, customer, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={filterInputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select
                className="dispatcher-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={filterInputStyle}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Priority</label>
              <select
                className="dispatcher-input"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={filterInputStyle}
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Technician</label>
              <select
                className="dispatcher-input"
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                style={filterInputStyle}
              >
                <option value="ALL">All Technicians</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="dispatcher-reset-container" style={resetContainerStyle}>
              <button
                className="dispatcher-button"
                onClick={resetFilters}
                style={resetButtonStyle}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {loading && <p>Loading work orders...</p>}

          {!loading && filteredWorkOrders.length === 0 && (
            <div className="dispatcher-empty" style={emptyStyle}>
              <strong>No matching work orders found.</strong>
              <p>Try changing your search or filters.</p>
            </div>
          )}

          {!loading && filteredWorkOrders.length > 0 && (
            <div className="dispatcher-table-wrapper" style={tableWrapperStyle}>
              <table className="dispatcher-table" style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Service</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Priority</th>
                    <th style={thStyle}>Technician</th>
                    <th style={thStyle}>Scheduled</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWorkOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={tdStyle}>
                        <strong>#{order.id}</strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>{order.title}</strong>
                        <br />
                        <small style={mutedTextStyle}>
                          {order.description}
                        </small>
                      </td>

                      <td style={tdStyle}>
                        <strong>{order.customerName}</strong>
                        <br />
                        <small style={mutedTextStyle}>
                          {order.customerEmail || "-"}
                        </small>
                      </td>

                      <td style={tdStyle}>{order.location || "-"}</td>

                      <td style={tdStyle}>
                        <PriorityBadge priority={order.priority} />
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {getTechnicianName(order.technicianId)}
                        </strong>
                        {order.technicianId && (
                          <>
                            <br />
                            <small style={mutedTextStyle}>
                              {getTechnicianEmail(order.technicianId)}
                            </small>
                          </>
                        )}
                      </td>

                      <td style={tdStyle}>
                        {order.scheduledDate
                          ? new Date(order.scheduledDate).toLocaleString()
                          : "Not Scheduled"}
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge status={order.status} />
                      </td>

                      <td style={tdStyle}>
                        <button
                          className="dispatcher-button"
                          onClick={() => openAssign(order)}
                          style={actionButtonStyle}
                          disabled={saving}
                        >
                          {order.technicianId ? "Reassign" : "Assign"}
                        </button>

                        {order.status === "ASSIGNED" && (
                          <button
                            className="dispatcher-button dispatcher-button-primary"
                            onClick={() => updateStatus(order, "IN_PROGRESS")}
                            style={actionButtonStyle}
                            disabled={saving}
                          >
                            Start
                          </button>
                        )}

                        {order.status === "IN_PROGRESS" && (
                          <button
                            className="dispatcher-button dispatcher-button-success"
                            onClick={() => updateStatus(order, "COMPLETED")}
                            style={actionButtonStyle}
                            disabled={saving}
                          >
                            Complete
                          </button>
                        )}

                        <button
                          className="dispatcher-button dispatcher-button-report"
                          onClick={() => viewServiceReport(order)}
                          style={reportButtonStyle}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ASSIGN TECHNICIAN MODAL */}
      {selectedOrder && (
        <div
          className="dispatcher-modal-overlay dispatcher-assign-overlay"
          style={overlayStyle}
        >
          <div
            className="dispatcher-modal dispatcher-assign-modal"
            style={modalStyle}
          >
            <h2>Assign Technician</h2>

            <div className="dispatcher-order-summary" style={orderSummaryStyle}>
              <p>
                <strong>Work Order:</strong> {selectedOrder.title}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.customerName}
              </p>
              <p>
                <strong>Location:</strong> {selectedOrder.location || "-"}
              </p>
              <p>
                <strong>Priority:</strong> {selectedOrder.priority}
              </p>
            </div>

            <label style={labelStyle}>Technician</label>
            <select
              className="dispatcher-input"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select Technician</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name} - {technician.email}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Scheduled Date &amp; Time</label>
            <input
              className="dispatcher-input"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={inputStyle}
            />

            <div className="dispatcher-modal-actions" style={modalButtonsStyle}>
              <button
                className="dispatcher-button dispatcher-button-primary"
                onClick={saveAssignment}
                style={primaryButtonStyle}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Assignment"}
              </button>

              <button
                className="dispatcher-button"
                onClick={closeAssign}
                style={secondaryButtonStyle}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE REPORT MODAL */}
      {showReportModal && (
        <div
          className="dispatcher-modal-overlay dispatcher-report-overlay"
          style={reportOverlayStyle}
        >
          <div
            className="dispatcher-modal dispatcher-report-modal"
            style={reportModalStyle}
          >
            <div className="dispatcher-report-header" style={reportHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Service Report</h2>
                {selectedReportWorkOrder && (
                  <p style={reportSubtitleStyle}>
                    Work Order #{selectedReportWorkOrder.id} —{" "}
                    {selectedReportWorkOrder.title}
                  </p>
                )}
              </div>

              <button
                className="dispatcher-report-close"
                onClick={closeReportModal}
                style={closeButtonStyle}
                aria-label="Close service report"
              >
                ×
              </button>
            </div>

            {reportLoading ? (
              <div className="dispatcher-report-message" style={reportMessageStyle}>
                <p>Loading service report...</p>
              </div>
            ) : reportError ? (
              <div className="dispatcher-report-error" style={reportErrorStyle}>
                {reportError}
              </div>
            ) : selectedReport ? (
              <div className="dispatcher-report-content" style={{ marginTop: 20 }}>
                <div className="dispatcher-report-section" style={reportSectionStyle}>
                  <h3>Work Order Information</h3>

                  <div className="dispatcher-report-grid" style={infoGridStyle}>
                    <InfoItem label="Work Order ID" value={`#${selectedReport.workOrderId}`} />
                    <InfoItem label="Service" value={selectedReportWorkOrder?.title || "N/A"} />
                    <InfoItem label="Customer" value={selectedReportWorkOrder?.customerName || "N/A"} />
                    <InfoItem label="Customer Email" value={selectedReportWorkOrder?.customerEmail || "N/A"} />
                    <InfoItem label="Customer Phone" value={selectedReportWorkOrder?.customerPhone || "N/A"} />
                    <InfoItem label="Location" value={selectedReportWorkOrder?.location || "N/A"} />
                    <InfoItem label="Technician" value={getTechnicianName(selectedReport.technicianId)} />
                    <InfoItem label="Technician ID" value={String(selectedReport.technicianId)} />
                    <InfoItem label="Priority" value={selectedReportWorkOrder?.priority || "N/A"} />
                    <InfoItem label="Status" value={selectedReportWorkOrder?.status || "N/A"} />
                  </div>
                </div>

                <div className="dispatcher-report-section" style={reportSectionStyle}>
                  <h3>Service Details</h3>

                  <ReportTextField
                    label="Work Performed"
                    value={selectedReport.workPerformed || "No information provided."}
                  />
                  <ReportTextField
                    label="Technician Remarks"
                    value={selectedReport.technicianRemarks || "No remarks provided."}
                  />
                  <ReportTextField
                    label="Issues Found"
                    value={selectedReport.issuesFound || "No issues reported."}
                  />
                  <ReportTextField
                    label="Parts Used"
                    value={selectedReport.partsUsed || "No parts recorded."}
                  />

                  <div className="dispatcher-report-grid" style={infoGridStyle}>
                    <InfoItem
                      label="Service Duration"
                      value={
                        selectedReport.serviceDurationMinutes !== undefined
                          ? `${selectedReport.serviceDurationMinutes} minutes`
                          : "Not specified"
                      }
                    />
                    <InfoItem
                      label="Scheduled Date"
                      value={
                        selectedReportWorkOrder?.scheduledDate
                          ? new Date(selectedReportWorkOrder.scheduledDate).toLocaleString()
                          : "Not scheduled"
                      }
                    />
                    <InfoItem
                      label="Completed At"
                      value={
                        selectedReport.completedAt
                          ? new Date(selectedReport.completedAt).toLocaleString()
                          : "Not specified"
                      }
                    />
                    <InfoItem
                      label="Report Created"
                      value={
                        selectedReport.createdAt
                          ? new Date(selectedReport.createdAt).toLocaleString()
                          : "Not specified"
                      }
                    />
                    <InfoItem
                      label="Last Updated"
                      value={
                        selectedReport.updatedAt
                          ? new Date(selectedReport.updatedAt).toLocaleString()
                          : "Not specified"
                      }
                    />
                  </div>
                </div>

                <div className="dispatcher-report-footer" style={reportFooterStyle}>
                  <button
                    className="dispatcher-button dispatcher-button-success"
                    onClick={downloadServiceReportPDF}
                    style={downloadPDFButtonStyle}
                  >
                    Download PDF
                  </button>

                  <button
                    className="dispatcher-button"
                    onClick={closeReportModal}
                    style={closeReportButtonStyle}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="dispatcher-stat-card" style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      <p style={numberStyle}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="dispatcher-info-item">
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}

function ReportTextField({ label, value }: { label: string; value: string }) {
  return (
    <div className="dispatcher-report-field" style={fieldStyle}>
      <strong>{label}</strong>
      <div className="dispatcher-report-text" style={textBoxStyle}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<string, { background: string; color: string }> = {
    NEW: { background: "#e7f1ff", color: "#084298" },
    PENDING: { background: "#fff3cd", color: "#856404" },
    ASSIGNED: { background: "#d1ecf1", color: "#0c5460" },
    IN_PROGRESS: { background: "#cce5ff", color: "#004085" },
    COMPLETED: { background: "#d4edda", color: "#155724" },
    CANCELLED: { background: "#f8d7da", color: "#721c24" },
  };

  const colors = statusColors[status] || {
    background: "#eee",
    color: "#333",
  };

  return (
    <span
      className={`dispatcher-badge dispatcher-status-${status.toLowerCase()}`}
      style={{
        ...badgeStyle,
        background: colors.background,
        color: colors.color,
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityColors: Record<string, { background: string; color: string }> = {
    LOW: { background: "#e2e3e5", color: "#383d41" },
    MEDIUM: { background: "#fff3cd", color: "#856404" },
    HIGH: { background: "#f8d7da", color: "#721c24" },
    CRITICAL: { background: "#dc3545", color: "white" },
    URGENT: { background: "#dc3545", color: "white" },
  };

  const colors = priorityColors[priority] || {
    background: "#eee",
    color: "#333",
  };

  return (
    <span
      className={`dispatcher-badge dispatcher-priority-${priority.toLowerCase()}`}
      style={{
        ...badgeStyle,
        background: colors.background,
        color: colors.color,
      }}
    >
      {priority}
    </span>
  );
}

/* INLINE STYLE FALLBACKS */

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f6f8",
};

const headerStyle = {
  minHeight: "70px",
  background: "white",
  borderBottom: "1px solid #ddd",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 30px",
};

const headerRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
};

const subtitleStyle = {
  margin: "3px 0 0",
  fontSize: "12px",
  color: "#666",
};

const roleTextStyle = {
  fontSize: "11px",
  color: "#777",
  marginTop: "3px",
};

const logoutButtonStyle = {
  padding: "8px 14px",
  cursor: "pointer",
};

const mainStyle = {
  padding: "30px",
};

const descriptionStyle = {
  color: "#666",
};

const errorStyle = {
  color: "#842029",
  background: "#f8d7da",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "20px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "20px",
  margin: "25px 0",
};

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const cardTitleStyle = {
  marginTop: 0,
  color: "#555",
};

const numberStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  margin: 0,
};

const sectionStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  marginBottom: "25px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const mutedTextStyle = {
  color: "#666",
};

const technicianCountStyle = {
  background: "#eef2ff",
  padding: "8px 14px",
  borderRadius: "20px",
  fontWeight: "bold",
};

const resultCountStyle = {
  color: "#666",
  fontSize: "14px",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "15px",
  marginTop: "20px",
  marginBottom: "20px",
  alignItems: "end",
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginBottom: "6px",
};

const filterInputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box" as const,
};

const resetContainerStyle = {
  display: "flex",
  alignItems: "end",
};

const resetButtonStyle = {
  padding: "10px 15px",
  cursor: "pointer",
  border: "1px solid #bbb",
  borderRadius: "6px",
  background: "#f8f9fa",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginTop: "15px",
};

const thStyle = {
  padding: "12px",
  textAlign: "left" as const,
  borderBottom: "1px solid #ddd",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top" as const,
};

const actionButtonStyle = {
  padding: "7px 10px",
  cursor: "pointer",
  marginRight: "5px",
  marginBottom: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  background: "white",
};

const reportButtonStyle = {
  padding: "7px 10px",
  cursor: "pointer",
  marginRight: "5px",
  marginBottom: "5px",
  border: "none",
  borderRadius: "5px",
  background: "#0d6efd",
  color: "white",
  fontWeight: "bold",
};

const badgeStyle = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
};

const emptyStyle = {
  textAlign: "center" as const,
  padding: "40px",
  color: "#666",
};

const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "10px",
  width: "500px",
  maxWidth: "90%",
  maxHeight: "90vh",
  overflowY: "auto" as const,
};

const orderSummaryStyle = {
  background: "#f8f9fa",
  padding: "15px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  marginBottom: "18px",
  boxSizing: "border-box" as const,
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const modalButtonsStyle = {
  marginTop: "20px",
};

const primaryButtonStyle = {
  padding: "10px 18px",
  cursor: "pointer",
  marginRight: "10px",
  border: "none",
  borderRadius: "6px",
  background: "#0d6efd",
  color: "white",
};

const secondaryButtonStyle = {
  padding: "10px 18px",
  cursor: "pointer",
  border: "1px solid #ccc",
  borderRadius: "6px",
  background: "white",
};

const reportOverlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
  zIndex: 2000,
};

const reportModalStyle = {
  background: "white",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  padding: "25px",
  boxShadow: "0 5px 25px rgba(0,0,0,0.25)",
};

const reportHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid #eee",
  paddingBottom: "15px",
};

const reportSubtitleStyle = {
  margin: "6px 0 0",
  color: "#666",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: "32px",
  cursor: "pointer",
  lineHeight: 1,
};

const reportMessageStyle = {
  padding: "30px",
  textAlign: "center" as const,
};

const reportErrorStyle = {
  marginTop: "20px",
  padding: "15px",
  borderRadius: "8px",
  backgroundColor: "#f8d7da",
  color: "#721c24",
};

const reportSectionStyle = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "15px",
  marginTop: "15px",
};

const fieldStyle = {
  marginBottom: "18px",
};

const textBoxStyle = {
  marginTop: "8px",
  padding: "14px",
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "6px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap" as const,
};

const reportFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "20px",
};

const downloadPDFButtonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "#198754",
  color: "white",
  fontSize: "14px",
  fontWeight: "bold",
  marginRight: "10px",
};

const closeReportButtonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "#333",
  color: "white",
  fontSize: "14px",
};

export default DispatcherDashboard;