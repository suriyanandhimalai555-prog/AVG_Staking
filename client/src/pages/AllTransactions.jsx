import React, { useState, useMemo, useEffect } from "react";
import { FaSearch, FaExchangeAlt, FaUserCheck, FaSitemap } from "react-icons/fa";
import axios from "axios";
import { formatDateTimeIST } from "../utils/dateFormat";

const AllTransactions = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  const token = localStorage.getItem("token");

  // ✅ FETCH ALL (TX + DIRECT + LEVEL)
  const fetchTransactions = async () => {
    try {
      const [txRes, directRes, levelRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/transactions-all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/direct-income`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/level-income`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ TRANSACTIONS
      const txData = (txRes.data || []).map((d, i) => ({
        id: `T-${d.id}-${i}`,
        from: `${d.from_user} (${d.from_id})`,
        to: `${d.to_user} (${d.to_id})`,
        type: d.type || "Transaction",
        amount: `$${Number(d.amount || 0).toFixed(2)}`,
        created: d.created_at,
      }));

      // ✅ DIRECT
      const directData = (directRes.data || []).map((d, i) => ({
        id: `D-${d.id}-${i}`,
        from: d.from_user || "-",
        to: d.to_user || "-",
        type: "Direct Income",
        amount: `$${Number(d.income || 0).toFixed(2)}`,
        created: d.created_at,
      }));

      // ✅ LEVEL
      const levelData = (levelRes.data || []).map((d, i) => ({
        id: `L-${d.id}-${i}`,
        from: `${d.from_name} ${d.from_lastname}`,
        to: `${d.name} ${d.lastname}`,
        type: `Level ${d.level}`,
        amount: `$${Number(d.income || 0).toFixed(2)}`,
        created: d.created_at,
      }));

      // ✅ MERGE + SORT
      const merged = [...txData, ...directData, ...levelData].sort(
        (a, b) => new Date(b.created) - new Date(a.created)
      );

      setData(merged);
    } catch (err) {
      console.error("Admin TX fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ SEARCH
  const filtered = useMemo(() => {
    return data.filter((d) =>
      d.from.toLowerCase().includes(search.toLowerCase()) ||
      d.to.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
  const paginated = filtered.slice((page - 1) * rows, page * rows);

  // ✅ SMART PAGINATION
  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;

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

  const getTypeBadgeStyles = (type) => {
    if (type.includes("Direct")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (type.includes("Level")) {
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    }
    return "bg-slate-500/10 text-slate-300 border-slate-700";
  };

  const getTypeIcon = (type) => {
    if (type.includes("Direct")) return <FaUserCheck className="inline mr-1 text-emerald-400" size={12} />;
    if (type.includes("Level")) return <FaSitemap className="inline mr-1 text-indigo-400" size={12} />;
    return <FaExchangeAlt className="inline mr-1 text-slate-400" size={12} />;
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 rounded-2xl shadow-2xl">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white">Transactions Management</h2>
          <p className="text-sm text-slate-400 mt-1">Unified ledger auditing across platform channels</p>
        </div>

        <div className="relative w-full md:w-80">
          {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <FaSearch size={14} />
          </span> */}
          <input
            type="text"
            placeholder="Search accounts, pathways..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* TABLE DATA ARCHITECTURE */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold text-base text-white">Master Transaction Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider font-semibold border-b border-slate-700">
                <th className="py-4 px-5 w-16">S.No</th>
                <th className="py-4 px-5">Origin Account (From)</th>
                <th className="py-4 px-5">Target Recipient (To)</th>
                <th className="py-4 px-5">Channel Type</th>
                <th className="py-4 px-5">Transferred Sum</th>
                <th className="py-4 px-5">Settled Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                    No matching transactional data records found inside history profiles.
                  </td>
                </tr>
              ) : (
                paginated.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                      {(page - 1) * rows + i + 1}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-200 max-w-xs truncate">
                      {d.from}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-200 max-w-xs truncate">
                      {d.to}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium tracking-wide border ${getTypeBadgeStyles(d.type)}`}>
                        {getTypeIcon(d.type)}
                        {d.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-emerald-400 tracking-wide">
                      {d.amount}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {formatDateTimeIST(d.created)}
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
            <span>Display matrix context:</span>
            <select
              value={rows}
              onChange={(e) => {
                setRows(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={5}>5 records</option>
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
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
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 text-slate-300 disabled:hover:bg-slate-800 transition-colors font-medium"
            >
              {">"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AllTransactions;