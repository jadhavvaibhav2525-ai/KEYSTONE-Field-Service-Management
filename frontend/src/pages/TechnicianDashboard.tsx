
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import jsPDF from "jspdf";
import "./TechnicianDashboard.css";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

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
  technicianId?: number;
  scheduledDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceRequest {
  id: number;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  facilityId?: number;
  equipmentId?: number;
  technicianId?: number;
  technicianName?: string;
  problemDescription: string;
  priority: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceReport {
  id?: number;
  workOrderId?: number;
  serviceRequestId?: number;
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

interface ReportForm {
  workPerformed: string;
  technicianRemarks: string;
  partsUsed: string;
  issuesFound: string;
  serviceDurationMinutes: string;
}

const emptyReportForm: ReportForm = {
  workPerformed: "",
  technicianRemarks: "",
  partsUsed: "",
  issuesFound: "",
  serviceDurationMinutes: "",
};

function TechnicianDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  const [loading, setLoading] = useState(false);
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showServiceReport, setShowServiceReport] = useState(false);
  const [serviceReport, setServiceReport] = useState<ServiceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);

  const [selectedServiceRequest, setSelectedServiceRequest] =
    useState<ServiceRequest | null>(null);
  const [showServiceRequestReport, setShowServiceRequestReport] = useState(false);
  const [serviceRequestReport, setServiceRequestReport] =
    useState<ServiceReport | null>(null);
  const [serviceRequestReportLoading, setServiceRequestReportLoading] =
    useState(false);
  const [serviceRequestReportSaving, setServiceRequestReportSaving] =
    useState(false);

  const [reportForm, setReportForm] = useState<ReportForm>(emptyReportForm);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      setUser(JSON.parse(storedUser) as User);
    } catch (err) {
      console.error("Invalid user data:", err);
      localStorage.removeItem("user");
      setError("Unable to read your account information. Please sign in again.");
    }
  }, []);

  const fetchWorkOrders = useCallback(async () => {
    if (!user?.id) {
      setError("Technician information not found.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/api/work-orders/technician/${user.id}`);
      setWorkOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching technician work orders:", err);
      setError("Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchServiceRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      setServiceRequestLoading(true);
      const response = await api.get(
        `/api/service-requests/technician/${user.id}`
      );
      setServiceRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching service requests:", err);
      setError("Unable to load service requests.");
    } finally {
      setServiceRequestLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
  if (!user?.id) return;

  void fetchWorkOrders();
  void fetchServiceRequests();

  const interval = setInterval(() => {
    void fetchWorkOrders();
    void fetchServiceRequests();
  }, 10000);

  return () => {
    clearInterval(interval);
  };
}, [user?.id, fetchWorkOrders, fetchServiceRequests]);

  const updateWorkOrderStatus = async (
    order: WorkOrder,
    newStatus: string
  ) => {
    try {
      setError("");
      await api.put(`/api/work-orders/${order.id}/status`, {
        status: newStatus,
      });
      await fetchWorkOrders();
      setSelectedWorkOrder((current) =>
        current?.id === order.id ? { ...current, status: newStatus } : current
      );
    } catch (err) {
      console.error("Error updating work order status:", err);
      setError("Unable to update work order status.");
    }
  };

  const updateServiceRequestStatus = async (
    request: ServiceRequest,
    newStatus: string
  ) => {
    try {
      setError("");
      await api.put(`/api/service-requests/${request.id}/status`, null, {
        params: { status: newStatus },
      });
      await fetchServiceRequests();
      setSelectedServiceRequest((current) =>
        current?.id === request.id ? { ...current, status: newStatus } : current
      );
    } catch (err) {
      console.error("Error updating service request status:", err);
      setError("Unable to update service request status.");
    }
  };

  const handleReportChange = (field: keyof ReportForm, value: string) => {
    setReportForm((previous) => ({ ...previous, [field]: value }));
  };

  const populateReportForm = (report: ServiceReport | null) => {
    setReportForm({
      workPerformed: report?.workPerformed ?? "",
      technicianRemarks: report?.technicianRemarks ?? "",
      partsUsed: report?.partsUsed ?? "",
      issuesFound: report?.issuesFound ?? "",
      serviceDurationMinutes:
        report?.serviceDurationMinutes != null
          ? String(report.serviceDurationMinutes)
          : "",
    });
  };

  const loadServiceReport = async (workOrderId: number) => {
    try {
      setReportLoading(true);
      setError("");
      const response = await api.get(
        `/api/service-reports/work-order/${workOrderId}`
      );
      const report = response.data as ServiceReport | null;
      setServiceReport(report);
      populateReportForm(report);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setServiceReport(null);
        populateReportForm(null);
      } else {
        console.error("Error loading service report:", err);
        setError("Unable to load service report.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  const openServiceReport = async (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setSelectedServiceRequest(null);
    setShowServiceRequestReport(false);
    setShowServiceReport(true);
    setServiceReport(null);
    populateReportForm(null);
    await loadServiceReport(order.id);
  };

  const closeServiceReport = () => {
    setShowServiceReport(false);
    setServiceReport(null);
    setSelectedWorkOrder(null);
    populateReportForm(null);
  };

  const saveServiceReport = async () => {
    if (!selectedWorkOrder || !user) return;
    if (!reportForm.workPerformed.trim()) {
      setError("Please enter the work performed.");
      return;
    }

    try {
      setReportSaving(true);
      setError("");

      const reportData = {
        workOrderId: selectedWorkOrder.id,
        technicianId: user.id,
        workPerformed: reportForm.workPerformed,
        technicianRemarks: reportForm.technicianRemarks,
        partsUsed: reportForm.partsUsed,
        issuesFound: reportForm.issuesFound,
        serviceDurationMinutes: reportForm.serviceDurationMinutes
          ? Number(reportForm.serviceDurationMinutes)
          : null,
        completedAt:
          selectedWorkOrder.status === "COMPLETED"
            ? new Date().toISOString()
            : null,
      };

      if (serviceReport?.id) {
        await api.put(`/api/service-reports/${serviceReport.id}`, reportData);
      } else {
        await api.post("/api/service-reports", reportData);
      }

      await loadServiceReport(selectedWorkOrder.id);
      await fetchWorkOrders();
      setSelectedWorkOrder((current) =>
        current?.id === selectedWorkOrder.id
          ? { ...current, status: "COMPLETED" }
          : current
      );
      alert(serviceReport?.id ? "Service report updated." : "Service report saved.");
    } catch (err) {
      console.error("Error saving service report:", err);
      setError("Unable to save service report.");
    } finally {
      setReportSaving(false);
    }
  };

  const loadServiceRequestReport = async (requestId: number) => {
    try {
      setServiceRequestReportLoading(true);
      setError("");
      const response = await api.get(
        `/api/service-reports/service-request/${requestId}`
      );
      const report = response.data as ServiceReport | null;
      setServiceRequestReport(report);
      populateReportForm(report);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setServiceRequestReport(null);
        populateReportForm(null);
      } else {
        console.error("Error loading service request report:", err);
        setError("Unable to load service request report.");
      }
    } finally {
      setServiceRequestReportLoading(false);
    }
  };

  const openServiceRequestReport = async (request: ServiceRequest) => {
    setSelectedServiceRequest(request);
    setSelectedWorkOrder(null);
    setShowServiceReport(false);
    setShowServiceRequestReport(true);
    setServiceRequestReport(null);
    populateReportForm(null);
    await loadServiceRequestReport(request.id);
  };

  const closeServiceRequestReport = () => {
    setShowServiceRequestReport(false);
    setServiceRequestReport(null);
    setSelectedServiceRequest(null);
    populateReportForm(null);
  };

  const saveServiceRequestReport = async () => {
    if (!selectedServiceRequest || !user) return;
    if (!reportForm.workPerformed.trim()) {
      setError("Please enter the work performed.");
      return;
    }

    try {
      setServiceRequestReportSaving(true);
      setError("");

      const reportData = {
        serviceRequestId: selectedServiceRequest.id,
        technicianId: user.id,
        workPerformed: reportForm.workPerformed,
        technicianRemarks: reportForm.technicianRemarks,
        partsUsed: reportForm.partsUsed,
        issuesFound: reportForm.issuesFound,
        serviceDurationMinutes: reportForm.serviceDurationMinutes
          ? Number(reportForm.serviceDurationMinutes)
          : null,
        completedAt:
          selectedServiceRequest.status === "COMPLETED"
            ? new Date().toISOString()
            : null,
      };

      if (serviceRequestReport?.id) {
        await api.put(
          `/api/service-reports/${serviceRequestReport.id}`,
          reportData
        );
      } else {
        await api.post("/api/service-reports", reportData);
      }

      await loadServiceRequestReport(selectedServiceRequest.id);
      alert(
        serviceRequestReport?.id
          ? "Service request report updated."
          : "Service request report saved."
      );
    } catch (err) {
      console.error("Error saving service request report:", err);
      setError("Unable to save service request report.");
    } finally {
      setServiceRequestReportSaving(false);
    }
  };

  const downloadPdf = (
    title: string,
    filename: string,
    fields: Array<[string, string]>
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    const addText = (label: string, value: string) => {
      const lines = doc.splitTextToSize(value || "-", pageWidth - margin * 2 - 45);
      if (y + Math.max(lines.length, 1) * 5 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(lines, margin + 45, y);
      y += Math.max(lines.length, 1) * 5 + 4;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("KEYSTONE", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("FIELD SERVICE MANAGEMENT PLATFORM", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, y, { align: "center" });
    y += 14;

    fields.forEach(([label, value]) => addText(label, value));

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.text(
        `KEYSTONE - Page ${page} of ${pages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }

    doc.save(filename);
  };

  const downloadServiceReportPDF = () => {
    if (!selectedWorkOrder || !serviceReport) {
      setError("Save the service report before downloading the PDF.");
      return;
    }

    downloadPdf("SERVICE REPORT", `KEYSTONE_Service_Report_${selectedWorkOrder.id}.pdf`, [
      ["Report ID", serviceReport.id ? String(serviceReport.id) : "-"],
      ["Work Order ID", String(selectedWorkOrder.id)],
      ["Work Order", selectedWorkOrder.title],
      ["Status", selectedWorkOrder.status],
      ["Priority", selectedWorkOrder.priority],
      ["Customer", selectedWorkOrder.customerName],
      ["Customer Email", selectedWorkOrder.customerEmail || "-"],
      ["Customer Phone", selectedWorkOrder.customerPhone || "-"],
      ["Location", selectedWorkOrder.location || "-"],
      ["Technician", user?.name || "-"],
      ["Technician ID", user?.id ? String(user.id) : "-"],
      [
        "Service Duration",
        serviceReport.serviceDurationMinutes != null
          ? `${serviceReport.serviceDurationMinutes} minutes`
          : "-",
      ],
      ["Work Performed", serviceReport.workPerformed || "-"],
      ["Technician Remarks", serviceReport.technicianRemarks || "-"],
      ["Parts Used", serviceReport.partsUsed || "-"],
      ["Issues Found", serviceReport.issuesFound || "-"],
      ["Completion Date", serviceReport.completedAt || "-"],
      ["Report Generated", new Date().toLocaleString()],
    ]);
  };

  const downloadServiceRequestReportPDF = () => {
    if (!selectedServiceRequest || !serviceRequestReport) {
      setError("Save the service request report before downloading the PDF.");
      return;
    }

    downloadPdf(
      "SERVICE REQUEST REPORT",
      `KEYSTONE_Service_Request_Report_${selectedServiceRequest.id}.pdf`,
      [
        ["Report ID", serviceRequestReport.id ? String(serviceRequestReport.id) : "-"],
        ["Service Request ID", String(selectedServiceRequest.id)],
        ["Customer", selectedServiceRequest.customerName || "-"],
        ["Customer Email", selectedServiceRequest.customerEmail || "-"],
        ["Problem", selectedServiceRequest.problemDescription],
        ["Priority", selectedServiceRequest.priority],
        ["Status", selectedServiceRequest.status],
        ["Technician", user?.name || "-"],
        ["Technician ID", user?.id ? String(user.id) : "-"],
        [
          "Service Duration",
          serviceRequestReport.serviceDurationMinutes != null
            ? `${serviceRequestReport.serviceDurationMinutes} minutes`
            : "-",
        ],
        ["Work Performed", serviceRequestReport.workPerformed || "-"],
        ["Technician Remarks", serviceRequestReport.technicianRemarks || "-"],
        ["Parts Used", serviceRequestReport.partsUsed || "-"],
        ["Issues Found", serviceRequestReport.issuesFound || "-"],
        ["Completion Date", serviceRequestReport.completedAt || "-"],
        ["Report Generated", new Date().toLocaleString()],
      ]
    );
  };

  const filteredWorkOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return workOrders.filter((order) => {
      const matchesSearch =
        !term ||
        (order.title || "").toLowerCase().includes(term) ||
        (order.customerName || "").toLowerCase().includes(term) ||
        (order.location || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || order.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [workOrders, search, statusFilter, priorityFilter]);

  const assignedCount = workOrders.filter((item) => item.status === "ASSIGNED").length;
  const inProgressCount = workOrders.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;
  const completedCount = workOrders.filter(
    (item) => item.status === "COMPLETED"
  ).length;
  const highUrgentCount = workOrders.filter(
    (item) => item.priority === "HIGH" || item.priority === "URGENT"
  ).length;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "-";

  const statusBadge = (status: string) => (
    <span className={`badge status-${(status || "").toLowerCase()}`}>
      {(status || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );

  const priorityBadge = (priority: string) => (
    <span className={`badge priority-${(priority || "").toLowerCase()}`}>
      {priority || "UNKNOWN"}
    </span>
  );

  return (
    <div className="technician-page">
      <header className="top-header">
        <div>
          <h1>KEYSTONE</h1>
          <p>Technician Dashboard</p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <strong>{user?.name || "Technician"}</strong>
            <span>
              {user?.role || "TECHNICIAN"} • ID {user?.id ?? "-"}
            </span>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>×</button>
          </div>
        )}

        <section className="stats-grid">
          {[
            ["Total Assigned", workOrders.length],
            ["Assigned", assignedCount],
            ["In Progress", inProgressCount],
            ["Completed", completedCount],
            ["High / Urgent", highUrgentCount],
          ].map(([label, value]) => (
            <div className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="panel">
          <div className="panel-title"><h2>Technician Profile</h2></div>
          <div className="profile-grid">
            <div><label>Name</label><p>{user?.name || "-"}</p></div>
            <div><label>Email</label><p>{user?.email || "-"}</p></div>
            <div><label>Role</label><p>{user?.role || "-"}</p></div>
            <div><label>Technician ID</label><p>{user?.id ?? "-"}</p></div>
          </div>
        </section>

        <section className="panel">
          <div className="filter-grid">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search service, customer or location..."
              aria-label="Search work orders"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              aria-label="Filter by priority"
            >
              <option value="ALL">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button className="reset-btn" onClick={resetFilters}>Reset</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>My Work Orders</h2>
            <button className="refresh-btn" onClick={fetchWorkOrders} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {loading ? (
            <div className="empty-state">Loading work orders...</div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="empty-state">No work orders found.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Service</th><th>Customer</th><th>Location</th>
                    <th>Priority</th><th>Status</th><th>Scheduled</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td><strong>{order.title}</strong></td>
                      <td>{order.customerName}</td>
                      <td>{order.location || "-"}</td>
                      <td>{priorityBadge(order.priority)}</td>
                      <td>{statusBadge(order.status)}</td>
                      <td>{formatDate(order.scheduledDate)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="details-btn" onClick={() => {
                            setSelectedWorkOrder(order);
                            setShowServiceReport(false);
                          }}>View Details</button>
                          {order.status === "ASSIGNED" && (
                            <button className="start-btn" onClick={() => updateWorkOrderStatus(order, "IN_PROGRESS")}>Start</button>
                          )}
                          {order.status === "IN_PROGRESS" && (
                            <button className="complete-btn" onClick={() => updateWorkOrderStatus(order, "COMPLETED")}>Complete</button>
                          )}
                          <button className="report-btn" onClick={() => openServiceReport(order)}>Service Report</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>My Service Requests</h2>
            <button className="refresh-btn" onClick={fetchServiceRequests} disabled={serviceRequestLoading}>
              {serviceRequestLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {serviceRequestLoading ? (
            <div className="empty-state">Loading service requests...</div>
          ) : serviceRequests.length === 0 ? (
            <div className="empty-state">No service requests assigned.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>ID</th><th>Customer</th><th>Problem</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request) => (
                    <tr key={request.id}>
                      <td>#{request.id}</td>
                      <td><strong>{request.customerName || "-"}</strong></td>
                      <td>{request.problemDescription}</td>
                      <td>{priorityBadge(request.priority)}</td>
                      <td>{statusBadge(request.status)}</td>
                      <td>
                        <div className="action-buttons">
                          {request.status === "ASSIGNED" && (
                            <button className="start-btn" onClick={() => updateServiceRequestStatus(request, "IN_PROGRESS")}>Start</button>
                          )}
                          {request.status === "IN_PROGRESS" && (
                            <button className="complete-btn" onClick={() => updateServiceRequestStatus(request, "COMPLETED")}>Complete</button>
                          )}
                          <button className="report-btn" onClick={() => openServiceRequestReport(request)}>Service Report</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedWorkOrder && !showServiceReport && (
        <div className="modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedWorkOrder(null);
        }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Work order details">
            <div className="modal-header">
              <div><h2>Work Order #{selectedWorkOrder.id}</h2><p>{selectedWorkOrder.title}</p></div>
              <button className="close-btn" onClick={() => setSelectedWorkOrder(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-content">
              <h3>Service Information</h3>
              <p><strong>Title:</strong> {selectedWorkOrder.title}</p>
              <p><strong>Description:</strong> {selectedWorkOrder.description || "No description"}</p>
              <p><strong>Status:</strong> {statusBadge(selectedWorkOrder.status)}</p>
              <p><strong>Priority:</strong> {priorityBadge(selectedWorkOrder.priority)}</p>
              <hr />
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> {selectedWorkOrder.customerName}</p>
              <p><strong>Email:</strong> {selectedWorkOrder.customerEmail || "-"}</p>
              <p><strong>Phone:</strong> {selectedWorkOrder.customerPhone || "-"}</p>
              <p><strong>Location:</strong> {selectedWorkOrder.location || "-"}</p>
              <hr />
              <h3>Facility & Equipment</h3>
              <p><strong>Customer ID:</strong> {selectedWorkOrder.customerId ?? "-"}</p>
              <p><strong>Facility ID:</strong> {selectedWorkOrder.facilityId ?? "-"}</p>
              <p><strong>Equipment ID:</strong> {selectedWorkOrder.equipmentId ?? "-"}</p>
              <p><strong>Technician ID:</strong> {selectedWorkOrder.technicianId ?? "-"}</p>
              <hr />
              <h3>Dates</h3>
              <p><strong>Scheduled:</strong> {formatDate(selectedWorkOrder.scheduledDate)}</p>
              <p><strong>Created:</strong> {formatDate(selectedWorkOrder.createdAt)}</p>
              <p><strong>Updated:</strong> {formatDate(selectedWorkOrder.updatedAt)}</p>
            </div>
            <div className="modal-footer">
              {selectedWorkOrder.status === "ASSIGNED" && (
                <button className="start-btn" onClick={() => updateWorkOrderStatus(selectedWorkOrder, "IN_PROGRESS")}>Start Work</button>
              )}
              {selectedWorkOrder.status === "IN_PROGRESS" && (
                <button className="complete-btn" onClick={() => updateWorkOrderStatus(selectedWorkOrder, "COMPLETED")}>Complete Work</button>
              )}
              <button className="report-btn" onClick={() => openServiceReport(selectedWorkOrder)}>Service Report</button>
              <button className="cancel-btn" onClick={() => setSelectedWorkOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {selectedWorkOrder && showServiceReport && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-label="Work order service report">
            <div className="modal-header">
              <div><h2>Service Report</h2><p>Work Order #{selectedWorkOrder.id}</p></div>
              <button className="close-btn" onClick={closeServiceReport} aria-label="Close">×</button>
            </div>
            {reportLoading ? (
              <div className="empty-state">Loading service report...</div>
            ) : (
              <>
                <div className="modal-content">
                  {serviceReport && <div className="success-message">Existing report loaded. You can update it.</div>}
                  <ReportFields reportForm={reportForm} onChange={handleReportChange} />
                  <div className="work-order-summary">
                    <h3>Work Order Information</h3>
                    <p><strong>Customer:</strong> {selectedWorkOrder.customerName}</p>
                    <p><strong>Location:</strong> {selectedWorkOrder.location || "-"}</p>
                    <p><strong>Facility ID:</strong> {selectedWorkOrder.facilityId ?? "-"}</p>
                    <p><strong>Equipment ID:</strong> {selectedWorkOrder.equipmentId ?? "-"}</p>
                    <p><strong>Status:</strong> {selectedWorkOrder.status}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  {serviceReport && <button className="download-pdf-btn" onClick={downloadServiceReportPDF}>Download PDF</button>}
                  <button className="save-report-btn" onClick={saveServiceReport} disabled={reportSaving}>
                    {reportSaving ? "Saving..." : serviceReport ? "Update Report" : "Save Report"}
                  </button>
                  <button className="cancel-btn" onClick={closeServiceReport}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedServiceRequest && showServiceRequestReport && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-label="Service request report">
            <div className="modal-header">
              <div><h2>Service Request Report</h2><p>Request #{selectedServiceRequest.id}</p></div>
              <button className="close-btn" onClick={closeServiceRequestReport} aria-label="Close">×</button>
            </div>
            {serviceRequestReportLoading ? (
              <div className="empty-state">Loading service request report...</div>
            ) : (
              <>
                <div className="modal-content">
                  {serviceRequestReport && <div className="success-message">Existing report loaded. You can update it.</div>}
                  <ReportFields reportForm={reportForm} onChange={handleReportChange} />
                  <div className="work-order-summary">
                    <h3>Service Request Information</h3>
                    <p><strong>Request ID:</strong> #{selectedServiceRequest.id}</p>
                    <p><strong>Customer:</strong> {selectedServiceRequest.customerName || "-"}</p>
                    <p><strong>Email:</strong> {selectedServiceRequest.customerEmail || "-"}</p>
                    <p><strong>Problem:</strong> {selectedServiceRequest.problemDescription}</p>
                    <p><strong>Priority:</strong> {selectedServiceRequest.priority}</p>
                    <p><strong>Status:</strong> {selectedServiceRequest.status}</p>
                    <p><strong>Technician:</strong> {user?.name || "-"}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  {serviceRequestReport && (
                    <button className="download-pdf-btn" onClick={downloadServiceRequestReportPDF}>Download PDF</button>
                  )}
                  <button className="save-report-btn" onClick={saveServiceRequestReport} disabled={serviceRequestReportSaving}>
                    {serviceRequestReportSaving ? "Saving..." : serviceRequestReport ? "Update Report" : "Save Report"}
                  </button>
                  <button className="cancel-btn" onClick={closeServiceRequestReport}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportFields({
  reportForm,
  onChange,
}: {
  reportForm: ReportForm;
  onChange: (field: keyof ReportForm, value: string) => void;
}) {
  return (
    <>
      <div className="form-group">
        <label>Work Performed *</label>
        <textarea rows={5} value={reportForm.workPerformed} onChange={(e) => onChange("workPerformed", e.target.value)} placeholder="Describe the work performed..." />
      </div>
      <div className="form-group">
        <label>Technician Remarks</label>
        <textarea rows={4} value={reportForm.technicianRemarks} onChange={(e) => onChange("technicianRemarks", e.target.value)} placeholder="Enter technician remarks..." />
      </div>
      <div className="form-group">
        <label>Parts Used</label>
        <textarea rows={3} value={reportForm.partsUsed} onChange={(e) => onChange("partsUsed", e.target.value)} placeholder="Enter parts used..." />
      </div>
      <div className="form-group">
        <label>Issues Found</label>
        <textarea rows={4} value={reportForm.issuesFound} onChange={(e) => onChange("issuesFound", e.target.value)} placeholder="Describe issues found..." />
      </div>
      <div className="form-group">
        <label>Service Duration (minutes)</label>
        <input type="number" min="0" value={reportForm.serviceDurationMinutes} onChange={(e) => onChange("serviceDurationMinutes", e.target.value)} placeholder="Example: 90" />
      </div>
    </>
  );
}

export default TechnicianDashboard;