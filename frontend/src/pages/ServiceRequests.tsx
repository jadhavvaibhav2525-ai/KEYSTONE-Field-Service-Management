import { useEffect, useState } from "react";
import api from "../api/axios";
import "./ServiceRequests.css";

interface User {
id?: number;
name?: string;
email?: string;
role?: string;
}

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
facility?: {
id: number;
name?: string;
};
}

interface ServiceRequest {
id: number;
customerId: number;
customerName: string;
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
createdAt?: string;
updatedAt?: string;
}

interface ServiceRequestForm {
facilityId: string;
equipmentId: string;
problemDescription: string;
priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

function ServiceRequests() {
// =========================================================
// LOGGED-IN USER
// =========================================================

const userData = localStorage.getItem("user");

let user: User | null = null;

try {
user = userData ? JSON.parse(userData) : null;
} catch (error) {
console.error(
"Invalid user data in localStorage:",
error
);
}

// =========================================================
// STATE
// =========================================================

const [facilities, setFacilities] =
useState<Facility[]>([]);

const [equipment, setEquipment] =
useState<Equipment[]>([]);

const [requests, setRequests] =
useState<ServiceRequest[]>([]);

const [loadingFacilities, setLoadingFacilities] =
useState(true);

const [loadingEquipment, setLoadingEquipment] =
useState(false);

const [loadingRequests, setLoadingRequests] =
useState(true);

const [submitting, setSubmitting] =
useState(false);

const [error, setError] =
useState("");

const [success, setSuccess] =
useState("");

const [form, setForm] =
useState<ServiceRequestForm>({
facilityId: "",
equipmentId: "",
problemDescription: "",
priority: "MEDIUM",
});

// =========================================================
// FETCH CUSTOMER FACILITIES
// =========================================================

const fetchFacilities = async () => {
try {
setLoadingFacilities(true);
setError("");


  const response = await api.get(
    "/api/facilities/customer/me"
  );

  setFacilities(response.data);
} catch (err) {
  console.error(
    "Failed to load facilities:",
    err
  );

  setError(
    "Failed to load your facilities."
  );
} finally {
  setLoadingFacilities(false);
}


};

// =========================================================
// FETCH EQUIPMENT BY FACILITY
// =========================================================

const fetchEquipment = async (
facilityId: string
) => {
if (!facilityId) {
setEquipment([]);
return;
}


try {
  setLoadingEquipment(true);

  const response = await api.get(
    `/api/equipment/facility/${facilityId}`
  );

  setEquipment(response.data);
} catch (err) {
  console.error(
    "Failed to load equipment:",
    err
  );

  setEquipment([]);

  setError(
    "Failed to load equipment for the selected facility."
  );
} finally {
  setLoadingEquipment(false);
}


};

// =========================================================
// FETCH CUSTOMER SERVICE REQUESTS
// =========================================================

const fetchRequests = async () => {
if (!user?.id) {
setError(
"Customer information is not available. Please login again."
);


  setLoadingRequests(false);

  return;
}

try {
  setLoadingRequests(true);

  const response = await api.get(
    `/api/service-requests/customer/${user.id}`
  );

  setRequests(response.data);
} catch (err) {
  console.error(
    "Failed to load service requests:",
    err
  );

  setError(
    "Failed to load service requests."
  );
} finally {
  setLoadingRequests(false);
}


};

// =========================================================
// INITIAL LOAD
// =========================================================

useEffect(() => {
fetchFacilities();
fetchRequests();
}, []);

// =========================================================
// FACILITY CHANGE
// =========================================================

const handleFacilityChange = (
event: React.ChangeEvent<HTMLSelectElement>
) => {
const facilityId =
event.target.value;


setForm((previous) => ({
  ...previous,
  facilityId,
  equipmentId: "",
}));

setEquipment([]);

setError("");
setSuccess("");

if (facilityId) {
  fetchEquipment(facilityId);
}


};

// =========================================================
// OTHER FORM CHANGES
// =========================================================

const handleChange = (
event: React.ChangeEvent<
HTMLInputElement |
HTMLTextAreaElement |
HTMLSelectElement
>
) => {
const {
name,
value,
} = event.target;


setForm((previous) => ({
  ...previous,
  [name]: value,
}));

setError("");
setSuccess("");


};

// =========================================================
// SUBMIT SERVICE REQUEST
// =========================================================

const handleSubmit = async (
event: React.FormEvent
) => {
event.preventDefault();


setError("");
setSuccess("");

// =======================================================
// CHECK CUSTOMER
// =======================================================

if (!user?.id) {
  setError(
    "Customer information is not available. Please login again."
  );

  return;
}

// =======================================================
// CRITICAL REQUEST WITHOUT FACILITY
// =======================================================

const criticalWithoutFacility =
  !form.facilityId &&
  form.priority === "CRITICAL";

// =======================================================
// CHECK FACILITY
// =======================================================

if (
  !form.facilityId &&
  !criticalWithoutFacility
) {
  setError(
    "Please select a facility."
  );

  return;
}

// =======================================================
// CHECK EQUIPMENT
// =======================================================

/*
 * Normal requests:
 * Facility + Equipment are required.
 *
 * Critical request without facility:
 * Equipment is also allowed to remain empty.
 */

if (
  form.facilityId &&
  !form.equipmentId
) {
  setError(
    "Please select equipment."
  );

  return;
}

// =======================================================
// CHECK DESCRIPTION
// =======================================================

if (
  !form.problemDescription.trim()
) {
  setError(
    "Please enter the problem description."
  );

  return;
}

// =======================================================
// SUBMIT
// =======================================================

try {
  setSubmitting(true);

  const requestData = {
    customerId: user.id,

    customerName:
      user.name || "",

    customerEmail:
      user.email || "",

    facilityId:
      form.facilityId
        ? Number(form.facilityId)
        : null,

    equipmentId:
      form.equipmentId
        ? Number(form.equipmentId)
        : null,

    problemDescription:
      form.problemDescription.trim(),

    priority:
      form.priority,
  };

  console.log(
    "Creating service request:",
    requestData
  );

  await api.post(
    "/api/service-requests",
    requestData
  );

  // =====================================================
  // CLEAR FORM
  // =====================================================

  setForm({
    facilityId: "",
    equipmentId: "",
    problemDescription: "",
    priority: "MEDIUM",
  });

  setEquipment([]);

  // =====================================================
  // SUCCESS MESSAGE
  // =====================================================

  if (criticalWithoutFacility) {
    setSuccess(
      "Critical service request submitted successfully. It is pending facility assignment by Admin."
    );
  } else {
    setSuccess(
      "Service request created successfully."
    );
  }

  // =====================================================
  // REFRESH REQUESTS
  // =====================================================

  await fetchRequests();

} catch (err) {
  console.error(
    "Failed to create service request:",
    err
  );

  setError(
    "Failed to create service request. Please try again."
  );
} finally {
  setSubmitting(false);
}


};

// =========================================================
// DATE FORMAT
// =========================================================

const formatDate = (
date?: string
) => {
if (!date) {
return "-";
}


return new Date(
  date
).toLocaleString();


};

// =========================================================
// STATUS CLASS
// =========================================================

const getStatusClass = (
status: string
) => {
return `status status-${status
      .toLowerCase()
      .replace(/_/g, "-")}`;
};

// =========================================================
// PRIORITY CLASS
// =========================================================

const getPriorityClass = (
priority: string
) => {
return `priority priority-${priority.toLowerCase()}`;
};

// =========================================================
// SUBMIT BUTTON STATE
// =========================================================

const submitDisabled =
submitting ||
loadingFacilities ||
loadingEquipment ||
(
form.priority !== "CRITICAL" &&
(
facilities.length === 0 ||
!form.facilityId ||
equipment.length === 0 ||
!form.equipmentId
)
);

// =========================================================
// UI
// =========================================================

return ( <div className="service-requests-page" style={styles.page}>


  {/* =====================================================
      HEADER
  ===================================================== */}

  <div style={styles.header}>

    <div>

      <h1 style={styles.title}>
        Service Requests
      </h1>

      <p style={styles.subtitle}>
        Create and track maintenance
        service requests.
      </p>

    </div>

  </div>

  {/* =====================================================
      CUSTOMER INFORMATION
  ===================================================== */}

  <div style={styles.userInfo}>

    <strong>
      Logged in as:
    </strong>{" "}

    {user?.name || "-"}{" "}

    (
    {user?.email || "-"}
    )

  </div>

  {/* =====================================================
      ERROR
  ===================================================== */}

  {error && (
    <div style={styles.error}>
      {error}
    </div>
  )}

  {/* =====================================================
      SUCCESS
  ===================================================== */}

  {success && (
    <div style={styles.success}>
      {success}
    </div>
  )}

  {/* =====================================================
      MAIN GRID
  ===================================================== */}

  <div className="service-requests-grid" style={styles.grid}>

    {/* ===================================================
        CREATE SERVICE REQUEST
    =================================================== */}

    <div className="service-requests-card" style={styles.card}>

      <h2 style={styles.cardTitle}>
        Create Service Request
      </h2>

      <form
        onSubmit={handleSubmit}
      >

        {/* =================================================
            CUSTOMER NAME
        ================================================= */}

        <div style={styles.formGroup}>

          <label style={styles.label}>
            Customer Name
          </label>

          <input
            type="text"
            value={
              user?.name || ""
            }
            style={{
              ...styles.input,
              background:
                "#f3f4f6",
            }}
            readOnly
          />

        </div>

        {/* =================================================
            CUSTOMER EMAIL
        ================================================= */}

        <div style={styles.formGroup}>

          <label style={styles.label}>
            Customer Email
          </label>

          <input
            type="email"
            value={
              user?.email || ""
            }
            style={{
              ...styles.input,
              background:
                "#f3f4f6",
            }}
            readOnly
          />

        </div>

        {/* =================================================
            FACILITY
        ================================================= */}

        <div style={styles.formGroup}>

          <label style={styles.label}>
            Facility
          </label>

          <select
            name="facilityId"
            value={
              form.facilityId
            }
            onChange={
              handleFacilityChange
            }
            style={styles.input}
            disabled={
              loadingFacilities
            }
          >

            <option value="">

              {loadingFacilities
                ? "Loading facilities..."
                : facilities.length === 0
                  ? "No facilities available"
                  : "Select Facility"}

            </option>

            {facilities.map(
              (facility) => (

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

          {/* =================================================
              NO FACILITY MESSAGE
          ================================================= */}

          {facilities.length === 0 &&
            !loadingFacilities && (

              <p
                style={
                  styles.helperText
                }
              >
                No facility has been assigned
                to your account yet.
              </p>

            )}

        </div>

        {/* =================================================
            EQUIPMENT
        ================================================= */}

        <div style={styles.formGroup}>

          <label style={styles.label}>
            Equipment
          </label>

          <select
            name="equipmentId"
            value={
              form.equipmentId
            }
            onChange={
              handleChange
            }
            style={styles.input}
            disabled={
              !form.facilityId ||
              loadingEquipment
            }
          >

            <option value="">

              {!form.facilityId
                ? "Select a facility first"
                : loadingEquipment
                  ? "Loading equipment..."
                  : equipment.length === 0
                    ? "No equipment available"
                    : "Select Equipment"}

            </option>

            {equipment.map(
              (item) => (

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

          {/* =================================================
              EQUIPMENT INFORMATION
          ================================================= */}

          {!form.facilityId && (
            <p
              style={
                styles.helperText
              }
            >
              Equipment is selected after
              choosing a facility.
            </p>
          )}

        </div>

        {/* =================================================
            PRIORITY
        ================================================= */}

        <div style={styles.formGroup}>

          <label style={styles.label}>
            Priority
          </label>

          <select
            name="priority"
            value={
              form.priority
            }
            onChange={
              handleChange
            }
            style={styles.input}
          >

            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="CRITICAL">
              Critical
            </option>

          </select>

        </div>

        {/* =================================================
            CRITICAL WITHOUT FACILITY MESSAGE
        ================================================= */}

        {form.priority === "CRITICAL" &&
          facilities.length === 0 && (

            <div
              style={
                styles.criticalNotice
              }
            >

              <strong>
                Urgent request:
              </strong>

              <div
                style={{
                  marginTop: "6px",
                }}
              >
                You can submit this critical
                request without a facility.
                Admin will assign a facility
                before the request continues
                to the work order process.
              </div>

            </div>

          )}

        {/* =================================================
            CRITICAL WITH FACILITY
        ================================================= */}

        {form.priority === "CRITICAL" &&
          form.facilityId && (

            <div
              style={
                styles.infoNotice
              }
            >
              Critical requests are treated
              as urgent and will be sent to
              the normal service workflow.
            </div>

          )}

        {/* =================================================
            PROBLEM DESCRIPTION
        ================================================= */}

        <div style={styles.formGroup}>

          <label style={styles.label}>
            Problem Description
          </label>

          <textarea
            name="problemDescription"
            value={
              form.problemDescription
            }
            onChange={
              handleChange
            }
            placeholder="Describe the maintenance problem..."
            rows={5}
            style={styles.textarea}
            required
          />

        </div>

        {/* =================================================
            SUBMIT BUTTON
        ================================================= */}

        <button
          type="submit"
          disabled={
            submitDisabled
          }
          style={{
            ...styles.button,

            opacity:
              submitDisabled
                ? 0.6
                : 1,

            cursor:
              submitDisabled
                ? "not-allowed"
                : "pointer",
          }}
        >

          {submitting
            ? "Submitting..."
            : form.priority === "CRITICAL" &&
                !form.facilityId
              ? "Submit Critical Request"
              : "Submit Service Request"}

        </button>

      </form>

    </div>

    {/* ===================================================
        MY SERVICE REQUESTS
    =================================================== */}

    <div className="service-requests-card" style={styles.card}>

      <div className="service-requests-list-header" style={styles.listHeader}>

        <div>

          <h2
            style={
              styles.cardTitle
            }
          >
            My Service Requests
          </h2>

          <p style={styles.count}>
            Total Requests:{" "}
            {requests.length}
          </p>

        </div>

        <button
          onClick={
            fetchRequests
          }
          style={
            styles.refreshButton
          }
          disabled={
            loadingRequests
          }
        >

          {loadingRequests
            ? "Loading..."
            : "Refresh"}

        </button>

      </div>

      {/* =================================================
          REQUEST LIST
      ================================================= */}

      {loadingRequests ? (

        <p style={styles.message}>
          Loading service
          requests...
        </p>

      ) : requests.length === 0 ? (

        <p style={styles.message}>
          No service requests
          found.
        </p>

      ) : (

        <div
          style={
            styles.requestList
          }
        >

          {requests.map(
            (request) => (

              <div
                className="service-requests-request-card"
                key={
                  request.id
                }
                style={
                  styles.requestCard
                }
              >

                {/* =======================================
                    REQUEST HEADER
                ======================================= */}

                <div
                  className="service-requests-request-top"
                  style={
                    styles.requestTop
                  }
                >

                  <div>

                    <h3
                      style={
                        styles.requestTitle
                      }
                    >
                      Service Request #
                      {
                        request.id
                      }
                    </h3>

                    <p
                      style={
                        styles.date
                      }
                    >
                      Created:{" "}
                      {formatDate(
                        request.createdAt
                      )}
                    </p>

                  </div>

                  <span
                    className={
                      getStatusClass(
                        request.status
                      )
                    }
                  >

                    {request.status
                      .replace(
                        /_/g,
                        " "
                      )}

                  </span>

                </div>

                {/* =======================================
                    PENDING FACILITY NOTICE
                ======================================= */}

                {request.status ===
                  "PENDING_FACILITY" && (

                  <div
                    style={
                      styles.pendingNotice
                    }
                  >

                    <strong>
                      Facility assignment pending
                    </strong>

                    <div
                      style={{
                        marginTop: "5px",
                      }}
                    >
                      Your request has been received.
                      Admin needs to assign a facility
                      before the service work can continue.
                    </div>

                  </div>

                )}

                {/* =======================================
                    DESCRIPTION
                ======================================= */}

                <p
                  style={
                    styles.description
                  }
                >
                  {
                    request.problemDescription
                  }
                </p>

                {/* =======================================
                    DETAILS
                ======================================= */}

                <div
                  className="service-requests-details"
                  style={
                    styles.details
                  }
                >

                  <div>

                    <strong>
                      Priority:
                    </strong>{" "}

                    <span
                      className={
                        getPriorityClass(
                          request.priority
                        )
                      }
                    >
                      {
                        request.priority
                      }
                    </span>

                  </div>

                  <div>

                    <strong>
                      Facility:
                    </strong>{" "}

                    {
                      request.facilityId ??
                      "-"
                    }

                  </div>

                  <div>

                    <strong>
                      Equipment:
                    </strong>{" "}

                    {
                      request.equipmentId ??
                      "-"
                    }

                  </div>

                </div>

                {/* =======================================
                    UPDATED
                ======================================= */}

                <div
                  style={
                    styles.updated
                  }
                >

                  Last Updated:{" "}
                  {formatDate(
                    request.updatedAt
                  )}

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  </div>

</div>


);
}

// =============================================================
// STYLES
// =============================================================

const styles: Record<
string,
React.CSSProperties

> = {

page: {
padding: "30px",
minHeight: "100vh",
background: "#f5f7fb",
},

header: {
marginBottom: "20px",
},

title: {
margin: 0,
fontSize: "30px",
fontWeight: 700,
},

subtitle: {
marginTop: "8px",
color: "#666",
},

userInfo: {
background: "#e8f0fe",
color: "#1e3a8a",
padding: "12px 15px",
borderRadius: "7px",
marginBottom: "20px",
fontSize: "14px",
},

grid: {
display: "grid",
gridTemplateColumns:
"minmax(320px, 420px) 1fr",
gap: "25px",
alignItems: "start",
},

card: {
background: "#fff",
borderRadius: "12px",
padding: "24px",
boxShadow:
"0 2px 10px rgba(0,0,0,0.08)",
},

cardTitle: {
marginTop: 0,
marginBottom: "20px",
fontSize: "21px",
},

formGroup: {
marginBottom: "16px",
flex: 1,
},

label: {
display: "block",
marginBottom: "7px",
fontWeight: 600,
fontSize: "14px",
},

input: {
width: "100%",
padding: "11px",
border:
"1px solid #d5d9e2",
borderRadius: "7px",
boxSizing: "border-box",
fontSize: "14px",
background: "#fff",
},

textarea: {
width: "100%",
padding: "11px",
border:
"1px solid #d5d9e2",
borderRadius: "7px",
boxSizing: "border-box",
fontSize: "14px",
resize: "vertical",
},

button: {
width: "100%",
padding: "12px",
border: "none",
borderRadius: "7px",
background: "#2563eb",
color: "#fff",
fontWeight: 600,
},

refreshButton: {
padding: "9px 15px",
border:
"1px solid #d5d9e2",
borderRadius: "7px",
background: "#fff",
cursor: "pointer",
},

error: {
padding: "12px 15px",
marginBottom: "20px",
borderRadius: "7px",
background: "#fee2e2",
color: "#991b1b",
},

success: {
padding: "12px 15px",
marginBottom: "20px",
borderRadius: "7px",
background: "#dcfce7",
color: "#166534",
},

criticalNotice: {
padding: "12px",
marginBottom: "16px",
borderRadius: "7px",
background: "#fff7ed",
color: "#9a3412",
fontSize: "13px",
border:
"1px solid #fed7aa",
},

infoNotice: {
padding: "12px",
marginBottom: "16px",
borderRadius: "7px",
background: "#eff6ff",
color: "#1d4ed8",
fontSize: "13px",
border:
"1px solid #bfdbfe",
},

pendingNotice: {
padding: "12px",
marginTop: "15px",
marginBottom: "10px",
borderRadius: "7px",
background: "#fff7ed",
color: "#9a3412",
fontSize: "13px",
border:
"1px solid #fed7aa",
},

helperText: {
marginTop: "6px",
marginBottom: 0,
color: "#777",
fontSize: "12px",
},

listHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
},

count: {
marginTop: "-10px",
color: "#666",
fontSize: "14px",
},

message: {
color: "#666",
padding: "20px 0",
},

requestList: {
display: "flex",
flexDirection: "column",
gap: "15px",
},

requestCard: {
border:
"1px solid #e1e5ec",
borderRadius: "10px",
padding: "18px",
},

requestTop: {
display: "flex",
justifyContent:
"space-between",
gap: "15px",
alignItems: "flex-start",
},

requestTitle: {
margin: 0,
fontSize: "17px",
},

date: {
margin: "6px 0 0",
color: "#777",
fontSize: "12px",
},

description: {
margin: "15px 0",
lineHeight: 1.5,
},

details: {
display: "flex",
gap: "20px",
flexWrap: "wrap",
fontSize: "13px",
},

updated: {
marginTop: "12px",
fontSize: "12px",
color: "#777",
},
};

export default ServiceRequests;
