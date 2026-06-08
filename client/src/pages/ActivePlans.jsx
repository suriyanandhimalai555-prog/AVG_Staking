import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";
import { FaEllipsisV, FaSearch, FaChevronLeft, FaChevronRight, FaEye, FaToggleOn, FaToggleOff, FaTrashAlt, FaCheck, FaTimes, FaCalendarAlt, FaUser, FaLayerGroup } from "react-icons/fa";

const ActivePlans = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [plansData, setPlansData] = useState([]);
  const [requestPlans, setRequestPlans] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const dropdownRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [editForm, setEditForm] = useState({
    amount: '',
    status: 'active',
  });

  // Close context menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ✅ DATE FORMATTING LOGIC */
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    const istDate = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const day = String(istDate.getDate()).padStart(2, "0");
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const year = istDate.getFullYear();

    let hours = istDate.getHours();
    const minutes = String(istDate.getMinutes()).padStart(2, "0");
    const seconds = String(istDate.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year} • ${hours}:${minutes} ${ampm}`;
  };

  /* ================= FETCH DATA FUNCTIONS ================= */
  const fetchAllPlans = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || 'N/A',
        userCode: item.user_code || '-',
        planName: item.plan_name || 'N/A',
        amountValue: Number(item.amount ?? 0),
        dailyROIValue: Number(item.daily_roi ?? 0),
        depositAmount: `$${Number(item.amount ?? 0).toLocaleString()}`,
        dailyROI: `$${Number(item.daily_roi ?? 0).toLocaleString()}`,
        status: String(item.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive',
        createdAt: formatDate(item.created_at),
      }));

      setPlansData(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Failed to load active plans");
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || 'N/A',
        userCode: item.user_code || '-',
        planName: item.plan_name || 'N/A',
        amount: `$${Number(item.amount ?? 0).toLocaleString()}`,
        status: String(item.status || '').toLowerCase() === 'pending' ? 'Pending' : String(item.status || ''),
        createdAt: formatDate(item.created_at),
      }));

      setRequestPlans(formatted);
    } catch (err) {
      console.error('Fetch requests error:', err);
      toast.error("Failed to load tier purchase requests");
    }
  }, []);

  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  useEffect(() => {
    if (showRequests) fetchRequests();
  }, [showRequests, fetchRequests]);

  useEffect(() => {
    setMenuOpen(null);
    setCurrentPage(1);
  }, [showRequests]);

  const handleApproveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Investment allocation approved");
      fetchRequests();
      fetchAllPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval transaction rejected");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Allocation request voided successfully");
      fetchRequests();
      fetchAllPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection protocol failed");
    }
  };

  /* ================= ACTION HANDLERS ================= */
  const handleView = (plan) => {
    setSelectedPlan(plan);
    setModalType('view');
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleDelete = (plan) => {
    setSelectedPlan(plan);
    setModalType('delete');
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleStatusChange = async (plan) => {
    setMenuOpen(null);
    try {
      const token = localStorage.getItem('token');
      const newStatus = plan.status === 'Active' ? 'inactive' : 'active';

      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${plan.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Node state altered to ${newStatus}`);
      fetchAllPlans();
    } catch (err) {
      toast.error("Node status mutation failed");
    }
  };

  const handleModalConfirm = async () => {
    try {
      const token = localStorage.getItem('token');

      if (modalType === 'delete' && selectedPlan) {
        await axios.delete(
          `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${selectedPlan.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("User allocation deleted permanently");
        fetchAllPlans();
        setShowModal(false);
        setSelectedPlan(null);
        return;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Execution error encountered");
    }
  };

  const dataSource = showRequests ? requestPlans : plansData;

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return dataSource.filter((item) => {
      return (
        String(item.user || '').toLowerCase().includes(q) ||
        String(item.userCode || '').toLowerCase().includes(q) ||
        String(item.planName || '').toLowerCase().includes(q) ||
        String(item.depositAmount || item.amount || '').toLowerCase().includes(q) ||
        String(item.status || '').toLowerCase().includes(q)
      );
    });
  }, [dataSource, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(currentPage - 2, 1);
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

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
            <h3 className="text-sm font-bold text-white tracking-wide">
              {modalType === 'delete' ? 'Revoke Allocations' : 'Inspecting Master Node'}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-lg focus:outline-none">×</button>
          </div>

          <div className="p-6 space-y-4">
            {modalType === 'delete' && (
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you certain you want to purge the current plan subscription linked to account <span className="text-purple-400 font-bold">{selectedPlan?.user}</span>? This structural modification cannot be undone.
              </p>
            )}

            {modalType === 'view' && selectedPlan && (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {Object.entries(selectedPlan).map(([k, v]) => {
                  if (typeof v === 'object' || k.includes('Value')) return null;
                  return (
                    <div key={k} className="flex justify-between items-center bg-[#0d1433] px-3.5 py-2.5 border border-white/5 rounded-xl text-xs">
                      <span className="text-slate-400 font-medium capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-slate-100 font-bold tracking-wide">{String(v)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex items-center justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition">
              Dismiss
            </button>
            {modalType === 'delete' && (
              <button onClick={handleModalConfirm} className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-950/40 hover:brightness-110 transition">
                Confirm Purge
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b1e] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none rounded-2xl shadow-2xl">
      {/* Ambient Visual Atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
        
        {/* Dynamic Navigation & Filtering Header Panel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <FaLayerGroup className="text-purple-400 text-base" />
              {showRequests ? 'Subscription Authorization Ledger' : 'Active Portfolio Management'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {showRequests ? 'Approve or dismiss incoming tier purchase protocols' : 'Live operational tracking of premium contract variables'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Real-time Filter Field */}
            <div className="relative flex items-center min-w-[240px]">
              {/* <FaSearch className="absolute left-4 text-slate-400 text-xs pointer-events-none" /> */}
              <input
                type="text"
                placeholder="Search index metadata..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0f2b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition"
              />
            </div>

            {/* Toggle Mode Option Button */}
            <button
              type="button"
              onClick={() => setShowRequests((prev) => !prev)}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg border transition-all duration-200 active:scale-95 ${
                showRequests 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              {showRequests ? "Active Plans" : "Requests Plans"}
            </button>
          </div>
        </div>

        {/* Master Data Grid / Card Core Wrapper */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#0c1233]/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-4.5 px-6 w-16 text-center">Index</th>
                  <th className="py-4.5 px-6"><span className="flex items-center gap-1.5"><FaUser className="text-[9px] text-purple-400" /> Account Owner</span></th>
                  <th className="py-4.5 px-6">Selected Tier</th>
                  <th className="py-4.5 px-6">Principal Input</th>
                  {!showRequests && <th className="py-4.5 px-6">Accrued Yield (ROI)</th>}
                  <th className="py-4.5 px-6">Status Anchor</th>
                  <th className="py-4.5 px-6"><span className="flex items-center gap-1.5"><FaCalendarAlt className="text-[9px] text-indigo-400" /> Timestamp</span></th>
                  <th className="py-4.5 px-6 text-center">Operations</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-medium">
                {currentItems.length > 0 ? (
                  currentItems.map((plan, index) => (
                    <tr key={plan.id} onClick={() => {
    if (!showRequests) {
      handleView(plan);
    }
  }} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="py-4 px-6 text-center text-slate-500 font-mono">
                        {String((currentPage - 1) * rowsPerPage + index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold tracking-wide">{plan.user}</span>
                          <span className="font-mono text-[10px] text-slate-500">{plan.userCode}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-purple-300 font-semibold">{plan.planName}</td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-200">
                        {showRequests ? plan.amount : plan.depositAmount}
                      </td>
                      {!showRequests && (
                        <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                          {plan.dailyROI}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          plan.status === "Active" 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : plan.status === "Pending"
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            : 'bg-slate-500/10 text-slate-400 border-white/5'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-[11px] font-mono">{plan.createdAt}</td>
                      <td className="py-4 px-6 text-center relative" onClick={(e) => e.stopPropagation()}>
                        {showRequests ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleApproveRequest(plan.id)}
                              title="Approve Protocol"
                              className="p-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 rounded-xl transition duration-150"
                            >
                              <FaCheck className="text-[10px]" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(plan.id)}
                              title="Reject Protocol"
                              className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 rounded-xl transition duration-150"
                            >
                              <FaTimes className="text-[10px]" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <button 
                              onClick={() => setMenuOpen(menuOpen === plan.id ? null : plan.id)}
                              className={`p-2 rounded-xl transition duration-150 ${menuOpen === plan.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              <FaEllipsisV className="text-xs cursor-pointer" />
                            </button>

                            {/* Dropdown Box Menu */}
                            {menuOpen === plan.id && (
                              <div ref={dropdownRef} className="absolute right-14 top-1/2 -translate-y-1/2 z-50 min-w-[150px] bg-[#0c0f28] border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5 text-left animate-fade-in">
                                <button onClick={() => handleView(plan)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-white/5 hover:text-white transition">
                                  <FaEye className="text-[10px] text-purple-400" /> View Plan
                                </button>
                                <button onClick={() => handleStatusChange(plan)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-white/5 hover:text-white transition">
                                  {plan.status === 'Active' ? (
                                    <>
                                      <FaToggleOff className="text-[10px] text-amber-400" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <FaToggleOn className="text-[10px] text-emerald-400" /> Activate
                                    </>
                                  )}
                                </button>
                                <hr className="border-white/5 my-1" />
                                <button onClick={() => handleDelete(plan)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10 transition">
                                  <FaTrashAlt className="text-[10px]" /> Delete Plan
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={showRequests ? "7" : "8"} className="py-20 text-center text-slate-500 font-medium tracking-wide">
                      No system parameters identified matching standard criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Luxury Custom Matrix Pagination Navigation Panel Footer */}
          <div className="bg-[#0b102e]/50 border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <span>Rows visible per frame</span>
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                        currentPage === p 
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
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-20 disabled:pointer-events-none"
              >
                <FaChevronRight className="text-[9px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default ActivePlans;