import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import logo from "../assets/logo.png";
import "../styles/auth.css";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "./AuthIcons";

const Login = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    user_code: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.user_code.trim() || !data.password) {
      return toast.error("All fields are required");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/login`,
        {
          user_code: data.user_code.trim(),
          password: data.password,
        }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role || "");
      localStorage.setItem("user_code", res.data.user_code || data.user_code.trim());

      toast.success("Login successful");

      if (res.data.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="logo-box">
            <img src={logo} alt="AVG Logo" />
          </div>

          <h1>
            <span className="light-text">Welcome </span>
            <span className="accent">back!</span>
          </h1>

          <p>Sign in to continue and manage your staking account.</p>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <h2 className="auth-heading">
              Login in to <span className="accent">your account</span>
            </h2>
            <p className="auth-subtitle">Use your user code to continue.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>User Code</label>
                <div className="input-shell">
                  <span className="input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="text"
                    name="user_code"
                    placeholder="Enter user code"
                    value={data.user_code}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-shell">
                  <span className="input-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    value={data.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="meta-row">
                <label className="remember">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={data.remember}
                    onChange={handleChange}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="link-btn"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div className="footer-link">
                Don’t have an account?{" "}
                <button type="button" onClick={() => navigate("/signup")}>
                  Create one
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;