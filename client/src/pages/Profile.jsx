// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

const Profile = () => {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    referralCode: "",
    walletAddress: "",
  });
  const [editData, setEditData] = useState({ ...profileData });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [popup, setPopup] = useState({ show: false, message: "", type: "" });
  const popupTimeoutRef = useRef(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [showBankModal, setShowBankModal] = useState(false);
  const [bankData, setBankData] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  });

  const showPopup = (message, type = "success") => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setPopup({ show: true, message, type });
    popupTimeoutRef.current = setTimeout(
      () => setPopup({ show: false, message: "", type: "" }),
      3000
    );
  };

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // fetch helper (exposed so we can re-use after update)
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || {};
      const formatted = {
        username: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        referralCode: data.referral_code || data.referralCode || "",
        walletAddress: data.wallet_address || "-",
      };
      setProfileData(formatted);
      setEditData(formatted);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      showPopup(err.response?.data?.message || "Failed to fetch profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.username?.trim() || !editData.email?.trim()) {
      return showPopup("Name and email are required", "error");
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/me`,
        {
          name: editData.username,
          email: editData.email,
          phone: editData.phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // prefer server's returned user if available (single source of truth)
      if (res.data?.user) {
        const u = res.data.user;
        const formatted = {
          username: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          referralCode: u.referral_code || "",
          walletAddress: u.wallet_address || "-",
        };
        setProfileData(formatted);
      } else {
        // fallback: re-fetch
        await fetchProfile();
      }

      setIsEditing(false);
      showPopup("Profile updated successfully", "success");
    } catch (err) {
      console.error("Profile update failed:", err);
      showPopup(err.response?.data?.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData);
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showPopup("Passwords do not match", "error");
    }
    if (passwordData.newPassword.length < 6) {
      return showPopup("Minimum 6 characters required", "error");
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showPopup(res.data?.message || "Password updated", "success");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Change password error:", err);
      showPopup(err.response?.data?.message || "Error changing password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveBank = async () => {
  if (!bankData.accountHolderName || !bankData.accountNumber) {
    return showPopup("Fill required fields", "error");
  }

  try {
    const token = localStorage.getItem("token");

    await axios.post(
      `${API_BASE}/bank`,
      {
        accountHolderName: bankData.accountHolderName,
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        ifscCode: bankData.ifscCode,
        branch: bankData.branch,
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    showPopup("Bank details submitted", "success");

    setShowBankModal(false);
    setBankData({
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
    });

  } catch (err) {
    console.error(err);
    showPopup("Failed to save bank details", "error");
  }
};

  const referralLink = `https://avgstake.com/auth/registration?referral_code=${profileData.referralCode || ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      showPopup("Copied to clipboard", "success");
    } catch (err) {
      console.error("Copy failed:", err);
      showPopup("Copy failed", "error");
    }
  };

  if (loading) return <div className="accounts-container">Loading profile…</div>;

  return (
    <div className="accounts-container">
      {popup.show && <div className={`popup ${popup.type}`}>{popup.message}</div>}

      <div className="admin-profile-section">
        <div className="profile-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>{profileData.username || "—"}</h2>
            <span>{profileData.email || "—"}</span>
          </div>

          <div>
            {!isEditing ? (
              <button className="edit-profile-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button className="cancel-btn" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <hr />

        <div className="section">
          <h3>Personal Details</h3>

          <div className="details-grid" style={{ display: "grid", gap: 12 }}>
            {[
              { label: "Username", key: "username" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "phone" },
              { label: "Referral Code", key: "referralCode" }
            ].map((field) => (
              <div key={field.key} className="detail-item" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, color: "#666" }}>{field.label}</span>

                {isEditing && field.key !== "referralCode" ? (
                  <input
                    value={editData[field.key] ?? ""}
                    onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                  />
                ) : (
                  <span>{profileData[field.key] || "—"}</span>
                )}
              </div>
            ))}
          </div>

          <div className="wallet-address" style={{ marginTop: 12 }}>
            <span style={{ fontSize: 13, color: "#666" }}>Wallet Address</span>
            {isEditing ? (
              <input value={editData.walletAddress ?? ""} onChange={(e) => setEditData({ ...editData, walletAddress: e.target.value })} />
            ) : (
              <span>{profileData.walletAddress || "—"}</span>
            )}
          </div>
        </div>

        <div className="section" style={{ marginTop: 16 }}>
          <h3>Security</h3>

          <div className="security-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Password</span>
            <button onClick={() => setShowPasswordModal(true)}>Edit</button>
          </div>

          <div className="security-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span>Bank Details</span>
            <button onClick={() => setShowBankModal(true)}>Bank Details</button>
          </div>
        </div>

        <div className="section" style={{ marginTop: 16 }}>
          <h3>Referral & Earn</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={referralLink} style={{ flex: 1 }} />
            <button onClick={handleCopy}>Share Now</button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal" role="dialog" aria-modal="true" style={{ padding: 16, background: "#", borderRadius: 8 }}>
          <h3>Change Password</h3>

          <input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
          <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
          <input type="password" placeholder="Confirm Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={handleSavePassword} disabled={changingPassword}>{changingPassword ? "Saving…" : "Save"}</button>
            <button onClick={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); }} disabled={changingPassword}>Cancel</button>
          </div>
        </div>
      )}

      {showBankModal && (
        <div className="modal" role="dialog" aria-modal="true" style={{ padding: 16, background: "#", borderRadius: 8 }}>
          <h3>Bank Details</h3>

          <input placeholder="Account Holder" value={bankData.accountHolderName} onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })} />
          <input placeholder="Bank Name" value={bankData.bankName} onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} />
          <input placeholder="Account Number" value={bankData.accountNumber} onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })} />
          <input placeholder="IFSC Code" value={bankData.ifscCode} onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })} />
          <input placeholder="Branch" value={bankData.branch} onChange={(e) => setBankData({ ...bankData, branch: e.target.value })} />

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={handleSaveBank}>Save</button>
            <button onClick={() => { setShowBankModal(false); setBankData({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", branch: "" }); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;