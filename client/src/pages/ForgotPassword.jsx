import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import logo from "../assets/logo.png";
import "../styles/auth.css";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon } from "./AuthIcons";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [data, setData] = useState({
    email: "",
    user_code: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [resetId, setResetId] = useState(() => {
    return sessionStorage.getItem("forgotResetId") || "";
  });

  const [resetToken, setResetToken] = useState(() => {
    return sessionStorage.getItem("forgotResetToken") || "";
  });

  useEffect(() => {
    if (resetToken) setStep(3);
    else if (resetId) setStep(2);
  }, [resetId, resetToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!data.email.trim() || !data.user_code.trim()) {
      return toast.error("Email and user code are required");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/forgot-password/request`,
        {
          email: data.email.trim(),
          user_code: data.user_code.trim(),
        }
      );

      const id = res.data?.resetId;
      if (!id) {
        throw new Error("Reset id not returned");
      }

      sessionStorage.setItem("forgotResetId", id);
      sessionStorage.removeItem("forgotResetToken");

      setResetId(id);
      setResetToken("");
      setStep(2);

      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!data.otp.trim()) {
      return toast.error("OTP is required");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/forgot-password/verify-otp`,
        {
          resetId,
          otp: data.otp.trim(),
        }
      );

      const token = res.data?.resetToken;
      if (!token) {
        throw new Error("Reset token not returned");
      }

      sessionStorage.setItem("forgotResetToken", token);
      setResetToken(token);
      setStep(3);

      toast.success("OTP verified");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!data.newPassword || !data.confirmPassword) {
      return toast.error("All password fields are required");
    }

    if (data.newPassword !== data.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/forgot-password/reset`,
        {
          resetToken,
          newPassword: data.newPassword,
        }
      );

      sessionStorage.removeItem("forgotResetId");
      sessionStorage.removeItem("forgotResetToken");

      toast.success("Password updated successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed");
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
            <span className="light-text">Reset </span>
            <span className="accent">Password</span>
          </h1>

          <p>Use your email and user code to reset the correct account.</p>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            {step === 1 && (
              <>
                <h2 className="auth-heading">
                  Forgot <span className="accent">Password</span>
                </h2>
                <p className="auth-subtitle">
                  Enter your email and user code.
                </p>

                <form className="auth-form" onSubmit={handleRequestOtp}>
                  <div className="field">
                    <label>Email</label>
                    <div className="input-shell">
                      <span className="input-icon">
                        <MailIcon />
                      </span>
                      <input
                        type="email"
                        name="email"
                        placeholder="you@domain.com"
                        value={data.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>User Code</label>
                    <div className="input-shell">
                      <span className="input-icon">
                        <UserIcon />
                      </span>
                      <input
                        type="text"
                        name="user_code"
                        placeholder="Enter user code"
                        value={data.user_code}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button className="primary-btn" type="submit" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <div className="footer-link">
                    Back to{" "}
                    <button type="button" onClick={() => navigate("/login")}>
                      Login
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="auth-heading">
                  Verify <span className="accent">OTP</span>
                </h2>
                <p className="auth-subtitle">
                  OTP sent to <b>{data.email}</b>
                </p>

                <form className="auth-form" onSubmit={handleVerifyOtp}>
                  <div className="field">
                    <label>OTP</label>
                    <div className="input-shell">
                      <span className="input-icon">
                        <MailIcon />
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        name="otp"
                        placeholder="Enter OTP"
                        value={data.otp}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button className="primary-btn" type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <div className="footer-link">
                    Wrong account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.removeItem("forgotResetId");
                        sessionStorage.removeItem("forgotResetToken");
                        setResetId("");
                        setResetToken("");
                        setStep(1);
                      }}
                    >
                      Start again
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="auth-heading">
                  Set <span className="accent">New Password</span>
                </h2>
                <p className="auth-subtitle">
                  Create a new password for <b>{data.user_code}</b>.
                </p>

                <form className="auth-form" onSubmit={handleResetPassword}>
                  <div className="field">
                    <label>New Password</label>
                    <div className="input-shell">
                      <span className="input-icon">
                        <LockIcon />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="New password"
                        value={data.newPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label>Confirm Password</label>
                    <div className="input-shell">
                      <span className="input-icon">
                        <LockIcon />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm password"
                        value={data.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <button className="primary-btn" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;