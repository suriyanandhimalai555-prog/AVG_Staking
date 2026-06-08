import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/api";

const formatMoney = (value) => {
  const num = Number(value || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const DetailRow = ({ label, value }) => (
  <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 px-4 py-3 shadow-inner">
    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-amber-400/70">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-medium text-slate-200">{value}</p>
  </div>
);

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-5 shadow-2xl backdrop-blur-xl">
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-3xl font-light tracking-tight text-white">{value}</p>
      </div>
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} opacity-90 shadow-lg`} />
    </div>
  </div>
);

const StatusBadge = ({ hasImage }) => (
  <span
    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${
      hasImage
        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
        : "border-amber-500/20 bg-amber-500/5 text-amber-400"
    }`}
  >
    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${hasImage ? "bg-emerald-400" : "bg-amber-400"}`} />
    {hasImage ? "Verified Asset" : "Pending Action"}
  </span>
);

const ModalShell = ({ title, subtitle, onClose, children, maxWidth = "max-w-6xl" }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090d16] shadow-[0_24px_70px_rgba(0,0,0,0.7)]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.05),transparent_45%)]" />
        <div className="relative flex max-h-[90vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
            <div className="min-w-0">
              <h2 className="text-lg font-medium tracking-tight text-white sm:text-xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-xs text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/5 text-xl font-light text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
              type="button"
            >
              ×
            </button>
          </div>

          <div
            className="
              relative overflow-y-auto p-6
              [scrollbar-width:none]
              [-ms-overflow-style:none]
              `[&::-webkit-scrollbar]:hidden`
            "
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const BannerImage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadingId, setUploadingId] = useState(null);

  const [viewUser, setViewUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/banner-slides/admin/approved-users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Banner users fetch error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setUploadPreview("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setUploadPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    document.body.style.overflow = uploadModalOpen || viewModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [uploadModalOpen, viewModalOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (uploadModalOpen) closeUploadModal();
        if (viewModalOpen) closeViewModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [uploadModalOpen, viewModalOpen]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      return (
        user.username?.toLowerCase().includes(q) ||
        user.userCode?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q) ||
        user.reward?.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const openUploadModal = (user) => {
    setSelectedUser(user);
    setSelectedFile(null);
    setUploadPreview("");
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedUser(null);
    setSelectedFile(null);
    setUploadPreview("");
  };

  const openViewModal = (user) => {
    setViewUser(user);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewUser(null);
  };

  const handleUpload = async () => {
    if (!selectedUser) return;

    if (!selectedFile) {
      setMessage("Please select an image asset.");
      return;
    }

    try {
      setUploadingId(selectedUser.userId);

      const formData = new FormData();
      formData.append("userId", selectedUser.userId);
      formData.append("username", selectedUser.username || "");
      formData.append("phone", selectedUser.phone || "");
      formData.append("userCode", selectedUser.userCode || "");
      formData.append("reward", selectedUser.reward || "");
      formData.append("target_amount", selectedUser.target_amount || 0);
      formData.append("progress", selectedUser.progress || 0);
      formData.append("achievedDate", selectedUser.achieved_date || "");
      formData.append("sort_order", selectedUser.sort_order || 0);
      formData.append("is_active", "true");
      formData.append("image", selectedFile);

      await API.post("/banner-slides/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Asset database synchronized successfully.");
      closeUploadModal();
      await fetchUsers();
    } catch (error) {
      console.error("Banner upload error:", error);
      setMessage(error?.response?.data?.message || "Synchronization failed.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleBackdropClose = (e) => {
    if (e.target === e.currentTarget) {
      if (uploadModalOpen) closeUploadModal();
      if (viewModalOpen) closeViewModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-6 text-slate-100 sm:px-6 lg:px-8 rounded-2xl shadow-2xl">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Block */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#090f1c] p-6 shadow-2xl sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.04),transparent_35%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-md border border-amber-500/10 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold tracking-[0.25em] text-amber-400">
                SYSTEM CONSOLE
              </span>
              <h1 className="mt-3 text-2xl font-light tracking-tight text-white sm:text-3xl">
                Premium Reward Inventory
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-400">
                Manage, audit, and provision executive asset banners for verified accounts.
              </p>
            </div>

            <div className="flex gap-4">
              <StatCard
                label="Premium Profiles"
                value={users.length}
                accent="from-amber-500 to-yellow-600"
              />
            </div>
          </div>
        </div>

        {/* Search Engine Layer */}
        <div className="rounded-xl border border-white/[0.05] bg-[#090f1c] p-4 shadow-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by account signature, premium asset target, or phone identifier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-slate-950/50 px-4 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10"
            />
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-600 text-lg">
              &reg;
            </div>
          </div>
        </div>

        {/* Notification Stream */}
        {message ? (
          <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.02] px-4 py-3 text-xs font-medium text-emerald-400 shadow-lg animate-fade-in">
            {message}
          </div>
        ) : null}

        {/* Grid System */}
        <div>
          {loading ? (
            <div className="rounded-xl border border-white/[0.05] bg-[#090f1c] p-12 text-center text-xs font-medium tracking-widest text-slate-500">
              SYNCHRONIZING REWARD REGISTRY...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-white/[0.05] bg-[#090f1c] p-12 text-center text-xs font-medium tracking-widest text-slate-500">
              NO COMPLIANT RECORDS FOUND
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => {
                const hasImage = Boolean(user.image_url);

                return (
                  <div
                    key={user.userId}
                    className="group relative flex flex-col justify-between rounded-xl border border-white/[0.05] bg-[#090f1c] p-5 shadow-xl transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_12px_30px_rgba(245,158,11,0.03)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-xs font-semibold text-amber-400 border border-white/[0.05]">
                            {getInitials(user.username)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                              {user.username || "-"}
                            </h3>
                            <p className="truncate text-[11px] font-mono tracking-wider text-slate-500">
                              {user.userCode || "-"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge hasImage={hasImage} />
                      </div>

                      <div className="mt-4 rounded-lg border border-white/[0.03] bg-slate-950/30 p-3.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-400/60">
                          Allocated Luxury Tier
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-300 truncate">
                          {user.reward || "-"}
                        </p>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.02] bg-slate-950/20 px-3 py-2">
                          <span className="text-slate-500 text-[11px]">Phone Target</span>
                          <span className="truncate font-medium text-slate-300">{user.phone || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.02] bg-slate-950/20 px-3 py-2">
                          <span className="text-slate-500 text-[11px]">Escrow Target</span>
                          <span className="font-medium text-slate-300">{formatMoney(user.target_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.02] bg-slate-950/20 px-3 py-2">
                          <span className="text-slate-500 text-[11px]">Cleared Progress</span>
                          <span className="font-semibold text-amber-400">{formatMoney(user.progress)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => openUploadModal(user)}
                        className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-2 text-xs font-medium text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
                        type="button"
                      >
                        {hasImage ? "Replace Asset" : "Provision Asset"}
                      </button>

                      {hasImage && (
                        <button
                          onClick={() => openViewModal(user)}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
                          type="button"
                        >
                          Audit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Interface Modal */}
      {uploadModalOpen && selectedUser && (
        <div onMouseDown={handleBackdropClose}>
          <ModalShell
            title="Provision Asset Banner"
            subtitle="Securely bind a premium wide-aspect graphic to this audited profile ledger."
            onClose={closeUploadModal}
            maxWidth="max-w-5xl"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <DetailRow label="Client Name" value={selectedUser.username || "-"} />
                  <DetailRow label="System Hash" value={selectedUser.userCode || "-"} />
                  <DetailRow label="Target Limit" value={formatMoney(selectedUser.target_amount)} />
                  <DetailRow label="Current Standing" value={formatMoney(selectedUser.progress)} />
                </div>

                <div className="rounded-xl border border-white/[0.05] bg-slate-950/40 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    File System Input
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-3 block w-full cursor-pointer rounded-lg border border-white/[0.08] bg-slate-950/80 p-2 text-xs text-slate-400 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-white/20"
                  />
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploadingId === selectedUser.userId}
                  className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-medium text-slate-950 transition hover:brightness-110 disabled:opacity-40"
                  type="button"
                >
                  {uploadingId === selectedUser.userId ? "Synchronizing Asset..." : "Commit Asset Changes"}
                </button>
              </div>

              <div>
                <div className="rounded-xl border border-white/[0.05] bg-slate-950/40 p-4 h-full flex flex-col justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-3">
                    Active Render Canvas
                  </p>
                  <div className="flex-1 min-h-[220px] rounded-lg border border-white/[0.04] bg-black/60 overflow-hidden flex items-center justify-center">
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="Staging area" className="h-full w-full object-cover" />
                    ) : selectedUser.image_url ? (
                      <img src={selectedUser.image_url} alt="Current entry" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-600 italic">No asset staged for rendering</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalShell>
        </div>
      )}

      {/* Audit/View Modal */}
      {viewModalOpen && viewUser && (
        <div onMouseDown={handleBackdropClose}>
          <ModalShell
            title="Premium Asset Preview"
            subtitle="System telemetry and raw visual verification metrics."
            onClose={closeViewModal}
            maxWidth="max-w-5xl"
          >
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-xl border border-white/[0.05] bg-black/60 overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
                {viewUser.image_url ? (
                  <img
                    src={viewUser.image_url}
                    alt="Audited live asset"
                    className="max-h-[450px] w-full rounded-md object-contain bg-slate-950"
                  />
                ) : (
                  <span className="text-xs text-slate-600">Asset pointer resolved to null</span>
                )}
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <DetailRow label="Profile Owner" value={viewUser.username || "-"} />
                  <DetailRow label="Assigned Tier Reward" value={viewUser.reward || "-"} />
                  <div className="rounded-xl border border-white/[0.05] bg-slate-950/40 p-3.5">
                    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      Resolved Asset Link
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-slate-400 select-all">
                      {viewUser.image_url || "-"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeViewModal}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]"
                  type="button"
                >
                  Dismiss Telemetry
                </button>
              </div>
            </div>
          </ModalShell>
        </div>
      )}
    </div>
  );
};

export default BannerImage;