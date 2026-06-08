import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

/**
 * RankConfig.jsx
 */

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/ranks`;

const RankConfig = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [editForm, setEditForm] = useState({
    targetAmount: "",
    reward: "",
  });

  const [addForm, setAddForm] = useState({
    targetAmount: "",
    reward: "",
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

  // ✅ FETCH DATA
  const fetchData = async () => {
    try {
      const res = await axios.get(API, getAuthConfig());

      const formatted = res.data.map((item, index) => ({
        sno: index + 1,
        id: item.id,
        targetAmount: `$${item.target_amount}`,
        reward: item.reward,
        status: item.status,
        createdAt: item.created_at,
      }));

      setData(formatted);
    } catch (err) {
      console.error(err);
      showPopupMessage("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();

    // Close action dropdowns on clicking anywhere outside
    const closeDropdown = () => setActiveDropdownId(null);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  // ✅ TOGGLE
  const toggleStatus = async (item) => {
    try {
      await axios.put(`${API}/${item.id}/toggle`, {}, getAuthConfig());
      fetchData();
      showPopupMessage("Status updated");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ ACTIONS
  const handleView = (item) => {
    setSelectedItem(item);
    setModalType("view");
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditForm({
      targetAmount: item.targetAmount.replace("$", ""),
      reward: item.reward,
    });
    setModalType("edit");
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setModalType("delete");
    setShowModal(true);
  };

  const openAdd = () => {
    setAddForm({ targetAmount: "", reward: "" });
    setModalType("add");
    setShowModal(true);
  };

  // ✅ CONFIRM
  const confirmModal = async () => {
    try {
      if (modalType === "delete") {
        await axios.delete(`${API}/${selectedItem.id}`, getAuthConfig());
        showPopupMessage("Deleted successfully");
      }

      if (modalType === "edit") {
        await axios.put(
          `${API}/${selectedItem.id}`,
          {
            target_amount: editForm.targetAmount,
            reward: editForm.reward,
          },
          getAuthConfig()
        );
        showPopupMessage("Updated successfully");
      }

      if (modalType === "add") {
        await axios.post(
          API,
          {
            target_amount: addForm.targetAmount,
            reward: addForm.reward,
          },
          getAuthConfig()
        );
        showPopupMessage("Added successfully");
      }

      fetchData();
      setShowModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      showPopupMessage("Action failed");
    }
  };

  // ✅ SEARCH
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return data.filter(
      (r) =>
        r.targetAmount.toLowerCase().includes(q) ||
        r.reward.toLowerCase().includes(q)
    );
  }, [searchTerm, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-[#0b0f19] p-6 text-slate-100 antialiased selection:bg-purple-500 selection:text-white rounded-2xl shadow-2xl">
      
      {/* Page Header Card */}
      <div className="mb-6 rounded-2xl border border-slate-800/60 bg-[#111625] p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Rank Configuration
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Configure business volume milestone targets and corresponding rank rewards
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input Box */}
            <div className="relative min-w-[260px]">
              <input
                type="text"
                placeholder="Search by amount or reward..."
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
              onClick={openAdd}
            >
              + Add Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="rounded-2xl border border-slate-800/60 bg-[#111625] shadow-xl overflow-hidden">
        <div className="border-b border-slate-800/60 bg-[#131a2e]/40 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Rank Achievement Milestones
          </h2>
        </div>

        {/* Responsive Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800/60 bg-[#0d1220]/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">S.No</th>
                <th className="px-6 py-4 text-purple-400">Target Amount</th>
                <th className="px-6 py-4">Reward Asset</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {currentItems.map((item, index) => (
                <tr key={item.id} className="transition-colors duration-150 hover:bg-[#161d30]/40">
                  {/* Formatted Number Index Code */}
                  <td className="whitespace-nowrap px-6 py-4.5 font-mono text-xs text-slate-500">
                    {String(indexOfFirstItem + index + 1).padStart(2, '0')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5 font-mono font-bold text-[#10b981]">
                    {item.targetAmount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5 font-bold text-slate-200">
                    {item.reward}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4.5">
                    {/* iOS/Crypto Style Toggle Slide Switch */}
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

                      {/* Dropdown Operational Overlay */}
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
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    No data configurations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
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

      {/* Styled Centered Backdrop Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glass Blurry Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setSelectedItem(null); }}
          />
          
          {/* Main Modal Panel Body Wrapper */}
          <div className="relative w-full max-w-md transform rounded-2xl border border-slate-800 bg-[#111625] p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-semibold text-white">
                {modalType === "add" && "Add Configuration"}
                {modalType === "edit" && "Edit Configuration"}
                {modalType === "delete" && "Confirm Delete"}
                {modalType === "view" && "Details"}
              </h3>
              <button
                className="text-slate-400 hover:text-white text-xl font-medium transition-colors"
                onClick={() => { setShowModal(false); setSelectedItem(null); }}
              >
                &times;
              </button>
            </div>

            <div className="mt-4">
              {/* DISPLAY VIEW CARD DATA */}
              {modalType === "view" && selectedItem && (
                <div className="space-y-3 rounded-xl bg-[#0a0d16] p-4 text-sm font-mono">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400 font-sans">Target Amount:</span>
                    <span className="text-[#10b981] font-bold">{selectedItem.targetAmount}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400 font-sans">Reward Asset:</span>
                    <span className="text-white font-bold">{selectedItem.reward}</span>
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

              {/* ACTION: ADDING NEW CONFIG ENTRY */}
              {modalType === "add" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Target Amount ($)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter target volume amount"
                      value={addForm.targetAmount}
                      onChange={(e) => setAddForm({ ...addForm, targetAmount: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Reward Description
                    </label>
                    <input
                      type="text"
                      placeholder="Enter reward assets / tier name"
                      value={addForm.reward}
                      onChange={(e) => setAddForm({ ...addForm, reward: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-purple-500/50"
                    />
                  </div>
                </div>
              )}

              {/* ACTION: EDIT EXISTING CONFIG ENTRY */}
              {modalType === "edit" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Target Amount ($)
                    </label>
                    <input
                      type="text"
                      value={editForm.targetAmount}
                      onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Reward Description
                    </label>
                    <input
                      type="text"
                      value={editForm.reward}
                      onChange={(e) => setEditForm({ ...editForm, reward: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-purple-500/50"
                    />
                  </div>
                </div>
              )}

              {/* ACTION: DELETE WARNING TEXT */}
              {modalType === "delete" && (
                <p className="text-sm text-slate-300">
                  Are you sure you want to delete this configuration milestone data permanently? This action cannot be undone.
                </p>
              )}
            </div>

            {/* Action Buttons Footer layout panel */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-800 bg-[#161d30] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ${
                  modalType === "delete" 
                    ? "bg-red-600 hover:bg-red-500" 
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Alerts Popup Layout */}
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

export default RankConfig;