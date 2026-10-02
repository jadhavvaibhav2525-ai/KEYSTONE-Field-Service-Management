import { useEffect, useState } from "react";
import api from "../api/axios";

interface Facility {
  id: number;
  name: string;
  address?: string;
}

interface Equipment {
  id: number;
  name: string;
  equipmentCode?: string;
  type?: string;
  model?: string;
  status?: string;
}

interface ServiceRequest {
  id: number;
  customerId?: number | null;
  customerName?: string;
  customerEmail?: string;
  facilityId?: number | null;
  equipmentId?: number | null;
  problemDescription: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status:
    | "NEW"
    | "PENDING_FACILITY"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  technicianId?: number | null;
  technicianName?: string | null;
}

function AdminServiceRequests() {
  const [serviceRequests, setServiceRequests] = useState<
    ServiceRequest[]
  >([]);

  const [facilities, setFacilities] = useState<Facility[]>([]);

  const [equipmentByRequest, setEquipmentByRequest] = useState<
    Record<number, Equipment[]>
  >({});

  const [selectedFacilities, setSelectedFacilities] = useState<
    Record<number, string>
  >({});

  const [selectedEquipment, setSelectedEquipment] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(true);

  const [loadingEquipment, setLoadingEquipment] = useState<
    Record<number, boolean>
  >({});

  const [assigningRequestId, setAssigningRequestId] = useState<
    number | null
  >(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD SERVICE REQUESTS
  // =========================================================

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/service-requests");

      setServiceRequests(response.data);
    } catch (err) {
      console.error(
        "Failed to load service requests:",
        err
      );

      setError(
        "Failed to load service requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD FACILITIES
  // =========================================================

  const loadFacilities = async () => {
    try {
      const response = await api.get("/api/facilities");

      setFacilities(response.data);
    } catch (err) {
      console.error(
        "Failed to load facilities:",
        err
      );

      setError(
        "Failed to load facilities."
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadServiceRequests();
    loadFacilities();
  }, []);

  // =========================================================
  // LOAD EQUIPMENT FOR SELECTED FACILITY
  // =========================================================

  const loadEquipment = async (
    requestId: number,
    facilityId: string
  ) => {
    if (!facilityId) {
      setEquipmentByRequest((previous) => ({
        ...previous,
        [requestId]: [],
      }));

      return;
    }

    try {
      setLoadingEquipment((previous) => ({
        ...previous,
        [requestId]: true,
      }));

      const response = await api.get(
        `/api/equipment/facility/${facilityId}`
      );

      setEquipmentByRequest((previous) => ({
        ...previous,
        [requestId]: response.data,
      }));
    } catch (err) {
      console.error(
        "Failed to load equipment:",
        err
      );

      setEquipmentByRequest((previous) => ({
        ...previous,
        [requestId]: [],
      }));

      setError(
        `Failed to load equipment for Service Request #${requestId}.`
      );
    } finally {
      setLoadingEquipment((previous) => ({
        ...previous,
        [requestId]: false,
      }));
    }
  };

  // =========================================================
  // FACILITY CHANGE
  // =========================================================

  const handleFacilityChange = (
    requestId: number,
    facilityId: string
  ) => {
    setSelectedFacilities((previous) => ({
      ...previous,
      [requestId]: facilityId,
    }));

    setSelectedEquipment((previous) => ({
      ...previous,
      [requestId]: "",
    }));

    setEquipmentByRequest((previous) => ({
      ...previous,
      [requestId]: [],
    }));

    setError("");
    setSuccess("");

    if (facilityId) {
      loadEquipment(
        requestId,
        facilityId
      );
    }
  };

  // =========================================================
  // ASSIGN FACILITY + EQUIPMENT
  // =========================================================

  const assignFacility = async (
    request: ServiceRequest
  ) => {
    const facilityId =
      selectedFacilities[request.id];

    const equipmentId =
      selectedEquipment[request.id];

    if (!facilityId) {
      setError(
        `Please select a facility for Service Request #${request.id}.`
      );

      return;
    }

    if (!equipmentId) {
      setError(
        `Please select equipment for Service Request #${request.id}.`
      );

      return;
    }

    try {
      setAssigningRequestId(request.id);

      setError("");
      setSuccess("");

      const updatedRequest = {
        ...request,
        facilityId: Number(facilityId),
        equipmentId: Number(equipmentId),
      };

      const response = await api.put(
        `/api/service-requests/${request.id}`,
        updatedRequest
      );

      setServiceRequests((previous) =>
        previous.map((item) =>
          item.id === request.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `Facility and equipment assigned successfully to Service Request #${request.id}.`
      );

      setSelectedFacilities((previous) => ({
        ...previous,
        [request.id]: "",
      }));

      setSelectedEquipment((previous) => ({
        ...previous,
        [request.id]: "",
      }));

      setEquipmentByRequest((previous) => ({
        ...previous,
        [request.id]: [],
      }));
    } catch (err) {
      console.error(
        "Failed to assign facility:",
        err
      );

      setError(
        `Failed to assign facility to Service Request #${request.id}.`
      );
    } finally {
      setAssigningRequestId(null);
    }
  };

  // =========================================================
  // PRIORITY STYLE
  // =========================================================

  const getPriorityStyle = (
    priority: ServiceRequest["priority"]
  ): React.CSSProperties => {
    const styles: Record<
      ServiceRequest["priority"],
      React.CSSProperties
    > = {
      LOW: {
        background: "#e8f5e9",
        color: "#2e7d32",
      },

      MEDIUM: {
        background: "#fff8e1",
        color: "#f57f17",
      },

      HIGH: {
        background: "#fff3e0",
        color: "#ef6c00",
      },

      CRITICAL: {
        background: "#ffebee",
        color: "#c62828",
      },
    };

    return styles[priority];
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (
    status: ServiceRequest["status"]
  ): React.CSSProperties => {
    const styles: Record<
      ServiceRequest["status"],
      React.CSSProperties
    > = {
      NEW: {
        background: "#e3f2fd",
        color: "#1565c0",
      },

      PENDING_FACILITY: {
        background: "#fff3e0",
        color: "#e65100",
      },

      ASSIGNED: {
        background: "#e8f5e9",
        color: "#2e7d32",
      },

      IN_PROGRESS: {
        background: "#ede7f6",
        color: "#4527a0",
      },

      COMPLETED: {
        background: "#e0f2f1",
        color: "#00695c",
      },

      CANCELLED: {
        background: "#eeeeee",
        color: "#616161",
      },
    };

    return styles[status];
  };

  // =========================================================
  // PAGE STYLES
  // =========================================================

  const pageStyle: React.CSSProperties = {
    padding: "25px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
    overflowX: "auto",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
  };

  const thStyle: React.CSSProperties = {
    padding: "12px",
    textAlign: "left",
    borderBottom:
      "2px solid #e5e7eb",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px",
    borderBottom:
      "1px solid #e5e7eb",
    verticalAlign: "top",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    minWidth: "190px",
    padding: "8px",
    borderRadius: "6px",
    border:
      "1px solid #d1d5db",
    marginBottom: "8px",
    background: "#ffffff",
  };

  const badgeStyle = (
    style: React.CSSProperties
  ): React.CSSProperties => ({
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    ...style,
  });

  const assignButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div style={pageStyle}>

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            Service Request Management
          </h2>

          <p
            style={{
              marginTop: "6px",
              color: "#6b7280",
            }}
          >
            Review customer service requests
            and assign facilities and equipment.
          </p>
        </div>

        <button
          onClick={() => {
            loadServiceRequests();
            loadFacilities();
          }}
          style={{
            padding: "9px 15px",
            border:
              "1px solid #d1d5db",
            borderRadius: "6px",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div
          style={{
            padding: "12px 15px",
            marginBottom: "15px",
            borderRadius: "8px",
            background: "#e8f5e9",
            color: "#2e7d32",
          }}
        >
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          style={{
            padding: "12px 15px",
            marginBottom: "15px",
            borderRadius: "8px",
            background: "#ffebee",
            color: "#c62828",
          }}
        >
          {error}
        </div>
      )}

      {/* SERVICE REQUEST TABLE */}

      <div style={cardStyle}>

        {loading ? (
          <p>
            Loading service requests...
          </p>
        ) : serviceRequests.length === 0 ? (
          <p>
            No service requests found.
          </p>
        ) : (
          <table style={tableStyle}>

            <thead>
              <tr>
                <th style={thStyle}>
                  ID
                </th>

                <th style={thStyle}>
                  Customer
                </th>

                <th style={thStyle}>
                  Problem
                </th>

                <th style={thStyle}>
                  Priority
                </th>

                <th style={thStyle}>
                  Facility
                </th>

                <th style={thStyle}>
                  Equipment
                </th>

                <th style={thStyle}>
                  Status
                </th>

                <th style={thStyle}>
                  Technician
                </th>

                <th style={thStyle}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {serviceRequests.map(
                (request) => {

                  const isPendingFacility =
                    request.status ===
                    "PENDING_FACILITY";

                  const requestEquipment =
                    equipmentByRequest[
                      request.id
                    ] || [];

                  return (
                    <tr
                      key={request.id}
                    >

                      {/* ID */}

                      <td style={tdStyle}>
                        <strong>
                          #{request.id}
                        </strong>
                      </td>

                      {/* CUSTOMER */}

                      <td style={tdStyle}>
                        <strong>
                          {request.customerName ||
                            "-"}
                        </strong>

                        <br />

                        <small
                          style={{
                            color:
                              "#6b7280",
                          }}
                        >
                          {request.customerEmail ||
                            "-"}
                        </small>
                      </td>

                      {/* PROBLEM */}

                      <td style={tdStyle}>
                        {request.problemDescription ||
                          "-"}
                      </td>

                      {/* PRIORITY */}

                      <td style={tdStyle}>
                        <span
                          style={badgeStyle(
                            getPriorityStyle(
                              request.priority
                            )
                          )}
                        >
                          {request.priority}
                        </span>
                      </td>

                      {/* FACILITY */}

                      <td style={tdStyle}>

                        {request.facilityId ? (

                          <strong>
                            Facility #
                            {request.facilityId}
                          </strong>

                        ) : isPendingFacility ? (

                          <select
                            style={
                              selectStyle
                            }
                            value={
                              selectedFacilities[
                                request.id
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              handleFacilityChange(
                                request.id,
                                event.target
                                  .value
                              )
                            }
                          >

                            <option value="">
                              Select Facility
                            </option>

                            {facilities.map(
                              (
                                facility
                              ) => (
                                <option
                                  key={
                                    facility.id
                                  }
                                  value={
                                    facility.id
                                  }
                                >
                                  {facility.name}

                                  {facility.address
                                    ? ` - ${facility.address}`
                                    : ""}
                                </option>
                              )
                            )}

                          </select>

                        ) : (

                          "-"

                        )}

                      </td>

                      {/* EQUIPMENT */}

                      <td style={tdStyle}>

                        {request.equipmentId ? (

                          <strong>
                            Equipment #
                            {request.equipmentId}
                          </strong>

                        ) : isPendingFacility ? (

                          <select
                            style={
                              selectStyle
                            }
                            value={
                              selectedEquipment[
                                request.id
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              setSelectedEquipment(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  [request.id]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            disabled={
                              !selectedFacilities[
                                request.id
                              ] ||
                              loadingEquipment[
                                request.id
                              ]
                            }
                          >

                            <option value="">
                              {!selectedFacilities[
                                request.id
                              ]
                                ? "Select Facility First"
                                : loadingEquipment[
                                    request.id
                                  ]
                                  ? "Loading Equipment..."
                                  : requestEquipment.length ===
                                      0
                                    ? "No Equipment Available"
                                    : "Select Equipment"}
                            </option>

                            {requestEquipment.map(
                              (
                                item
                              ) => (
                                <option
                                  key={
                                    item.id
                                  }
                                  value={
                                    item.id
                                  }
                                >
                                  {item.name}

                                  {item.equipmentCode
                                    ? ` (${item.equipmentCode})`
                                    : ""}

                                  {item.model
                                    ? ` - ${item.model}`
                                    : ""}
                                </option>
                              )
                            )}

                          </select>

                        ) : (

                          "-"

                        )}

                      </td>

                      {/* STATUS */}

                      <td style={tdStyle}>

                        <span
                          style={badgeStyle(
                            getStatusStyle(
                              request.status
                            )
                          )}
                        >
                          {
                            request.status
                          }
                        </span>

                      </td>

                      {/* TECHNICIAN */}

                      <td style={tdStyle}>

                        {request.technicianName ||
                          (request.technicianId
                            ? `Technician #${request.technicianId}`
                            : "Not Assigned")}

                      </td>

                      {/* ACTION */}

                      <td style={tdStyle}>

                        {isPendingFacility ? (

                          <button
                            style={{
                              ...assignButtonStyle,
                              opacity:
                                assigningRequestId ===
                                request.id
                                  ? 0.6
                                  : 1,
                            }}
                            onClick={() =>
                              assignFacility(
                                request
                              )
                            }
                            disabled={
                              assigningRequestId ===
                              request.id
                            }
                          >
                            {assigningRequestId ===
                            request.id
                              ? "Assigning..."
                              : "Assign Facility"}
                          </button>

                        ) : (

                          <span
                            style={{
                              color:
                                "#6b7280",
                              fontSize:
                                "13px",
                            }}
                          >
                            No action required
                          </span>

                        )}

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}

export default AdminServiceRequests;