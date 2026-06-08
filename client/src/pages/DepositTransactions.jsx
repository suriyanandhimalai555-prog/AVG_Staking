import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FaEllipsisV, FaSearch, FaChevronLeft, FaChevronRight, FaEye, FaEdit, FaTrashAlt, FaPlus, FaTimes, FaCalendarAlt, FaUser, FaWallet, FaLink } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const DepositTransactions = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [menu, setMenu] = useState(null);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [showManualDeposit, setShowManualDeposit] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);

  const dropdownRef = useRef(null);

  // Close drop-down contextual menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year} • ${hours}:${minutes} ${ampm}`;
  };

  const fetchDropdownData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const [usersRes, plansRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/dropdown/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/dropdown/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      console.error("Dropdown fetch error:", err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || "N/A",
        hash: item.hash || `0x${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`,
        plan: item.plan_name || "N/A",
        amount: `$${Number(item.amount ?? 0).toLocaleString()}`,
        created: formatDateTime(item.created_at),
      }));

      setData(formatted);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      toast.error("Failed to load global transaction ledger");
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchDropdownData();
  }, [fetchTransactions, fetchDropdownData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(
      (d) =>
        d.user.toLowerCase().includes(q) ||
        d.hash.toLowerCase().includes(q) ||
        d.plan.toLowerCase().includes(q)
    );
  }, [search, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));

  const paginated = useMemo(() => {
    const start = (page - 1) * rows;
    return filtered.slice(start, start + rows);
  }, [filtered, page, rows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, rows]);

  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= 1) return [1];

    let start = Math.max(page - 2, 1);
    let end = Math.min(start + maxVisible - 1, totalPages);

    if (end - start < maxVisible - 1) start = Math.max(end - maxVisible + 1, 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const createDeposit = () => {
    if (!selectedUser || !selectedPlan || !depositAmount) {
      toast.error("Please fill all deployment variables");
      return;
    }

    const newDeposit = {
      id: Date.now(),
      user: selectedUser,
      hash: `0x${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      plan: selectedPlan,
      amount: `$${Number(depositAmount).toLocaleString()}`,
      created: formatDateTime(new Date()),
    };

    setData((prev) => [newDeposit, ...prev]);
    setShowManualDeposit(false);
    setSelectedUser("");
    setSelectedPlan("");
    setDepositAmount("");
    toast.success("Manual allocation broadcast successful");
  };

  const confirmDelete = () => {
    setData((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    toast.success("Transaction item purged from view");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = () => {
    setData((prev) => prev.map((d) => (d.id === editData.id ? editData : d)));
    setEditData(null);
    toast.success("Transaction changes successfully preserved");
  };

  return (
    <div className="min-h-screen bg-[#070b1e] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none rounded-2xl shadow-2xl">
      {/* Ambient Radial Mesh Background Layer */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
        
        {/* Dynamic Navigation & Filtering Header Panel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <FaWallet className="text-purple-400 text-base" />
              Transactions Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">Audit, trace, and manually deploy cryptographic staking deposits</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Real-time Filter Field */}
            <div className="relative flex items-center min-w-[280px]">
              {/* <FaSearch className="absolute left-4 text-slate-400 text-xs pointer-events-none" /> */}
              <input
                type="text"
                placeholder="Search by user, hash string, or contract..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0f2b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition"
              />
            </div>

            {/* Trigger Manual Flow */}
            <button
              onClick={() => setShowManualDeposit(true)}
              className="px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg border bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <FaPlus className="text-[10px]" /> Manual Deposit
            </button>
          </div>
        </div>

        {/* Master Data Grid Table Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-[#0a0f2e]/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deposit Inflow Queue</h3>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#0c1233]/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-4.5 px-6 w-16 text-center">Index</th>
                  <th className="py-4.5 px-6"><span className="flex items-center gap-1.5"><FaUser className="text-[9px] text-purple-400" /> From User</span></th>
                  <th className="py-4.5 px-6"><span className="flex items-center gap-1.5"><FaLink className="text-[9px] text-indigo-400" /> Transaction Hash</span></th>
                  <th className="py-4.5 px-6">Plan Cluster</th>
                  <th className="py-4.5 px-6">Value Transferred</th>
                  <th className="py-4.5 px-6"><span className="flex items-center gap-1.5"><FaCalendarAlt className="text-[9px] text-purple-400" /> Log Timestamp</span></th>
                  <th className="py-4.5 px-6 text-center">Operations</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-medium">
                {paginated.length > 0 ? (
                  paginated.map((d, i) => (
                    <tr key={d.id} onClick={() => {
    setViewData(d);
    setMenu(null);
  }} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="py-4 px-6 text-center text-slate-500 font-mono">
                        {String((page - 1) * rows + i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-4 px-6 text-white font-bold tracking-wide">{d.user}</td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400 max-w-[200px] truncate" title={d.hash}>
                        {d.hash}
                      </td>
                      <td className="py-4 px-6 text-purple-300 font-semibold">{d.plan}</td>
                      <td className="py-4 px-6 font-mono font-bold text-emerald-400">{d.amount}</td>
                      <td className="py-4 px-6 text-slate-400 text-[11px] font-mono">{d.created}</td>
                      <td className="py-4 px-6 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => setMenu(menu === d.id ? null : d.id)}
                            className={`p-2 rounded-xl transition duration-150 ${menu === d.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            <FaEllipsisV className="text-xs" />
                          </button>

                          {/* Contextual Options Dropdown */}
                          {menu === d.id && (
                            <div ref={dropdownRef} className="absolute right-14 top-1/2 -translate-y-1/2 z-50 min-w-[140px] bg-[#0c0f28] border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5 text-left animate-fade-in">
                              <button
                                onClick={() => { setViewData(d); setMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-white/5 hover:text-white transition"
                              >
                                <FaEye className="text-[10px] text-purple-400" /> View Node
                              </button>
                              <button
                                onClick={() => { setEditData(d); setMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-white/5 hover:text-white transition"
                              >
                                <FaEdit className="text-[10px] text-indigo-400" /> Patch Index
                              </button>
                              <hr className="border-white/5 my-1" />
                              <button
                                onClick={() => { setDeleteId(d.id); setMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10 transition"
                              >
                                <FaTrashAlt className="text-[10px]" /> Purge Stack
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-20 text-center text-slate-500 font-medium tracking-wide">
                      No transactional telemetry patterns matches current indices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Luxury System Matrix Pagination Footer */}
          <div className="bg-[#0b102e]/50 border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <span>Rows visible per frame</span>
              <div className="relative">
                <select
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="bg-[#060a22] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-purple-500 transition cursor-pointer appearance-none pr-6"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-400">▼</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-20 disabled:pointer-events-none"
              >
                <FaChevronLeft className="text-[9px]" />
              </button>

              <div className="flex items-center gap-1">
                {getPagination().map((p, i) =>
                  p === "..." ? (
                    <span key={i} className="px-2.5 text-slate-500 font-mono text-xs">...</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                        page === p 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950/40' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-20 disabled:pointer-events-none"
              >
                <FaChevronRight className="text-[9px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL OVERLAYS RENDERING SYSTEM ================= */}
      
      {/* View Data Modal Overlay */}
      {viewData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
              <h3 className="text-sm font-bold text-white tracking-wide">Telemetry Transaction Matrix</h3>
              <button onClick={() => setViewData(null)} className="text-slate-400 hover:text-white text-lg focus:outline-none">✕</button>
            </div>
            <div className="p-6 space-y-2.5">
              {[
                { label: "Account Owner", value: viewData.user },
                { label: "Blockchain Hash String", value: viewData.hash },
                { label: "Allocated Core Node Plan", value: viewData.plan },
                { label: "Principal Volume", value: viewData.amount },
                { label: "Creation Cycle Stamp", value: viewData.created }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 bg-[#0d1433] px-4 py-3 border border-white/5 rounded-xl text-xs">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="text-slate-100 font-bold tracking-wide break-all">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patch/Edit Data Modal Overlay */}
      {editData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
              <h3 className="text-sm font-bold text-white tracking-wide">Patch Index Variable Parameters</h3>
              <button onClick={() => setEditData(null)} className="text-slate-400 hover:text-white text-lg focus:outline-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Account Owner Identifier</label>
                <input
                  name="user"
                  value={editData.user}
                  onChange={handleEditChange}
                  className="w-full bg-[#05081a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Node Core Plan Level</label>
                <input
                  name="plan"
                  value={editData.plan}
                  onChange={handleEditChange}
                  className="w-full bg-[#05081a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Staked Allocation Amount</label>
                <input
                  name="amount"
                  value={editData.amount}
                  onChange={handleEditChange}
                  className="w-full bg-[#05081a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex items-center justify-end gap-3">
              <button onClick={() => setEditData(null)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition">
                Abort Changes
              </button>
              <button onClick={saveEdit} className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-950/40 hover:brightness-110 transition">
                Preserve Mutation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Purge Modal Overlay */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-base">
                <FaTrashAlt />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide">Purge Execution Protocol</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Are you completely certain you intend to wipe this transaction from the view matrix cache?</p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-[#0d153a]/20 border-t border-white/10 flex items-center justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition">
                Cancel Action
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-950/40 hover:brightness-110 transition">
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Deposit Entry Formulation System */}
      {showManualDeposit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
              <h3 className="text-sm font-bold text-white tracking-wide">Initialize Manual Ledger Deposit</h3>
              <button onClick={() => setShowManualDeposit(false)} className="text-slate-400 hover:text-white text-lg focus:outline-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Target Account Target</label>
                <div className="relative">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-[#05081a] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[#0b0e26] text-slate-500">Select network account node...</option>
                    {users.map((u) => (
                      <option key={u.id} value={`${u.name} ${u.user_code}`} className="bg-[#0b0e26] text-slate-100">
                        {u.name} ({u.user_code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[8px]">▼</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Tier Level Product Index</label>
                <div className="relative">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-[#05081a] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[#0b0e26] text-slate-500">Select cluster pricing stack...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.name} className="bg-[#0b0e26] text-slate-100">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[8px]">▼</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Liquidity Inflow Allocation ($)</label>
                <input
                  type="number"
                  placeholder="Enter custom liquidity metric..."
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#05081a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex items-center justify-end gap-3">
              <button onClick={() => setShowManualDeposit(false)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition">
                Cancel Deployment
              </button>
              <button onClick={createDeposit} className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-950/40 hover:brightness-110 transition">
                Inject Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositTransactions;