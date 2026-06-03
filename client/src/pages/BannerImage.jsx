import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/api";

const formatMoney = (value) => {
  const num = Number(value || 0);
  return `₹${num.toLocaleString()}`;
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
  <div className="rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
    <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/60">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
  </div>
);

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/40 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/55">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      </div>
      <div
        className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${accent} shadow-[0_14px_28px_rgba(0,0,0,0.22)]`}
      />
    </div>
  </div>
);

const StatusBadge = ({ hasImage }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
      hasImage
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
        : "border-amber-400/30 bg-amber-400/10 text-amber-200"
    }`}
  >
    {hasImage ? "Uploaded" : "Pending"}
  </span>
);

const ModalShell = ({ title, subtitle, onClose, children, maxWidth = "max-w-6xl" }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-[30px] border border-slate-700/70 bg-[#081733] shadow-[0_30px_100px_rgba(0,0,0,0.6)]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_34%)]" />
        <div className="relative flex max-h-[92vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-sm leading-6 text-sky-100/70">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-700 bg-white/5 text-2xl leading-none text-white transition hover:bg-white/10"
              aria-label="Close modal"
              type="button"
            >
              ×
            </button>
          </div>

          <div
            className="
              relative overflow-y-auto
              [scrollbar-width:none]
              [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden
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
      setMessage("Please select an image first.");
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

      setMessage("Banner image uploaded successfully.");
      closeUploadModal();
      await fetchUsers();
    } catch (error) {
      console.error("Banner upload error:", error);
      setMessage(error?.response?.data?.message || "Upload failed. Please try again.");
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
    <div className="min-h-screen  px-3 py-4 text-white sm:px-4 sm:py-6 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="relative overflow-hidden rounded-[30px] border border-slate-700/70 bg-gradient-to-br from-[#0a1b3d] via-[#0d2551] to-[#133a86] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.11),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_28%)]" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/90 backdrop-blur">
                BANNER IMAGE MANAGER
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Approved Reward Cards
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-sky-100/80 sm:text-base">
                Upload banner images from a clean popup, preview them clearly,
                and open the saved banner later from each card.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <StatCard
                label="Approved Users"
                value={users.length}
                accent="from-sky-500 to-indigo-500"
              />
              {/* <StatCard
                label="Visible Cards"
                value={filteredUsers.length}
                accent="from-emerald-500 to-cyan-500"
              /> */}
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-700/70 bg-[#091a38] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.2)] sm:p-5">
          <label className="mb-2 block text-sm font-medium text-sky-100/80">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search user, reward, phone, user code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-sky-100/35 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/15"
            />
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sky-100/35">
              ⌕
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            {message}
          </div>
        ) : null}

        <div>
          {loading ? (
            <div className="rounded-[26px] border border-slate-700/70 bg-[#091a38] p-10 text-center text-white shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
              Loading...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-[26px] border border-slate-700/70 bg-[#091a38] p-10 text-center text-white shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
              No approved users found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
              {filteredUsers.map((user) => {
                const hasImage = Boolean(user.image_url);

                return (
                  <div
                    key={user.userId}
                    className="group rounded-[28px] border border-slate-700/70 bg-[#091a38] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:shadow-[0_24px_55px_rgba(2,132,199,0.15)] sm:p-5"
                  >
                    <div className="h-1 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 opacity-70" />

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.35)]">
                        {getInitials(user.username)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {user.username || "-"}
                        </h3>
                        <p className="truncate text-sm text-sky-100/60">
                          {user.userCode || "-"}
                        </p>
                      </div>

                      <StatusBadge hasImage={hasImage} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/35 p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/55">
                        Reward
                      </p>
                      <p className="mt-2 text-[15px] font-semibold leading-6 text-white">
                        {user.reward || "-"}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/35 px-4 py-3">
                        <span className="text-sky-100/60">Phone</span>
                        <span className="truncate font-medium text-white">
                          {user.phone || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/35 px-4 py-3">
                        <span className="text-sky-100/60">Target</span>
                        <span className="font-medium text-white">
                          {formatMoney(user.target_amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/35 px-4 py-3">
                        <span className="text-sky-100/60">Progress</span>
                        <span className="font-medium text-white">
                          {formatMoney(user.progress)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => openUploadModal(user)}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.28)] transition hover:brightness-110"
                        type="button"
                      >
                        {hasImage ? "Update Image" : "Upload Image"}
                      </button>

                      {hasImage && (
                        <button
                          onClick={() => openViewModal(user)}
                          className="rounded-2xl border border-slate-700 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:min-w-[88px]"
                          type="button"
                        >
                          View
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

      {uploadModalOpen && selectedUser && (
        <div onMouseDown={handleBackdropClose}>
          <ModalShell
            title="Upload Banner Image"
            subtitle="Add or replace the banner image for this approved reward card."
            onClose={closeUploadModal}
            maxWidth="max-w-6xl"
          >
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_1.02fr] lg:gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailRow label="Username" value={selectedUser.username || "-"} />
                  <DetailRow label="User Code" value={selectedUser.userCode || "-"} />
                  <DetailRow label="Phone" value={selectedUser.phone || "-"} />
                  <DetailRow label="Reward" value={selectedUser.reward || "-"} />
                  <DetailRow
                    label="Target"
                    value={formatMoney(selectedUser.target_amount)}
                  />
                  <DetailRow
                    label="Progress"
                    value={formatMoney(selectedUser.progress)}
                  />
                  <DetailRow
                    label="Achieved Date"
                    value={selectedUser.achieved_date || "-"}
                  />
                  <DetailRow
                    label="Status"
                    value={selectedUser.image_url ? "Already uploaded" : "New upload"}
                  />
                </div>

                <div className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/60">
                    Select Image
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-3 block w-full cursor-pointer rounded-2xl border border-slate-700 bg-[#071629] px-3 py-3 text-sm text-white outline-none file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-sky-500 file:to-indigo-500 file:px-4 file:py-2 file:text-white hover:file:brightness-110"
                  />
                </div>

                <div className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/60">
                    Note
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/82">
                    The uploaded image will be linked to this approved reward card.
                    After saving, the View button stays available on the card.
                  </p>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploadingId === selectedUser.userId}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3.5 font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  {uploadingId === selectedUser.userId
                    ? "Uploading..."
                    : selectedUser.image_url
                    ? "Update Image"
                    : "Upload Image"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/60">
                      Preview
                    </p>
                    <StatusBadge hasImage={Boolean(selectedUser.image_url)} />
                  </div>

                  <div className="mt-3 overflow-hidden rounded-3xl border border-slate-700/70 bg-black">
                    {uploadPreview ? (
                      <img
                        src={uploadPreview}
                        alt="Upload preview"
                        className="h-[280px] w-full object-cover sm:h-[340px] lg:h-[470px]"
                      />
                    ) : selectedUser.image_url ? (
                      <img
                        src={selectedUser.image_url}
                        alt={selectedUser.username || "Selected user"}
                        className="h-[280px] w-full object-cover sm:h-[340px] lg:h-[470px]"
                      />
                    ) : (
                      <div className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-sky-100/60 sm:h-[340px] lg:h-[470px]">
                        No image selected yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <DetailRow label="Username" value={selectedUser.username || "-"} />
                  <DetailRow label="User Code" value={selectedUser.userCode || "-"} />
                  <DetailRow label="Phone" value={selectedUser.phone || "-"} />
                  <DetailRow label="Reward" value={selectedUser.reward || "-"} />
                </div>
              </div>
            </div>
          </ModalShell>
        </div>
      )}

      {viewModalOpen && viewUser && (
        <div onMouseDown={handleBackdropClose}>
          <ModalShell
            title="View Banner"
            subtitle="Preview of the uploaded reward banner image and related details."
            onClose={closeViewModal}
            maxWidth="max-w-7xl"
          >
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.18fr_0.82fr] lg:gap-6">
              <div className="overflow-hidden rounded-[26px] border border-slate-700/70 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
                {viewUser.image_url ? (
                  <img
                    src={viewUser.image_url}
                    alt={viewUser.username || "Uploaded banner"}
                    className="h-[360px] w-full bg-black object-contain sm:h-[540px]"
                  />
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sky-100/60 sm:h-[540px]">
                    No image available
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <DetailRow label="Username" value={viewUser.username || "-"} />
                  <DetailRow label="User Code" value={viewUser.userCode || "-"} />
                  <DetailRow label="Phone" value={viewUser.phone || "-"} />
                  <DetailRow label="Reward" value={viewUser.reward || "-"} />
                  <DetailRow
                    label="Target"
                    value={formatMoney(viewUser.target_amount)}
                  />
                  <DetailRow
                    label="Progress"
                    value={formatMoney(viewUser.progress)}
                  />
                  <DetailRow
                    label="Achieved Date"
                    value={viewUser.achieved_date || "-"}
                  />
                </div>

                <div className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/60">
                    Banner URL
                  </p>
                  <p className="mt-2 break-all text-sm leading-6 text-white/85">
                    {viewUser.image_url || "-"}
                  </p>
                </div>

                <button
                  onClick={closeViewModal}
                  className="w-full rounded-2xl border border-slate-700 bg-white/8 px-4 py-3 font-semibold text-white transition hover:bg-white/12"
                  type="button"
                >
                  Close Preview
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