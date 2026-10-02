import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

type RecoveryStep =
  | "login"
  | "register"
  | "email"
  | "verify"
  | "reset";

function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState<RecoveryStep>("login");

  // Login / recovery
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Customer registration
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      switch (user.role) {
        case "ADMIN":
          navigate("/admin");
          break;

        case "DISPATCHER":
          navigate("/dispatcher");
          break;

        case "MANAGER":
          navigate("/manager");
          break;

        case "TECHNICIAN":
          navigate("/technician");
          break;

        case "CUSTOMER":
          navigate("/customer");
          break;

        default:
          setError("Unknown user role.");
      }
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // NEW CUSTOMER REGISTRATION
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (registerName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (registerPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/register", {
        name: registerName.trim(),
        email: registerEmail.trim(),
        phone: registerPhone.trim(),
        password: registerPassword,
      });

      setMessage(
        "Customer account created successfully. Please login with your email and password."
      );

      // Put registered email into login form
      setEmail(registerEmail.trim());

      // Clear registration fields
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");

      // Return to login
      setStep("login");
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data ||
        "Unable to create account. Please try again.";

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(
        response.data ||
          "If an account exists for this email, a passcode has been sent."
      );

      setStep("verify");
    } catch (err: any) {
      setError(
        err.response?.data ||
          "Unable to request a passcode. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/verify-code", {
        email: email.trim(),
        code: code.trim(),
      });

      setMessage(response.data || "Passcode verified.");
      setStep("reset");
    } catch (err: any) {
      setError(
        err.response?.data ||
          "Invalid or expired passcode. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      setMessage(
        response.data ||
          "Password reset successfully. You can now log in."
      );

      setPassword("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");

      setStep("login");
    } catch (err: any) {
      setError(
        err.response?.data ||
          "Unable to reset password. Please verify your passcode and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const returnToLogin = () => {
    setStep("login");
    setError("");
    setMessage("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const openRegistration = () => {
    setStep("register");
    setError("");
    setMessage("");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>KEYSTONE</h1>

        <p className="login-subtitle">
          Field Service Management Platform
        </p>

        {/* LOGIN */}
        {step === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>

              <input
                type="email"
                id="login-email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>

              <input
                type="password"
                id="login-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "red",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                style={{
                  color: "green",
                  marginBottom: "15px",
                }}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

            {/* FORGOT PASSWORD */}
            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setStep("email");
                setError("");
                setMessage("");
              }}
              style={{
                display: "block",
                margin: "15px auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Forgot Password?
            </button>

            {/* CUSTOMER REGISTRATION */}
            <div
              style={{
                marginTop: "25px",
                paddingTop: "20px",
                borderTop: "1px solid #ddd",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  marginBottom: "8px",
                  color: "#555",
                }}
              >
                New to KEYSTONE?
              </p>

              <button
                type="button"
                onClick={openRegistration}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0d6efd",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Create Customer Account
              </button>
            </div>
          </form>
        )}

        {/* CUSTOMER REGISTRATION */}
        {step === "register" && (
          <form onSubmit={handleRegister}>
            <h2>Create Customer Account</h2>

            <p
              style={{
                color: "#666",
                marginBottom: "20px",
              }}
            >
              Create your KEYSTONE customer account to manage your
              service requests and work orders.
            </p>

            <div className="form-group">
              <label htmlFor="register-name">Full Name</label>

              <input
                type="text"
                id="register-name"
                placeholder="Enter your full name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Email</label>

              <input
                type="email"
                id="register-email"
                placeholder="Enter your email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-phone">Phone Number</label>

              <input
                type="tel"
                id="register-phone"
                placeholder="Enter your phone number"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Password</label>

              <input
                type="password"
                id="register-password"
                placeholder="Minimum 8 characters"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm-password">
                Confirm Password
              </label>

              <input
                type="password"
                id="register-confirm-password"
                placeholder="Re-enter your password"
                value={registerConfirmPassword}
                onChange={(e) =>
                  setRegisterConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "red",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>

            <button
              type="button"
              className="forgot-password"
              onClick={returnToLogin}
              style={{
                display: "block",
                margin: "15px auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Already have an account? Back to Login
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD - EMAIL */}
        {step === "email" && (
          <form onSubmit={handleRequestCode}>
            <h2>Forgot Password</h2>

            <p>
              Enter your registered email address. If an account exists,
              we will send you a 6-digit passcode.
            </p>

            <div className="form-group">
              <label htmlFor="recovery-email">
                Registered Email
              </label>

              <input
                type="email"
                id="recovery-email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "red",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "SENDING..." : "SEND PASSCODE"}
            </button>

            <button
              type="button"
              className="forgot-password"
              onClick={returnToLogin}
              style={{
                display: "block",
                margin: "15px auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* VERIFY CODE */}
        {step === "verify" && (
          <form onSubmit={handleVerifyCode}>
            <h2>Verify Passcode</h2>

            <p>
              Enter the 6-digit passcode sent to{" "}
              <strong>{email}</strong>. The passcode expires after
              10 minutes.
            </p>

            <div className="form-group">
              <label htmlFor="reset-code">
                6-Digit Passcode
              </label>

              <input
                type="text"
                id="reset-code"
                placeholder="Enter passcode"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>

            {message && (
              <p
                role="status"
                style={{
                  color: "green",
                  marginBottom: "15px",
                }}
              >
                {message}
              </p>
            )}

            {error && (
              <p
                role="alert"
                style={{
                  color: "red",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading || code.length !== 6}
            >
              {loading ? "VERIFYING..." : "VERIFY PASSCODE"}
            </button>

            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
                setMessage("");
              }}
              style={{
                display: "block",
                margin: "15px auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Request a New Passcode
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword}>
            <h2>Set New Password</h2>

            <p>Create a new password for your KEYSTONE account.</p>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>

              <input
                type="password"
                id="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                type="password"
                id="confirm-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "red",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "RESETTING PASSWORD..." : "RESET PASSWORD"}
            </button>

            <button
              type="button"
              className="forgot-password"
              onClick={returnToLogin}
              style={{
                display: "block",
                margin: "15px auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;