import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import api from "../api/axios";
import "./ManagerDashboard.css";

interface WorkOrder {
  id: number;
  title: string;
  description?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  location?: string;
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

interface ServiceReport {
  id: number;
  workOrderId?: number | null;
  serviceRequestId?: number | null;
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

function ManagerDashboard() {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [technicianFilter, setTechnicianFilter] = useState("ALL");

  const [selectedOrder, setSelectedOrder] =
    useState<WorkOrder | null>(null);

  const [selectedReport, setSelectedReport] =
    useState<ServiceReport | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // ==================================================
  // LOAD DATA
  // ==================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [workOrderResponse, userResponse, reportResponse] = await Promise.all([
        api.get("/api/work-orders"),
        api.get("/api/users"),
        api.get("/api/service-reports"),
      ]);

      setWorkOrders(workOrderResponse.data);
      setUsers(userResponse.data);
      setServiceReports(
        Array.isArray(reportResponse.data)
          ? reportResponse.data.filter(
              (report: ServiceReport) => report.workOrderId != null
            )
          : []
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  void loadData();

  const interval = setInterval(() => {
    void loadData();
  }, 10000);

  return () => {
    clearInterval(interval);
  };
}, []);
  // ==================================================
  // TECHNICIANS
  // ==================================================

  const technicians = useMemo(
    () => users.filter((user) => user.role === "TECHNICIAN"),
    [users]
  );

  const getTechnicianName = (technicianId?: number | null) => {
    if (!technicianId) {
      return "Unassigned";
    }

    const technician = users.find(
      (user) => user.id === technicianId
    );

    return technician
      ? technician.name
      : `Technician #${technicianId}`;
  };

  // ==================================================
  // FILTERS
  // ==================================================

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        searchText === "" ||
        order.title?.toLowerCase().includes(searchText) ||
        order.customerName?.toLowerCase().includes(searchText) ||
        order.location?.toLowerCase().includes(searchText) ||
        String(order.id).includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        order.priority === priorityFilter;

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

  // ==================================================
  // STATISTICS
  // ==================================================

  const totalOrders = workOrders.length;

  const pendingOrders = workOrders.filter(
  (order) =>
    order.status === "PENDING" ||
    order.status === "NEW"
).length;

  const assignedOrders = workOrders.filter(
    (order) => order.status === "ASSIGNED"
  ).length;

  const inProgressOrders = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completedOrders = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const urgentOrders = workOrders.filter(
    (order) =>
      order.priority === "HIGH" || order.priority === "URGENT"
  ).length;

  // ==================================================
  // DATE FORMAT
  // ==================================================

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString();
  };

  // ==================================================
  // WORK ORDER DETAILS
  // ==================================================

  const openWorkOrder = (order: WorkOrder) => {
    setSelectedOrder(order);
  };

  const closeWorkOrder = () => {
    setSelectedOrder(null);
  };

  // ==================================================
  // VIEW SERVICE REPORT
  // ==================================================

  const viewServiceReport = async (order: WorkOrder) => {
    try {
      setReportLoading(true);
      setReportError("");
      setSelectedReport(null);
      setShowReportModal(true);

      const response = await api.get(
        `/api/service-reports/work-order/${order.id}`
      );

      if (response.data) {
        setSelectedReport(response.data);
      } else {
        setReportError(
          "No service report is available for this work order."
        );
      }
    } catch (err) {
      console.error(err);
      setReportError("Failed to load service report.");
    } finally {
      setReportLoading(false);
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
    setReportError("");
  };

  // ==================================================
  // DOWNLOAD SERVICE REPORT PDF
  // ==================================================

  const downloadServiceReportPDF = () => {
    if (!selectedReport) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("KEYSTONE", margin, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      "Field Service Management Platform",
      margin,
      y
    );

    y += 10;

    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SERVICE REPORT", margin, y);

    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Report Information", margin, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Report ID: ${selectedReport.id}`, margin, y);
    y += 6;

    doc.text(
      `Work Order ID: ${selectedReport.workOrderId}`,
      margin,
      y
    );
    y += 6;

    doc.text(
      `Technician ID: ${selectedReport.technicianId}`,
      margin,
      y
    );
    y += 6;

    doc.text(
      `Service Duration: ${
        selectedReport.serviceDurationMinutes
          ? `${selectedReport.serviceDurationMinutes} minutes`
          : "N/A"
      }`,
      margin,
      y
    );
    y += 6;

    doc.text(
      `Completed At: ${formatDate(selectedReport.completedAt)}`,
      margin,
      y
    );
    y += 6;

    doc.text(
      `Report Created: ${formatDate(selectedReport.createdAt)}`,
      margin,
      y
    );
    y += 12;

    const addSection = (title: string, content?: string) => {
      const text = content || "No information provided.";

      const lines = doc.splitTextToSize(
        text,
        pageWidth - margin * 2
      );

      const requiredHeight = 15 + lines.length * 5;

      if (y + requiredHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin, y);

      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(lines, margin, y);

      y += lines.length * 5 + 10;
    };

    addSection("Work Performed", selectedReport.workPerformed);
    addSection("Technician Remarks", selectedReport.technicianRemarks);
    addSection("Issues Found", selectedReport.issuesFound);
    addSection("Parts Used", selectedReport.partsUsed);

    if (y > pageHeight - 35) {
      doc.addPage();
      y = 20;
    }

    y += 5;

    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Generated by KEYSTONE Field Service Management Platform",
      margin,
      y
    );

    doc.save(
      `KEYSTONE_Service_Report_${selectedReport.workOrderId}.pdf`
    );
  };

  // ==================================================
  // RESET FILTERS
  // ==================================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTechnicianFilter("ALL");
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="manager-loading-spinner" />
        <p>Loading Manager Dashboard...</p>
      </div>
    );
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <div className="manager-dashboard">
      {/* HEADER */}
      <header className="manager-header">
        <div className="manager-header-copy">
          <div className="manager-eyebrow">KEYSTONE / MANAGEMENT</div>
          <h1>Manager Dashboard</h1>
          <p>
            Monitor work orders, technicians and service reports
          </p>
        </div>

        <div className="manager-header-actions">
          <button
            className="manager-button manager-button-secondary"
            onClick={loadData}
          >
            ↻ Refresh
          </button>

          <button
            className="manager-button manager-button-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="manager-alert manager-alert-error">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <section className="manager-stats-grid">
        <StatCard
          title="Total Work Orders"
          value={totalOrders}
          accent="blue"
        />
        <StatCard
          title="Pending"
          value={pendingOrders}
          accent="orange"
        />
        <StatCard
          title="Assigned"
          value={assignedOrders}
          accent="indigo"
        />
        <StatCard
          title="In Progress"
          value={inProgressOrders}
          accent="yellow"
        />
        <StatCard
          title="Completed"
          value={completedOrders}
          accent="green"
        />
        <StatCard
          title="High / Urgent"
          value={urgentOrders}
          accent="red"
        />
      </section>

      {/* FILTERS */}
      <section className="manager-panel">
        <div className="manager-panel-heading">
          <div>
            <h2>Work Order Filters</h2>
            <p>Search and narrow down your work orders.</p>
          </div>
        </div>

        <div className="manager-filter-grid">
          <input
            className="manager-control"
            type="text"
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="manager-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            className="manager-control"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            className="manager-control"
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
          >
            <option value="ALL">All Technicians</option>
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
            className="manager-button manager-button-muted"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* WORK ORDER TABLE */}
      <section className="manager-panel manager-table-panel">
        <div className="manager-panel-heading manager-table-heading">
          <div>
            <h2>Work Order Monitoring</h2>
            <p>Review assignments, status and service activity.</p>
          </div>

          <span className="manager-result-count">
            Showing {filteredWorkOrders.length} of {workOrders.length}
          </span>
        </div>

        {filteredWorkOrders.length === 0 ? (
          <div className="manager-empty-state">
            <div className="manager-empty-icon">▤</div>
            <h3>No work orders found</h3>
            <p>Try changing your search or filter options.</p>
          </div>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Work Order</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredWorkOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="manager-id-cell">
                      #{order.id}
                    </td>

                    <td>
                      <strong>{order.title}</strong>
                    </td>

                    <td>{order.customerName}</td>

                    <td>{order.location || "Not specified"}</td>

                    <td>
                      <span
                        className={`manager-badge manager-priority-${order.priority.toLowerCase()}`}
                      >
                        {order.priority}
                      </span>
                    </td>

                    <td>
                      {getTechnicianName(order.technicianId)}
                    </td>

                    <td>
                      <span
                        className={`manager-badge manager-status-${order.status.toLowerCase()}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>

                    <td>{formatDate(order.scheduledDate)}</td>

                    <td>
                      <div className="manager-row-actions">
                        <button
                          className="manager-button manager-button-small manager-button-blue"
                          onClick={() => openWorkOrder(order)}
                        >
                          View
                        </button>

                        <button
                          className="manager-button manager-button-small manager-button-purple"
                          onClick={() => viewServiceReport(order)}
                        >
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="manager-panel manager-reports-panel">
        <div className="manager-panel-heading">
          <div>
            <h2>Technician Service Reports</h2>
            <p>Reports submitted for work orders.</p>
          </div>
          <span className="manager-result-count">
            {serviceReports.length} reports
          </span>
        </div>

        {serviceReports.length === 0 ? (
          <div className="manager-empty-state">
            <h3>No work-order reports yet</h3>
            <p>Submitted technician reports will appear here.</p>
          </div>
        ) : (
          <div className="manager-report-list">
            {serviceReports.map((report) => {
              const workOrder = workOrders.find(
                (order) => order.id === report.workOrderId
              );

              return (
                <article className="manager-report-card" key={report.id}>
                  <div className="manager-report-card-heading">
                    <div>
                      <strong>
                        {workOrder?.title || `Work Order #${report.workOrderId}`}
                      </strong>
                      <span>Report #{report.id}</span>
                    </div>
                    <button
                      className="manager-button manager-button-small manager-button-purple"
                      onClick={() => {
                        if (workOrder) void viewServiceReport(workOrder);
                      }}
                      disabled={!workOrder}
                    >
                      View Report
                    </button>
                  </div>
                  <p>{report.workPerformed || "No work details provided."}</p>
                  <div className="manager-report-card-meta">
                    <span>{getTechnicianName(report.technicianId)}</span>
                    <span>
                      {formatDate(report.completedAt || report.createdAt)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* WORK ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className="manager-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeWorkOrder();
            }
          }}
        >
          <div className="manager-modal">
            <div className="manager-modal-header">
              <div>
                <span className="manager-modal-kicker">
                  WORK ORDER DETAILS
                </span>
                <h2>Work Order #{selectedOrder.id}</h2>
              </div>

              <button
                className="manager-modal-close"
                onClick={closeWorkOrder}
                aria-label="Close work order details"
              >
                ×
              </button>
            </div>

            <div className="manager-detail-grid">
              <DetailItem label="Title" value={selectedOrder.title} />
              <DetailItem
                label="Customer"
                value={selectedOrder.customerName}
              />
              <DetailItem
                label="Email"
                value={selectedOrder.customerEmail || "N/A"}
              />
              <DetailItem
                label="Phone"
                value={selectedOrder.customerPhone || "N/A"}
              />
              <DetailItem
                label="Location"
                value={selectedOrder.location || "N/A"}
              />
              <DetailItem
                label="Technician"
                value={getTechnicianName(selectedOrder.technicianId)}
              />
              <DetailItem
                label="Facility ID"
                value={
                  selectedOrder.facilityId
                    ? String(selectedOrder.facilityId)
                    : "N/A"
                }
              />
              <DetailItem
                label="Equipment ID"
                value={
                  selectedOrder.equipmentId
                    ? String(selectedOrder.equipmentId)
                    : "N/A"
                }
              />
              <DetailItem
                label="Priority"
                value={selectedOrder.priority}
              />
              <DetailItem
                label="Status"
                value={selectedOrder.status}
              />
              <DetailItem
                label="Scheduled Date"
                value={formatDate(selectedOrder.scheduledDate)}
              />
              <DetailItem
                label="Created At"
                value={formatDate(selectedOrder.createdAt)}
              />
            </div>

            <div className="manager-description-block">
              <h3>Description</h3>
              <p>
                {selectedOrder.description ||
                  "No description available."}
              </p>
            </div>

            <div className="manager-modal-actions">
              <button
                className="manager-button manager-button-purple"
                onClick={() => viewServiceReport(selectedOrder)}
              >
                View Service Report
              </button>

              <button
                className="manager-button manager-button-muted"
                onClick={closeWorkOrder}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE REPORT MODAL */}
      {showReportModal && (
        <div
          className="manager-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeReportModal();
            }
          }}
        >
          <div className="manager-modal manager-modal-wide">
            <div className="manager-modal-header">
              <div>
                <span className="manager-modal-kicker">
                  SERVICE DOCUMENTATION
                </span>
                <h2>Service Report</h2>

                {selectedReport && (
                  <p className="manager-modal-subtitle">
                    Work Order #{selectedReport.workOrderId}
                  </p>
                )}
              </div>

              <button
                className="manager-modal-close"
                onClick={closeReportModal}
                aria-label="Close service report"
              >
                ×
              </button>
            </div>

            {reportLoading && (
              <div className="manager-report-loading">
                <div className="manager-loading-spinner" />
                <p>Loading service report...</p>
              </div>
            )}

            {reportError && !reportLoading && (
              <div className="manager-alert manager-alert-warning">
                {reportError}
              </div>
            )}

            {selectedReport && !reportLoading && (
              <>
                <section className="manager-report-info">
                  <h3>Report Information</h3>

                  <div className="manager-detail-grid">
                    <DetailItem
                      label="Report ID"
                      value={String(selectedReport.id)}
                    />
                    <DetailItem
                      label="Work Order ID"
                      value={String(selectedReport.workOrderId)}
                    />
                    <DetailItem
                      label="Technician ID"
                      value={String(selectedReport.technicianId)}
                    />
                    <DetailItem
                      label="Service Duration"
                      value={
                        selectedReport.serviceDurationMinutes
                          ? `${selectedReport.serviceDurationMinutes} minutes`
                          : "N/A"
                      }
                    />
                    <DetailItem
                      label="Completed At"
                      value={formatDate(selectedReport.completedAt)}
                    />
                    <DetailItem
                      label="Report Created"
                      value={formatDate(selectedReport.createdAt)}
                    />
                    <DetailItem
                      label="Last Updated"
                      value={formatDate(selectedReport.updatedAt)}
                    />
                  </div>
                </section>

                <ReportSection
                  title="Work Performed"
                  content={selectedReport.workPerformed}
                />

                <ReportSection
                  title="Technician Remarks"
                  content={selectedReport.technicianRemarks}
                />

                <ReportSection
                  title="Issues Found"
                  content={selectedReport.issuesFound}
                />

                <ReportSection
                  title="Parts Used"
                  content={selectedReport.partsUsed}
                />
              </>
            )}

            <div className="manager-modal-actions">
              <button
                className="manager-button manager-button-blue"
                onClick={downloadServiceReportPDF}
                disabled={!selectedReport}
              >
                Download PDF
              </button>

              <button
                className="manager-button manager-button-muted"
                onClick={closeReportModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================
// STAT CARD
// ==================================================

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`manager-stat-card manager-stat-${accent}`}>
      <div className="manager-stat-topline">
        <span className="manager-stat-label">{title}</span>
        <span className="manager-stat-dot" />
      </div>

      <div className="manager-stat-value">{value}</div>
    </div>
  );
}

// ==================================================
// DETAIL ITEM
// ==================================================

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="manager-detail-item">
      <div className="manager-detail-label">{label}</div>
      <div className="manager-detail-value">{value}</div>
    </div>
  );
}

// ==================================================
// REPORT SECTION
// ==================================================

function ReportSection({
  title,
  content,
}: {
  title: string;
  content?: string;
}) {
  return (
    <section className="manager-report-section">
      <h3>{title}</h3>
      <div className="manager-report-content">
        {content || "No information provided."}
      </div>
    </section>
  );
}

export default ManagerDashboard;