import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import logo from "../assets/logo.png";
import "../styles/auth.css";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from "./AuthIcons";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralCode =
      params.get("ref") ||
      params.get("user_code") ||
      params.get("referral_code") ||
      "";

    if (referralCode) {
      setData((prev) => ({
        ...prev,
        referralCode,
      }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: data.name.trim(),
      lastname: data.lastname.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: data.password,
      referralCode: data.referralCode.trim() || undefined,
    };

    if (
      !payload.name ||
      !payload.lastname ||
      !payload.email ||
      !payload.phone ||
      !payload.password ||
      !data.confirmPassword
    ) {
      return toast.error("All fields are required");
    }

    if (payload.password !== data.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/signup`,
        payload
      );

      const signupState = {
        signupId: res.data.signupId,
        email: payload.email,
        formData: {
          ...payload,
          confirmPassword: data.confirmPassword,
        },
      };

      sessionStorage.setItem("pendingSignup", JSON.stringify(signupState));

      toast.success(res.data.message || "OTP sent to email");

      navigate("/otp", {
        state: signupState,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
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
            <span className="light-text">Join </span>
            <span className="accent">AVG</span>
          </h1>

          <p>Create account and start earning with your staking plan.</p>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <h2 className="auth-heading">
              Create your <span className="accent">account</span>
            </h2>
            <p className="auth-subtitle">Register to receive your OTP.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>First Name</label>
                <div className="input-shell">
                  <span className="input-icon">
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your first name"
                    value={data.name}
                    onChange={handleChange}
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div className="field">
                <label>Last Name</label>
                <div className="input-shell">
                  <span className="input-icon">
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    name="lastname"
                    placeholder="Your last name"
                    value={data.lastname}
                    onChange={handleChange}
                    autoComplete="family-name"
                  />
                </div>
              </div>

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
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <label>Phone number</label>
                <div className="input-shell">
                  <span className="input-icon">
                    <PhoneIcon />
                  </span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="10 digit mobile number"
                    value={data.phone}
                    onChange={handleChange}
                    autoComplete="tel"
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
                    placeholder="Create a password"
                    value={data.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Referral Code (optional)</label>
                <div className="input-shell">
                  <span className="input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="text"
                    name="referralCode"
                    placeholder="Referral code"
                    value={data.referralCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>

              <div className="divider">or</div>

              <div className="footer-link">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")}>
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;