import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaSearch, FaSitemap, FaUserAlt, FaCalendarAlt, FaDollarSign, FaFingerprint, FaEye, FaTimes } from "react-icons/fa";
import { formatDateTimeIST } from "../utils/dateFormat";

/**
 * LevelEarnings.jsx
 * Admin Page - Level Income (ALL USERS)
 */
const LevelEarnings = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewItem, setViewItem] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/level-income`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        fromUser: `${item.from_name || ""} ${item.from_lastname || ""} (${item.from_code || "-"})`,
        toUser: `${item.name || ""} ${item.lastname || ""} (${item.user_code || "-"})`,
        type: `Level ${item.level} Income`,
        amount: `$${Number(item.income || 0).toFixed(2)}`,
        createdAt: formatDateTimeIST(item.created_at),
      }));

      setData(formatted);
    } catch (err) {
      console.error("Fetch level income error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= SEARCH ================= */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;

    return data.filter((r) =>
      r.fromUser.toLowerCase().includes(q) ||
      r.toUser.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.amount.toLowerCase().includes(q) ||
      r.createdAt.toLowerCase().includes(q)
    );
  }, [search, data]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const pageItems = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filtered.slice(startIndex, startIndex + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, rowsPerPage]);

  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 1) return [1];

    let start = Math.max(page - 2, 1);
    let end = Math.min(start + maxVisible - 1, totalPages);

    if (end - start < maxVisible - 1) {
      start = Math.max(end - maxVisible + 1, 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const startIndex = (page - 1) * rowsPerPage;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 rounded-2xl shadow-2xl">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white">Level Matrix Earnings</h2>
          <p className="text-sm text-slate-400 mt-1">Audit multi-tier organizational downline payouts and generations</p>
        </div>

        <div className="relative w-full md:w-96">
          {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <FaSearch size={14} />
          </span> */}
          <input
            type="text"
            placeholder="Search level parameters, names, sums..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* DATA CARD ARCHITECTURE */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold text-base text-white">Multi-Tier Revenue Distribution</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider font-semibold border-b border-slate-700">
                <th className="py-4 px-5 w-16">S.No</th>
                <th className="py-4 px-5">Origin Node (From)</th>
                <th className="py-4 px-5">Target Affiliate (To)</th>
                <th className="py-4 px-5">Generation Tier</th>
                <th className="py-4 px-5">Allocated Sum</th>
                <th className="py-4 px-5">Settlement Timestamp</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-xs font-medium tracking-wide text-slate-400">Compiling lineage payout trees...</span>
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 font-medium">
                    No matching matrix level distribution logs tracked within current query parameters.
                  </td>
                </tr>
              ) : (
                pageItems.map((row, i) => (
                  <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                      {startIndex + i + 1}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-200 max-w-xs truncate">
                      {row.fromUser}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-200 max-w-xs truncate">
                      {row.toUser}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        <FaSitemap className="mr-1.5 text-indigo-400" size={11} />
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-emerald-400 tracking-wide">
                      {row.amount}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {row.createdAt}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => setViewItem(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 text-xs font-medium rounded-lg transition-all"
                      >
                        <FaEye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLLER MATRIX (PAGINATION) */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <span>Rows per view channel:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 text-slate-300 disabled:hover:bg-slate-800 transition-colors font-medium"
            >
              {"<"}
            </button>

            {getPagination().map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-1.5 text-slate-600 font-bold">...</span>
              ) : (
                <button
                  key={i}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1.5 rounded font-semibold border transition-all ${
                    page === p
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 text-slate-300 disabled:hover:bg-slate-800 transition-colors font-medium"
            >
              {">"}
            </button>
          </div>

        </div>
      </div>

      {/* AUDIT VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-transform">
            
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-base text-white tracking-wide">Matrix Generation Scope</h3>
              <button 
                onClick={() => setViewItem(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                <FaFingerprint className="text-indigo-400 mt-1 shrink-0" size={16} />
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Transaction Index ID</div>
                  <div className="text-slate-200 mt-0.5 font-mono">{viewItem.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                  <FaUserAlt className="text-slate-400 mt-1 shrink-0" size={14} />
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Origin Source Node</div>
                    <div className="text-slate-200 mt-0.5 font-medium break-all">{viewItem.fromUser}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                  <FaUserAlt className="text-indigo-400 mt-1 shrink-0" size={14} />
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Target Affiliate Recipient</div>
                    <div className="text-slate-200 mt-0.5 font-medium break-all">{viewItem.toUser}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                  <FaDollarSign className="text-emerald-400 mt-1 shrink-0" size={14} />
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Disbursed Value</div>
                    <div className="text-emerald-400 font-bold mt-0.5 text-base tracking-wide">{viewItem.amount}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                  <FaCalendarAlt className="text-slate-400 mt-1 shrink-0" size={14} />
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Timestamp Log</div>
                    <div className="text-slate-200 mt-0.5 text-xs">{viewItem.createdAt}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Matrix View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelEarnings;