import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/**
 * LevelConfig.jsx
 * Route: /dashboard/configuration/level
 */

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}/api/levels`; 

const LevelConfig = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // add | edit | view | delete
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [formData, setFormData] = useState({
    level: "",
    percentage: "",
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const showPopupMessage = (msg) => {
    setPopupMessage(msg);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2500);
  };

  const normalizeRow = (row) => {
    const rawPercentage =
      row.percentage !== undefined && row.percentage !== null
        ? String(row.percentage)
        : "";

    const displayPercentage = rawPercentage.endsWith("%")
      ? rawPercentage
      : rawPercentage
        ? `${rawPercentage}%`
        : "";

    const rawStatus = row.status;

    const normalizedStatus =
      rawStatus === true ||
      rawStatus === 1 ||
      rawStatus === "1" ||
      rawStatus === "true";

    return {
      id: row.id,
      level: Number(row.level),
      percentage: displayPercentage,
      status: normalizedStatus,
      createdAt: row.created_at || row.createdAt || row.created_at_at || "",
    };
  };

  const fetchLevels = async () => {
    try {
      const res = await axios.get(API_BASE, getAuthConfig());
      const rows = Array.isArray(res.data) ? res.data : [];
      setData(rows.map(normalizeRow));
    } catch (err) {
      console.error("fetchLevels error:", err);
      showPopupMessage(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to load levels"
      );
    }
  };

  useEffect(() => {
    fetchLevels();
    
    // Close dropdown menu if user clicks outside
    const closeDropdown = () => setActiveDropdownId(null);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  const openAddModal = () => {
    setModalType("add");
    setSelectedItem(null);
    setFormData({ level: "", percentage: "" });
    setShowModal(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setModalType("view");
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setModalType("edit");
    setFormData({
      level: item.level,
      percentage: String(item.percentage).replace("%", ""),
    });
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setModalType("delete");
    setShowModal(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleStatus = async (item) => {
    try {
      await axios.put(`${API_BASE}/${item.id}/toggle`, {}, getAuthConfig());
      await fetchLevels();
      showPopupMessage(
        `Level ${item.level} ${item.status ? "deactivated" : "activated"}`
      );
    } catch (err) {
      console.error("toggleStatus error:", err);
      showPopupMessage(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to update status"
      );
    }
  };

  const confirmModal = async () => {
    try {
      if (modalType === "add") {
        const payload = {
          level: Number(formData.level),
          percentage: String(formData.percentage).replace("%", "").trim(),
        };

        if (!payload.level || !payload.percentage) {
          showPopupMessage("All fields are required");
          return;
        }

        await axios.post(API_BASE, payload, getAuthConfig());
        await fetchLevels();
        showPopupMessage("Configuration added successfully");
      }

      if (modalType === "edit" && selectedItem) {
        const payload = {
          level: Number(formData.level),
          percentage: String(formData.percentage).replace("%", "").trim(),
        };

        if (!payload.level || !payload.percentage) {
          showPopupMessage("All fields are required");
          return;
        }

        await axios.put(`${API_BASE}/${selectedItem.id}`, payload, getAuthConfig());
        await fetchLevels();
        showPopupMessage("Configuration updated successfully");
      }

      if (modalType === "delete" && selectedItem) {
        await axios.delete(`${API_BASE}/${selectedItem.id}`, getAuthConfig());
        await fetchLevels();
        showPopupMessage(`Level ${selectedItem.level} configuration deleted`);
      }

      setShowModal(false);
      setSelectedItem(null);
      setModalType("");
    } catch (err) {
      console.error("confirmModal error:", err);
      showPopupMessage(
        err?.response?.data?.message || err?.response?.data?.error || "Action failed"
      );
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;

    return data.filter((r) => {
      const levelText = String(r.level).toLowerCase();
      const percentageText = String(r.percentage).toLowerCase();
      const statusText = r.status ? "active" : "inactive";
      return (
        levelText.includes(q) ||
        percentageText.includes(q) ||
        statusText.includes(q)
      );
    });
  }, [searchTerm, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#0b0f19] p-6 text-slate-100 antialiased selection:bg-purple-500 selection:text-white rounded-2xl shadow-2xl">
      
      {/* Top Ledger Card */}
      <div className="mb-6 rounded-2xl border border-slate-800/60 bg-[#111625] p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🗃️</span>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Level Configuration
              </h1>
            </div>
            {/* <p className="mt-1 text-sm text-slate-400">
              Audit, trace, and manually deploy cryptographic staking deposits
            </p> */}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Box */}
            <div className="relative min-w-[260px]">
              <input
                type="text"
                placeholder="Search by level or percentage..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] py-2 pl-4 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <button 
              className="inline-flex items-center justify-center rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#7c3aed] active:scale-[0.98]"
              onClick={openAddModal}
            >
              + Add configuration
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-800/60 bg-[#111625] shadow-xl overflow-hidden">
        <div className="border-b border-slate-800/60 bg-[#131a2e]/40 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Deposit Inflow Queue
          </h2>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800/60 bg-[#0d1220]/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Index</th>
                <th className="px-6 py-4">Level</th>
                {/* <th className="px-6 py-4 text-purple-400">Plan Cluster</th> */}
                <th className="px-6 py-4">Percentage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {currentItems.map((item, index) => (
                <tr key={item.id} className="transition-colors duration-150 hover:bg-[#161d30]/40">
                  {/* Padding Index matching UI format */}
                  <td className="whitespace-nowrap px-6 py-4.5 font-mono text-xs text-slate-500">
                    {String(indexOfFirstItem + index + 1).padStart(2, '0')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5 font-bold text-slate-200">
                    Level {item.level}
                  </td>
                  {/* <td className="whitespace-nowrap px-6 py-4.5 font-bold text-purple-400">
                    AVG Super
                  </td> */}
                  <td className="whitespace-nowrap px-6 py-4.5 font-mono font-bold text-[#10b981]">
                    {item.percentage}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5">
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.status ? "bg-purple-600" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.status ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5 font-mono text-xs text-slate-400">
                    {item.createdAt || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5 text-right text-slate-400">
                    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                        className="rounded p-1 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <span className="text-lg leading-none block px-1">⋮</span>
                      </button>

                      {/* Dropdown Action Overlay Menu */}
                      {activeDropdownId === item.id && (
                        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-lg border border-slate-800 bg-[#161d30] p-1 shadow-xl ring-1 ring-black ring-opacity-5 z-20">
                          <button
                            onClick={() => { handleView(item); setActiveDropdownId(null); }}
                            className="flex w-full items-center px-3 py-2 text-xs rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
                          >
                            👁️ <span className="ml-2">View</span>
                          </button>
                          <button
                            onClick={() => { handleEdit(item); setActiveDropdownId(null); }}
                            className="flex w-full items-center px-3 py-2 text-xs rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
                          >
                            ✏️ <span className="ml-2">Edit</span>
                          </button>
                          <button
                            onClick={() => { handleDelete(item); setActiveDropdownId(null); }}
                            className="flex w-full items-center px-3 py-2 text-xs rounded-md text-red-400 hover:bg-red-500/10"
                          >
                            🗑️ <span className="ml-2">Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                    No level configurations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex flex-col gap-4 border-t border-slate-800/60 bg-[#0d1220]/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Rows:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-slate-800 bg-[#0a0d16] px-2 py-1 text-slate-300 outline-none focus:border-purple-500/50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span className="ml-2 font-mono">
              {filtered.length === 0
                ? "0-0 of 0"
                : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filtered.length)} of ${filtered.length}`}
            </span>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-800 bg-[#111625] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                    currentPage === i + 1
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-800 bg-[#111625] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Tailwind Premium Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setModalType(""); setSelectedItem(null); }}
          />
          
          {/* Box container */}
          <div className="relative w-full max-w-md transform rounded-2xl border border-slate-800 bg-[#111625] p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-semibold text-white">
                {modalType === "delete" && "Confirm Delete"}
                {modalType === "edit" && "Edit Configuration"}
                {modalType === "add" && "Add Configuration"}
                {modalType === "view" && "Configuration Details"}
              </h3>
              <button
                className="text-slate-400 hover:text-white text-xl font-medium transition-colors"
                onClick={() => { setShowModal(false); setModalType(""); setSelectedItem(null); }}
              >
                &times;
              </button>
            </div>

            <div className="mt-4">
              {modalType === "delete" && (
                <p className="text-sm text-slate-300">
                  Are you sure you want to delete this configuration? This action cannot be undone.
                </p>
              )}

              {modalType === "view" && selectedItem && (
                <div className="space-y-3 rounded-xl bg-[#0a0d16] p-4 text-sm font-mono">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400 font-sans">Level:</span>
                    <span className="text-white font-bold">Level {selectedItem.level}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400 font-sans">Percentage:</span>
                    <span className="text-[#10b981] font-bold">{selectedItem.percentage}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400 font-sans">Status:</span>
                    <span className={selectedItem.status ? "text-purple-400" : "text-slate-500"}>
                      {selectedItem.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 font-sans">Created At:</span>
                    <span className="text-slate-300 text-xs">{selectedItem.createdAt || "-"}</span>
                  </div>
                </div>
              )}

              {(modalType === "edit" || modalType === "add") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Level
                    </label>
                    <input
                      type="number"
                      name="level"
                      value={formData.level}
                      onChange={handleModalChange}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-purple-500/50"
                      placeholder="Enter level number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Percentage
                    </label>
                    <input
                      type="text"
                      name="percentage"
                      value={formData.percentage}
                      onChange={handleModalChange}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-purple-500/50"
                      placeholder="Enter percentage value"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                className="rounded-lg border border-slate-800 bg-[#161d30] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
                onClick={() => { setShowModal(false); setModalType(""); setSelectedItem(null); }}
              >
                Cancel
              </button>

              {(modalType === "delete" || modalType === "edit" || modalType === "add") && (
                <button 
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ${
                    modalType === "delete" 
                      ? "bg-red-600 hover:bg-red-500" 
                      : "bg-purple-600 hover:bg-purple-500"
                  }`} 
                  onClick={confirmModal}
                >
                  {modalType === "delete" ? "Delete" : modalType === "edit" ? "Save Changes" : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Popup Notification */}
      {showPopup && (
        <div className="fixed bottom-5 right-5 z-50 transform animate-bounce rounded-xl border border-slate-800 bg-[#131929] px-5 py-3 text-sm font-medium text-purple-300 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            {popupMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelConfig;