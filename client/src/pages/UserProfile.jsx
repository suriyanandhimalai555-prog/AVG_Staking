import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import { useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

const UserProfile = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const [wallet, setWallet] = useState({
    roi: 0,
    level: 0,
    direct: 0,
  });

  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    wallet_address: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const token = localStorage.getItem("token");

  const referralCode = useMemo(() => {
    return profile?.user_code || localStorage.getItem("user_code") || "";
  }, [profile]);

  const referralLink = useMemo(() => {
    if (!referralCode) return "";
    return `${window.location.origin}/auth/register?referral_code=${encodeURIComponent(
      referralCode
    )}`;
  }, [referralCode]);

  const fetchProfile = async () => {
    try {
      const [profileRes, walletRes] = await Promise.all([
        axios.get(`${API}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProfile(profileRes.data);

      setFormData({
        name: profileRes.data.name || "",
        lastname: profileRes.data.lastname || "",
        email: profileRes.data.email || "",
        phone: profileRes.data.phone || "",
        wallet_address: profileRes.data.wallet_address || "",
      });

      setWallet({
        roi: walletRes.data.roi || 0,
        level: walletRes.data.level || 0,
        direct: walletRes.data.directReferral || 0,
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error(err.response?.data?.message || "Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async () => {
    try {
      await axios.put(`${API}/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowEdit(false);
      await fetchProfile();
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await axios.put(
        `${API}/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    }
  };

  const handleLogout = () => {
    const loading = toast.loading("Logging out...");

    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_code");
      localStorage.removeItem("role");

      toast.success("Logged out successfully", { id: loading });
      navigate("/");
    }, 800);
  };

  const copyReferralLink = async () => {
    if (!referralLink) {
      return toast.error("Referral link not available");
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="u3Layout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="u3Container">
          <div className="u3Header">
            <div className="u3Avatar">{profile.name?.charAt(0)}</div>

            <h2>
              {profile.name} {profile.lastname}
            </h2>
            <p>{profile.email}</p>

            <div className="u3Btns">
              <button className="primary" onClick={() => setShowEdit(true)}>
                Edit Profile
              </button>
              <button className="outline" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="u3Card">
            <h4>Personal Details</h4>

            <Row label="Username" value={profile.name} />
            <Row label="Lastname" value={profile.lastname} />
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone || "-"} />
            <Row label="User Code" value={profile.user_code || "-"} />
            <Row label="Wallet Address" value={profile.wallet_address || "-"} />
          </div>

          <div className="u3Card">
            <h4>Wallet Balances</h4>

            <div className="u3Wallets">
              <Wallet title="Staking Wallet" value="$0.00" />
              <Wallet title="ROI Wallet" value={`$${wallet.roi}`} />
              <Wallet title="Level Wallet" value={`$${wallet.level}`} />
              <Wallet title="Direct Referral Wallet" value={`$${wallet.direct}`} />
            </div>
          </div>

          <div className="u3Card u3Row">
            <div>
              <h4>Security</h4>
              <p>Change your password to keep your account secure.</p>
              <p>Update your bank details to receive payouts.</p>
            </div>

            <div className="u3SideBtns">
              <button onClick={() => setShowPassword(true)}>Password Edit</button>
              <button onClick={() => navigate("/user-bank")}>Bank Details</button>
            </div>
          </div>

          <div className="u3Card">
            <h4>Account Status</h4>

            <Row label="User Active" value={<Badge text="Active" />} />
            <Row label="Eligible for Referral" value={<Badge text="Active" />} />
          </div>

          <div className="u3Card">
            <h4>Referral & Earn</h4>

            <p className="u3Highlight">
              Invite friends. Your user code is your referral code.
            </p>

            <div className="u3ReferralBox">
              {referralLink || "Referral link not available yet"}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button className="primary" onClick={copyReferralLink}>
                Copy Link
              </button>
              <button
                className="outline"
                onClick={() => {
                  if (!referralLink) return toast.error("Referral link not available");
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(referralLink)}`,
                    "_blank"
                  );
                }}
              >
                Share Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="modalOverlay">
          <div className="modalBox modalWide">
            <div className="modalHeader">
              <h3>Edit Profile</h3>
              <button onClick={() => setShowEdit(false)}>✕</button>
            </div>

            <div className="modalGrid">
              <div className="modalCard">
                <h4>Personal Info</h4>

                <input
                  placeholder="Username"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />

                <input
                  placeholder="Lastname"
                  value={formData.lastname}
                  onChange={(e) =>
                    setFormData({ ...formData, lastname: e.target.value })
                  }
                />

                <input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />

                <input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />

                <div className="modalFooter">
                  <button onClick={() => setShowEdit(false)}>Cancel</button>
                  <button className="primary" onClick={handleUpdateProfile}>
                    Save
                  </button>
                </div>
              </div>

              <div className="modalCard">
                <h4>Wallet Connection</h4>

                <input
                  placeholder="Wallet Address"
                  value={formData.wallet_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wallet_address: e.target.value,
                    })
                  }
                />

                <button className="primary">Connect Trust Wallet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="modalOverlay">
          <div className="modalBox">
            <div className="modalHeader">
              <h3>Change Password</h3>
              <button onClick={() => setShowPassword(false)}>✕</button>
            </div>

            <div className="modalBody">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>

            <div className="modalFooter">
              <button onClick={() => setShowPassword(false)}>Cancel</button>
              <button className="primary" onClick={handleChangePassword}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="u3RowItem">
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

const Wallet = ({ title, value }) => (
  <div className="u3Wallet">
    <p>{title}</p>
    <h3>{value}</h3>
  </div>
);

const Badge = ({ text }) => <span className="u3Badge">{text}</span>;

export default UserProfile;