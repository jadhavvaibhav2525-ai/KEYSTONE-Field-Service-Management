import { useEffect, useState } from "react";
import api from "../api/axios";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");

  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/api/users");

      console.log("USERS API RESPONSE:", response.data);

      setUsers(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("CUSTOMER");
    setEditingUser(null);
    setError("");
  };

  const handleCreate = async () => {
    try {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!email.trim()) {
        setError("Email is required.");
        return;
      }

      if (!password.trim()) {
        setError("Password is required.");
        return;
      }

      await api.post("/api/users", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password,
        role: role,
      });

      setSuccess("User created successfully.");
      setError("");

      resetForm();
      setShowForm(false);

      await fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user.");
      setSuccess("");
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) {
      return;
    }

    try {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!email.trim()) {
        setError("Email is required.");
        return;
      }

      await api.put(`/api/users/${editingUser.id}`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
      });

      setSuccess("User updated successfully.");
      setError("");

      resetForm();
      setShowForm(false);

      await fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user.");
      setSuccess("");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/users/${id}`);

      setSuccess("User deleted successfully.");
      setError("");

      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user.");
      setSuccess("");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);

    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setPassword("");
    setRole(user.role || "CUSTOMER");

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredUsers = users.filter((user) => {
    const search = searchText.toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.phone || "").toLowerCase().includes(search)
    );
  });

  const customerCount = users.filter(
    (user) => user.role === "CUSTOMER"
  ).length;

  const technicianCount = users.filter(
    (user) => user.role === "TECHNICIAN"
  ).length;

  const dispatcherCount = users.filter(
    (user) => user.role === "DISPATCHER"
  ).length;

  const managerCount = users.filter(
    (user) => user.role === "MANAGER"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "ADMIN"
  ).length;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontWeight: 600,
    fontSize: "14px",
    color: "#374151",
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                color: "#111827",
              }}
            >
              User Management
            </h1>

            <p
              style={{
                marginTop: "6px",
                color: "#6b7280",
              }}
            >
              Manage customers, technicians, managers and other users.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              ...buttonStyle,
              background: "#2563eb",
              color: "white",
            }}
          >
            + Add User
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <StatCard title="CUSTOMER" value={customerCount} />
          <StatCard title="TECHNICIAN" value={technicianCount} />
          <StatCard title="DISPATCHER" value={dispatcherCount} />
          <StatCard title="MANAGER" value={managerCount} />
          <StatCard title="ADMIN" value={adminCount} />
        </div>

        {showForm && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "20px",
              }}
            >
              {editingUser ? "Edit User" : "Add New User"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "18px",
              }}
            >
              <div>
                <label style={labelStyle}>Name</label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  maxLength={15}
                  style={inputStyle}
                />
              </div>

              {!editingUser && (
                <div>
                  <label style={labelStyle}>Password</label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={inputStyle}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>Role</label>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="TECHNICIAN">TECHNICIAN</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={editingUser ? handleUpdate : handleCreate}
                style={{
                  ...buttonStyle,
                  background: "#2563eb",
                  color: "white",
                }}
              >
                {editingUser ? "Update User" : "Create User"}
              </button>

              <button
                onClick={handleCancel}
                style={{
                  ...buttonStyle,
                  background: "#e5e7eb",
                  color: "#111827",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: "15px",
              padding: "12px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
            }}
          >
            {success}
          </div>
        )}

        {!showForm && error && (
          <div
            style={{
              marginBottom: "15px",
              padding: "12px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: 0 }}>All Users</h2>

            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email or phone..."
              style={{
                ...inputStyle,
                maxWidth: "350px",
              }}
            />
          </div>

          {loading ? (
            <p>Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No users found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "850px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={tdStyle}>{user.id}</td>

                      <td style={tdStyle}>{user.name}</td>

                      <td style={tdStyle}>{user.email}</td>

                      <td style={tdStyle}>
                        {user.phone || "N/A"}
                      </td>

                      <td style={tdStyle}>{user.role}</td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() => handleEdit(user)}
                            style={{
                              ...buttonStyle,
                              background: "#dbeafe",
                              color: "#1d4ed8",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(user.id)}
                            style={{
                              ...buttonStyle,
                              background: "#fee2e2",
                              color: "#b91c1c",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number;
}) => {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginTop: "5px",
        }}
      >
        {value}
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #e5e7eb",
  color: "#374151",
  fontSize: "14px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#4b5563",
  fontSize: "14px",
};

export default Users;