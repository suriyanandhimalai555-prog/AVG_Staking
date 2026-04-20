import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import axios from "axios";
import { toast } from "react-hot-toast";

const NAVBAR = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [createdUserCode, setCreatedUserCode] = useState("");
  const [showUserCodeModal, setShowUserCodeModal] = useState(false);

  const [loginData, setLoginData] = useState({
    user_code: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const [otpData, setOtpData] = useState({
    email: "",
    otp: "",
  });

  const [signupId, setSignupId] = useState("");

  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralCode =
      params.get("ref") ||
      params.get("user_code") ||
      params.get("referral_code") ||
      "";

    if (referralCode) {
      setSignupData((prev) => ({
        ...prev,
        referralCode,
      }));
      setShowSignup(true);
      setShowLogin(false);
    }
  }, [location.search]);

  const handleScroll = (sectionId) => {
    setMobileMenuOpen(false);

    if (location.pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const isActive = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) return false;

    const scrollPosition = window.scrollY + 100;
    const top = element.offsetTop;
    const bottom = top + element.offsetHeight;

    return scrollPosition >= top && scrollPosition < bottom;
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginData.user_code || !loginData.password) {
      return toast.error("All fields are required ⚠️");
    }

    try {
      setLoading(true);

      const res = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/auth/login`, {
        user_code: loginData.user_code,
        password: loginData.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user_code", res.data.user_code || "");

      setShowLogin(false);
      toast.success("Login successful 🎉");

      if (res.data.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      lastname,
      email,
      phone,
      password,
      confirmPassword,
      referralCode,
    } = signupData;

    if (!name || !lastname || !email || !phone || !password) {
      return toast.error("All fields are required ⚠️");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match ❌");
    }

    try {
      setLoading(true);

      const res = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/auth/signup`, {
        name,
        lastname,
        email,
        phone,
        password,
        referralCode: referralCode.trim() || undefined,
      });

      setSignupId(res.data.signupId); // 🔥 IMPORTANT

      toast.success(res.data.message || "OTP sent to email");

      setOtpData({
        email: email.trim(),
        otp: "",
      });

      setShowSignup(false);
      setShowOtpModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otpData.email || !otpData.otp) {
      return toast.error("OTP is required ⚠️");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/auth/verify-signup-otp`,
        {
          signupId,   // 🔥 THIS IS THE FIX
          otp: otpData.otp,
        }
      );

      setCreatedUserCode(res.data.user_code || "");
      setShowOtpModal(false);
      setShowUserCodeModal(true);

      toast.success("Email verified and account created 🎉");

      setSignupData({
        name: "",
        lastname: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        referralCode: signupData.referralCode || "",
      });

      setOtpData({
        email: "",
        otp: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);

      const { name, lastname, email, phone, password, referralCode } =
        signupData;

      if (!name || !lastname || !email || !phone || !password) {
        return toast.error("Signup data missing, please fill the form again ⚠️");
      }

      await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/auth/signup`, {
        name,
        lastname,
        email,
        phone,
        password,
        referralCode: referralCode.trim() || undefined,
      });

      setOtpData({
        email: email.trim(),
        otp: "",
      });

      toast.success("OTP resent to your email ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Resend OTP failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const openLogin = () => {
    setShowSignup(false);
    setShowOtpModal(false);
    setShowLogin(true);
  };

  const openSignup = () => {
    setShowLogin(false);
    setShowOtpModal(false);
    setShowSignup(true);
  };

  const referralLink = createdUserCode
    ? `${window.location.origin}/auth/registration?referral_code=${encodeURIComponent(
      createdUserCode
    )}`
    : "";

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div
            className="logo-section"
            onClick={() => {
              handleScroll("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img src={logo} alt="AVG Logo" className="logo" />
            <span className="brand-name">AVG</span>
          </div>

          <div
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <div className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <div className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
          </div>

          <ul className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            {["home", "about", "plan", "roadmap", "features", "faq"].map(
              (item) => (
                <li
                  key={item}
                  className={`nav-item ${isActive(item) ? "active" : ""}`}
                  onClick={() => handleScroll(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </li>
              )
            )}

            <li
              className="nav-item mobile-login-btn"
              // onClick={() => {
              //   setShowLogin(true);
              //   setShowSignup(false);
              //   setShowOtpModal(false);
              //   setMobileMenuOpen(false);
              // }}
  onClick={() => navigate("/login")}
            >
              Log In
            </li>
          </ul>

          {/* <button
            className="login-btn desktop-only"
            onClick={() => {
              setShowLogin(true);
              setShowSignup(false);
              setShowOtpModal(false);
            }}
          >
            Log In
          </button> */}

          <button
  className="login-btn desktop-only"
  onClick={() => navigate("/login")}
>
  Log In
</button>
        </div>
      </nav>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <a
              href="#"
              className="back-home"
              onClick={(e) => {
                e.preventDefault();
                setShowLogin(false);
                handleScroll("home");
              }}
            >
              ← Back to Home
            </a>

            <div className="modal-logo">
              <img src={logo} alt="AVG Logo" />
              <span>AVG</span>
            </div>

            <h2 className="welcome-text">Welcome to AVG Staking</h2>
            <p className="signin-text">Sign in to continue</p>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>User Code</label>
                <input
                  type="text"
                  name="user_code"
                  placeholder="Enter your user code"
                  className="form-input"
                  value={loginData.user_code}
                  onChange={handleLoginChange}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    className="form-input"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    style={{ paddingRight: "45px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {showLoginPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <a href="#" className="forgot-password">
                Forgot password?
              </a>

              <button type="submit" className="continue-btn" disabled={loading}>
                {loading ? "Logging in..." : "Continue"}
              </button>

              <p style={{ textAlign: "center", marginTop: "14px", color: "#fff" }}>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={openSignup}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ff3df2",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  Sign Up
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="modal-overlay" onClick={() => setShowSignup(false)}>
          <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="signup-title">Create Account</h2>

            <form className="signup-form" onSubmit={handleSignupSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter First Name"
                    value={signupData.name}
                    onChange={handleSignupChange}
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastname"
                    placeholder="Enter Last Name"
                    value={signupData.lastname}
                    onChange={handleSignupChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+91 Enter Phone"
                    value={signupData.phone}
                    onChange={handleSignupChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter Password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                  />
                </div>
              </div>

              <div className="form-group full">
                <label>Referral User Code (optional)</label>
                <input
                  type="text"
                  name="referralCode"
                  placeholder="Enter inviter's user code"
                  value={signupData.referralCode}
                  onChange={handleSignupChange}
                />
              </div>

              <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </button>

              <p className="switch-text">
                Already have an account?{" "}
                <span onClick={openLogin}>Login</span>
              </p>
            </form>
          </div>
        </div>
      )}

      {showOtpModal && (
        <div className="modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="signup-title">Verify OTP</h2>

            <p style={{ marginBottom: "16px", textAlign: "center" }}>
              We sent an OTP to <b>{otpData.email}</b>
            </p>

            <form className="signup-form" onSubmit={handleVerifyOtp}>
              <div className="form-group full">
                <label>OTP</label>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={otpData.otp}
                  onChange={(e) =>
                    setOtpData((prev) => ({
                      ...prev,
                      otp: e.target.value,
                    }))
                  }
                />
              </div>

              <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <p className="switch-text">
                Didn&apos;t get OTP?{" "}
                <span onClick={handleResendOtp}>Resend OTP</span>
              </p>

              <p className="switch-text">
                Back to{" "}
                <span onClick={() => setShowOtpModal(false)}>Signup</span>
              </p>
            </form>
          </div>
        </div>
      )}

      {showUserCodeModal && (
        <div className="modal-overlay">
          <div className="signup-modal" style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: "10px" }}>🎉 Account Created</h2>

            <p style={{ marginBottom: "10px" }}>
              Your <b>User Code</b> is also your <b>Referral Code</b>:
            </p>

            <div
              style={{
                background: "#111",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              {createdUserCode || "Not generated"}
            </div>

            <div
              style={{
                background: "#111",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "15px",
                wordBreak: "break-all",
              }}
            >
              {referralLink || "Referral link not available"}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(createdUserCode);
                toast.success("Copied to clipboard ✅");
              }}
              style={{
                marginBottom: "10px",
                padding: "8px 16px",
                background: "#00c853",
                border: "none",
                color: "#fff",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Copy User Code
            </button>

            <br />

            <button
              onClick={() => {
                setShowUserCodeModal(false);
                setShowSignup(false);
                setShowOtpModal(false);
                setShowLogin(true);
              }}
              style={{
                padding: "8px 16px",
                background: "#ff3df2",
                border: "none",
                color: "#fff",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NAVBAR;