
import { Link, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-logo">
          <h2>KEYSTONE</h2>

          <p>
            Field Service Management
          </p>
        </div>

        <nav className="admin-menu">

          <Link to="/admin">
            Dashboard
          </Link>

          <Link to="/admin/users">
            Users
          </Link>

          <Link to="/admin/customers">
            Customers
          </Link>

          <Link to="/admin/work-orders">
            Work Orders
          </Link>

          <Link to="/dispatcher">
            Dispatcher
          </Link>

          <Link to="/admin/technicians">
            Technicians
          </Link>

          <Link to="/admin/reports">
            Reports
          </Link>

          <Link to="/admin/settings">
            Settings
          </Link>

        </nav>

      </aside>

      {/* MAIN */}
      <main className="admin-main">

        {/* HEADER */}
        <header className="admin-header">

          <h1>
            Admin Dashboard
          </h1>

          <div className="admin-user">

            <span>
              {user?.name || "Administrator"}
            </span>

            <button
              onClick={handleLogout}
              style={{
                marginLeft: "15px",
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>

          </div>

        </header>

        {/* CONTENT */}
        <section className="admin-content">

          {children}

        </section>

      </main>

    </div>
  );
}

export default AdminLayout;
