import { useEffect, useState } from "react";
import { slaApi, type SLA } from "../api/slaApi";

function formatDateTime(value: string | null): string {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleString();
}

function statusLabel(value: boolean | null): string {
  if (value === null) return "Pending";
  return value ? "Met" : "Breached";
}

export default function SLA() {
  const [records, setRecords] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSLAs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await slaApi.getAll();
      setRecords(data);
    } catch (err) {
      console.error("Failed to load SLA records:", err);
      setError("Unable to load SLA records. Check your login and backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSLAs();
  }, []);

  const handleResponse = async (id: number) => {
    try {
      await slaApi.recordResponse(id);
      await loadSLAs();
    } catch (err) {
      console.error("Failed to record response:", err);
      setError("Could not record technician response.");
    }
  };

  const handleResolution = async (id: number) => {
    try {
      await slaApi.recordResolution(id);
      await loadSLAs();
    } catch (err) {
      console.error("Failed to record resolution:", err);
      setError("Could not record service resolution.");
    }
  };

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading SLA records...</div>;
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>SLA Management</h1>
      <p>Monitor response and resolution targets for service requests.</p>

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <button onClick={() => void loadSLAs()}>
        Refresh
      </button>

      {records.length === 0 ? (
        <p>No SLA records found.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                <th style={cellStyle}>SLA ID</th>
                <th style={cellStyle}>Service Request</th>
                <th style={cellStyle}>Priority</th>
                <th style={cellStyle}>Response Due</th>
                <th style={cellStyle}>Response Status</th>
                <th style={cellStyle}>Resolution Due</th>
                <th style={cellStyle}>Resolution Status</th>
                <th style={cellStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td style={cellStyle}>{record.id}</td>
                  <td style={cellStyle}>{record.serviceRequestId}</td>
                  <td style={cellStyle}>{record.priority}</td>
                  <td style={cellStyle}>
                    {formatDateTime(record.responseDueAt)}
                  </td>
                  <td style={cellStyle}>
                    {statusLabel(record.responseMet)}
                  </td>
                  <td style={cellStyle}>
                    {formatDateTime(record.resolutionDueAt)}
                  </td>
                  <td style={cellStyle}>
                    {statusLabel(record.resolutionMet)}
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => void handleResponse(record.id)}
                      disabled={record.respondedAt !== null}
                    >
                      {record.respondedAt ? "Response Recorded" : "Record Response"}
                    </button>

                    {" "}

                    <button
                      onClick={() => void handleResolution(record.id)}
                      disabled={record.resolvedAt !== null}
                    >
                      {record.resolvedAt ? "Resolved" : "Record Resolution"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "10px",
  verticalAlign: "top",
};