import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FaEllipsisV, FaSearch, FaDownload, FaTimes, FaTrashAlt, FaEye, FaEdit, FaCheck, FaBan } from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";

const WithdrawTransactions = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [menu, setMenu] = useState(null);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const dropdownRef = useRef(null);
  const token = localStorage.getItem("token");
  const EXCHANGE_RATE = 95;

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year}, ${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  };

  const normalizeStatus = (status) => String(status || "PENDING").toUpperCase();

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const formatted = (res.data || []).map((d) => {
        const amount = Number(d.amount || 0);
        const fee = amount * 0.1;
        const approvedUsd = Number(d.approved_amount ?? amount - fee);
        const approvedInr = Number(
          d.approved_amount ? d.approved_amount : approvedUsd * EXCHANGE_RATE
        );

        return {
          id: d.id,
          user: `${d.name || ""} ${d.lastname || ""} (${d.user_code || "-"})`.trim(),
          wallet: d.wallet_type || "-",
          amount,
          amountDisplay: `$${amount.toFixed(2)}`,
          fee: fee.toFixed(2),
          approvedUsd: approvedUsd.toFixed(2),
          approvedInr: approvedInr.toFixed(2),
          transactionId: d.transaction_id || "",
          currency: d.currency_type || "USD",
          proof: d.proof || d.transaction_proof || d.tx_proof || "",
          status: normalizeStatus(d.status),
          created: formatDateTime(d.created_at),
          bank: {
            accountHolderName: d.account_holder_name || "-",
            bankName: d.bank_name || "-",
            accountNumber: d.account_number || "-",
            ifscCode: d.ifsc_code || "-",
            branch: d.branch || "-",
            upiId: d.upi_id || "-",
            gpayNumber: d.gpay_number || "-",
          },
        };
      });
      setData(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((d) => {
      const matchesSearch =
        d.user.toLowerCase().includes(q) ||
        d.wallet.toLowerCase().includes(q) ||
        d.amountDisplay.toLowerCase().includes(q) ||
        d.transactionId.toLowerCase().includes(q) ||
        d.proof.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, data, statusFilter]);

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
  }, [search, rows, statusFilter]);

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

  const confirmDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${editData.id}/status`,
        {
          status: editData.status,
          transactionId: editData.transactionId || null,
          approvedAmount: Number(editData.approvedInr || 0),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditData(null);
      fetchData();
    } catch (err) {
      console.error("Save edit error:", err);
    }
  };

  const approve = async (d) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${d.id}/status`,
        {
          status: "APPROVED",
          transactionId: d.transactionId || null,
          approvedAmount: Number(d.approvedInr || 0),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMenu(null);
      fetchData();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const reject = async (id) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${id}/status`,
        { status: "REJECTED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMenu(null);
      fetchData();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const exportByStatus = (status) => {
    const rowsToExport = data.filter((item) => item.status === normalizeStatus(status));
    if (!rowsToExport.length) {
      alert(`No ${status.toLowerCase()} withdrawals found to export.`);
      return;
    }

    const exportData = rowsToExport.map((item) => {
      const amount = Number(item.amount || 0);
      const fee = -(amount * 0.1);
      const dollar = amount + fee;
      const userText = item.user || "-";
      const codeMatch = userText.match(/\((.*?)\)/);
      return {
        USER: userText.replace(/\s*\(.*?\)\s*$/, "").trim() || "-",
        CODE: codeMatch ? codeMatch[1] : "-",
        "Account Number": item.bank?.accountNumber || "-",
        "IFSC Code": item.bank?.ifscCode || "-",
        "GPay / PhonePe": item.bank?.gpayNumber || "-",
        "Request Amount": amount,
        "Fee (10%)": fee,
        Dollar: dollar,
      };
    });

    const totalDollar = exportData.reduce((sum, row) => sum + Number(row.Dollar || 0), 0);
    exportData.push({ USER: "TOTAL", CODE: "", "Account Number": "", "IFSC Code": "", "GPay / PhonePe": "", "Request Amount": "", "Fee (10%)": "", Dollar: totalDollar });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${status.toUpperCase()} Withdrawals`);
    XLSX.writeFile(workbook, `withdrawals_${status.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 rounded-2xl shadow-2xl shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white">Transactions</h2>
          <p className="text-sm text-slate-400 mt-1">Withdraw Request Management Portal</p>
        </div>
        <div className="relative w-full md:w-96">
          {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <FaSearch size={16} />
          </span> */}
          <input
            type="text"
            placeholder="Search credentials, txn id, status..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Control Actions & Filtering */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-300">Status Action:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => exportByStatus("PENDING")} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600 border border-amber-600 text-amber-300 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm">
            <FaDownload /> Pending Sheet
          </button>
          <button onClick={() => exportByStatus("APPROVED")} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm">
            <FaDownload /> Approved Sheet
          </button>
          <button onClick={() => exportByStatus("REJECTED")} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm">
            <FaDownload /> Rejected Sheet
          </button>
        </div>
      </div>

      {/* Main Datatable container */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold text-lg text-white">Withdraw Ledger Requests</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider font-semibold border-b border-slate-700">
                <th className="py-4 px-5">S.No</th>
                <th className="py-4 px-5">User Profile</th>
                <th className="py-4 px-5">Wallet System</th>
                <th className="py-4 px-5">Requested Value</th>
                <th className="py-4 px-5">Transaction Audit / Proof</th>
                <th className="py-4 px-5">Status Badge</th>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5 text-center">Execution Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-sm text-slate-300">
              {paginated.length > 0 ? (
                paginated.map((d, i) => (
                  <tr key={d.id} onClick={() => {
                    setViewData(d);
                    setMenu(null);
                  }} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500">{(page - 1) * rows + i + 1}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-200">{d.user}</td>
                    <td className="py-3.5 px-5"><span className="bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700 text-slate-400">{d.wallet}</span></td>
                    <td className="py-3.5 px-5 font-semibold text-emerald-400">{d.amountDisplay}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-400 max-w-xs truncate">
                      {[d.proof !== "-" ? d.proof : null, d.transactionId !== "-" ? d.transactionId : null].filter(Boolean).join(" | ") || "-"}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium tracking-wide border ${d.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                          d.status === "REJECTED" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">{d.created}</td>
                    <td className="py-3.5 px-5 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setMenu(menu === d.id ? null : d.id)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-600/50 transition-colors">
                        <FaEllipsisV />
                      </button>

                      {menu === d.id && (
                        <div ref={dropdownRef} className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 py-1 text-left overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                          <button onClick={() => { setViewData(d); setMenu(null); }} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-800 text-slate-300 hover:text-white"><FaEye /> View Profile</button>
                          <button onClick={() => { setEditData(d); setMenu(null); }} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-800 text-slate-300 hover:text-white"><FaEdit /> Quick Edit</button>
                          <button onClick={() => approve(d)} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-emerald-950/50 text-emerald-400 hover:text-emerald-300"><FaCheck /> Approve</button>
                          <button onClick={() => reject(d.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300"><FaBan /> Reject</button>
                          <div className="border-t border-slate-800 my-1"></div>
                          <button onClick={() => { setDeleteId(d.id); setMenu(null); }} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-rose-600 text-slate-300 hover:text-white"><FaTrashAlt /> Delete Record</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 font-medium">No withdrawal parameters located inside current query parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Controlled Pagination parameters */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <span>Rows sizing selection matrix:</span>
            <select value={rows} onChange={(e) => setRows(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none text-slate-300">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 disabled:hover:bg-slate-800 text-slate-300 transition-colors">{"<"}</button>
            {getPagination().map((p, i) => p === "..." ? (
              <span key={i} className="px-2 text-slate-600">...</span>
            ) : (
              <button key={i} onClick={() => setPage(p)} className={`px-2.5 py-1.5 rounded font-medium transition-colors border ${page === p ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 disabled:hover:bg-slate-800 text-slate-300 transition-colors">{">"}</button>
          </div>
        </div>
      </div>

      {/* Primary Edit Dialog Box Overlay */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-850">
              <h2 className="text-lg font-bold text-white">Modify System Parameters</h2>
              <button onClick={() => setEditData(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><FaTimes size={16} /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Profile Attachment</span><strong className="text-slate-200">{editData.user}</strong></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Gateway System</span><strong className="text-slate-200">{editData.wallet}</strong></div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-800 pb-1.5">User Remittance Parameters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-500 block mb-0.5">Holder Title</span><span className="font-semibold text-slate-300">{editData.bank?.accountHolderName}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">Institution Code</span><span className="font-semibold text-slate-300">{editData.bank?.bankName}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">Remittance Line</span><span className="font-semibold text-slate-300">{editData.bank?.accountNumber}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">Routing Key (IFSC)</span><span className="font-semibold text-slate-300">{editData.bank?.ifscCode}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">Branch Network</span><span className="font-semibold text-slate-300">{editData.bank?.branch}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">UPI Identifier</span><span className="font-semibold text-slate-300">{editData.bank?.upiId}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500 block mb-0.5">Alternative Payment Interface</span><span className="font-semibold text-slate-300">{editData.bank?.gpayNumber}</span></div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-800 pb-1.5">Ledger Invoicing Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                  <div><span className="text-slate-500 block text-xs mb-1">Currency Specification</span><span className="font-semibold text-slate-300 bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-800 block text-center">{editData.currency}</span></div>
                  <div><span className="text-slate-500 block text-xs mb-1">Base Valuation</span><span className="font-semibold text-slate-300 bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-800 block text-center">${Number(editData.amount).toFixed(2)}</span></div>
                  <div><span className="text-slate-500 block text-xs mb-1">Brokerage Surcharge (10%)</span><span className="font-semibold text-slate-400 bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-800 block text-center">${Number(editData.fee).toFixed(2)}</span></div>

                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="text-slate-400 block text-xs mb-1 font-medium">Disbursed Ledger Value (INR ₹)</label>
                    <input type="number" name="approvedInr" value={editData.approvedInr || ""} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200" step="0.01" />
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="text-slate-400 block text-xs mb-1 font-medium">System Transaction Hash ID</label>
                    <input type="text" name="transactionId" value={editData.transactionId || ""} onChange={handleEditChange} placeholder="Enter receipt hash ID" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200 text-xs" />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-xs mb-1 font-medium">Ledger State Assertion</label>
                    <select name="status" value={editData.status || ""} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 cursor-pointer">
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-850 flex justify-end gap-2.5">
              <button onClick={() => setEditData(null)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors">Abort Changes</button>
              <button onClick={saveEdit} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg">Commit Records</button>
            </div>
          </div>
        </div>
      )}

      {/* Info Inspection View Modal */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-sm">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850">
              <h3 className="font-bold text-white text-base">Metadata View Inspection</h3>
              <button onClick={() => setViewData(null)} className="text-slate-400 hover:text-white"><FaTimes size={14} /></button>
            </div>
            <div className="p-5 space-y-3 text-slate-300">
              <p className="flex justify-between py-1.5 border-b border-slate-800"><strong>Profile Owner:</strong> <span className="text-slate-400">{viewData.user}</span></p>
              <p className="flex justify-between py-1.5 border-b border-slate-800"><strong>Channel Class:</strong> <span className="text-slate-400">{viewData.wallet}</span></p>
              <p className="flex justify-between py-1.5 border-b border-slate-800"><strong>Assigned Value:</strong> <span className="text-emerald-400 font-semibold">{viewData.amountDisplay}</span></p>
              <p className="flex justify-between py-1.5 border-b border-slate-800"><strong>Audit Trace ID:</strong> <span className="text-slate-400 break-all text-xs max-w-[200px] text-right">{viewData.transactionId || "-"}</span></p>
              <p className="flex justify-between py-1.5 border-b border-slate-800"><strong>Cryptographic Proof:</strong> <span className="text-slate-400 truncate max-w-[200px] text-xs">{viewData.proof || "-"}</span></p>
              <p className="flex justify-between py-1.5 border-b border-slate-800"><strong>Ledger Alignment:</strong> <span className="text-amber-400">{viewData.status}</span></p>
              <p className="flex justify-between py-1.5"><strong>System Initialization:</strong> <span className="text-slate-400 text-xs">{viewData.created}</span></p>
            </div>
            <div className="p-3 bg-slate-850 border-t border-slate-700 flex justify-end">
              <button onClick={() => setViewData(null)} className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Destructive Confirmation Drawer */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center text-sm">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20"><FaTrashAlt size={20} /></div>
            <h3 className="font-bold text-lg text-white mb-2">Purge Request Profile?</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">This acts as an absolute truncation protocol. This record cannot be synchronized after removal.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all text-xs">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all text-xs shadow-lg">Confirm Purge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawTransactions;