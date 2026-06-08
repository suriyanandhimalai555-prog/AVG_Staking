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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400 font-medium">
        <div className="animate-pulse">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 sm:p-6 md:p-8 antialiased selection:bg-purple-500 selection:text-white rounded-2xl shadow-2xl">
      
      {/* Dynamic Floating Notification */}
      {popup.show && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all transform duration-300 animate-bounce ${
          popup.type === "error" 
            ? "bg-red-950/80 border-red-500 text-red-200" 
            : "bg-emerald-950/80 border-emerald-500 text-emerald-200"
        }`}>
          {popup.message}
        </div>
      )}

      {/* Main Container Card */}
      <div className="max-w-6xl mx-auto bg-[#0f1524] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        
        {/* Header Block */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-900/50 to-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👤</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">{profileData.username || "—"}</h2>
            </div>
            <p className="text-sm text-slate-400">{profileData.email || "—"}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <button 
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-purple-600/10"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-xl transition-all disabled:opacity-50"
                  onClick={handleSave} 
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button 
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl transition-all border border-slate-700"
                  onClick={handleCancel} 
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-4">Personal Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Username", key: "username", editable: true },
                { label: "Email", key: "email", editable: true },
                { label: "Phone", key: "phone", editable: true },
                { label: "Referral Code", key: "referralCode", editable: false }
              ].map((field) => (
                <div key={field.key} className="bg-[#141b2d] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-medium mb-1.5">{field.label}</span>
                  {isEditing && field.editable ? (
                    <input
                      type="text"
                      className="w-full bg-[#090d16] border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none transition-all"
                      value={editData[field.key] ?? ""}
                      onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                    />
                  ) : (
                    <span className={`text-sm font-medium ${field.key === 'username' ? 'text-slate-200' : field.key === 'referralCode' ? 'text-emerald-400 font-mono' : 'text-slate-300'}`}>
                      {profileData[field.key] || "—"}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Wallet Row inside Personal Details */}
            <div className="mt-4 bg-[#141b2d] border border-slate-800/80 rounded-xl p-4">
              <span className="text-xs text-slate-500 font-medium block mb-1.5">Wallet Address</span>
              {isEditing ? (
                <input 
                  type="text" 
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none transition-all"
                  value={editData.walletAddress ?? ""} 
                  onChange={(e) => setEditData({ ...editData, walletAddress: e.target.value })} 
                />
              ) : (
                <span className="text-sm font-mono text-emerald-400 break-all">{profileData.walletAddress || "—"}</span>
              )}
            </div>
          </div>

          {/* Section 2: Security */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-4">Security Settings</h3>
            <div className="space-y-3">
              
              <div className="bg-[#141b2d] border border-slate-800/60 rounded-xl px-5 py-4 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Account Password</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Update your secure login credentials</p>
                </div>
                <button 
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-all border border-slate-700"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Edit
                </button>
              </div>

              <div className="bg-[#141b2d] border border-slate-800/60 rounded-xl px-5 py-4 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Bank Details</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Manage fiat payout routes and settlement options</p>
                </div>
                <button 
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-all border border-slate-700"
                  onClick={() => setShowBankModal(true)}
                >
                  Configure
                </button>
              </div>

            </div>
          </div>

          {/* Section 3: Referral & Earn */}
          <div className="bg-[#141b2d]/40 border border-purple-900/30 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">Referral & Earn</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                readOnly 
                value={referralLink} 
                className="flex-1 bg-[#090d16] border border-slate-800 text-slate-400 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-mono tracking-tight select-all"
              />
              <button 
                onClick={handleCopy}
                className="px-5 py-2.5 bg-purple-600/90 hover:bg-purple-600 active:bg-purple-700 text-white font-medium text-sm rounded-xl transition-all whitespace-nowrap shadow-md shadow-purple-600/5"
              >
                Share Now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modals Backdrops & Layering */}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f1524] border border-slate-800 rounded-2xl p-6 shadow-2xl transform transition-all">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Change Password</h3>
            
            <div className="space-y-3">
              <input 
                type="password" 
                placeholder="Current Password" 
                className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
                value={passwordData.currentPassword} 
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
              />
              <input 
                type="password" 
                placeholder="New Password" 
                className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
                value={passwordData.newPassword} 
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
              />
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
                value={passwordData.confirmPassword} 
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); }} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl border border-slate-700 transition-all"
                disabled={changingPassword}
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePassword} 
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-purple-600/10 transition-all disabled:opacity-50"
                disabled={changingPassword}
              >
                {changingPassword ? "Saving…" : "Save Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f1524] border border-slate-800 rounded-2xl p-6 shadow-2xl transform transition-all">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Bank Details Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block pl-1">Account Holder Name *</label>
                <input 
                  placeholder="John Doe" 
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all"
                  value={bankData.accountHolderName} 
                  onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block pl-1">Bank Name</label>
                <input 
                  placeholder="Federal International Bank" 
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all"
                  value={bankData.bankName} 
                  onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block pl-1">Account Number *</label>
                <input 
                  placeholder="000000000000" 
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all"
                  value={bankData.accountNumber} 
                  onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block pl-1">IFSC Code</label>
                  <input 
                    placeholder="ABCD0123456" 
                    className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all"
                    value={bankData.ifscCode} 
                    onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block pl-1">Branch</label>
                  <input 
                    placeholder="Main Square" 
                    className="w-full bg-[#090d16] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all"
                    value={bankData.branch} 
                    onChange={(e) => setBankData({ ...bankData, branch: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => { setShowBankModal(false); setBankData({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", branch: "" }); }} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl border border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBank} 
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-purple-600/10 transition-all"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;