import React, { useMemo, useState, useEffect } from "react";
import { FaSearch, FaCoins, FaInfoCircle } from "react-icons/fa";
import axios from "axios";

const ROIEarnings = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const formatDateTime = (value) => {
    if (!value) return "-";

    // 🔥 DO NOT use timezone conversion
    const date = new Date(value.replace(" ", "T"));

    if (isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // ✅ FETCH DATA
  const fetchROI = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/roi-all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        fromUser: `${item.from_user} (${item.from_id})`,
        toUser: `${item.to_user} (${item.to_id})`,
        type: "Daily ROI Income",
        amount: `$${Number(item.amount).toFixed(2)}`,
        createdAt: item.created_at,
      }));

      setData(formatted);
    } catch (err) {
      console.error("Admin ROI fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchROI();
  }, []);

  // ✅ SEARCH
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) =>
      r.fromUser.toLowerCase().includes(q) ||
      r.toUser.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.amount.toLowerCase().includes(q)
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const pageItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

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

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 rounded-2xl shadow-2xl">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white">ROI Earnings Ledger</h2>
          <p className="text-sm text-slate-400 mt-1">Auditing real-time daily returns generated globally</p>
        </div>

        <div className="relative w-full md:w-80">
          {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <FaSearch size={14} />
          </span> */}
          <input
            type="text"
            placeholder="Search matching profiles..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* DATA LEDGER CARD */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
          <h3 className="font-semibold text-base text-white">Daily Yield Distribution</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider font-semibold border-b border-slate-700">
                <th className="py-4 px-5 w-16">S.No</th>
                <th className="py-4 px-5">Source Node (From)</th>
                <th className="py-4 px-5">Beneficiary Node (To)</th>
                <th className="py-4 px-5">Allocation Stream</th>
                <th className="py-4 px-5">Disbursed Amount</th>
                <th className="py-4 px-5">Generation Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                      <span className="text-xs font-medium tracking-wide text-slate-400">Querying ROI indices...</span>
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <FaInfoCircle size={20} />
                      <span>No matching active yield configurations detected in runtime database.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((row, i) => (
                  <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                      {(page - 1) * rowsPerPage + i + 1}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-200 max-w-xs truncate">
                      {row.fromUser}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-200 max-w-xs truncate">
                      {row.toUser}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium tracking-wide border bg-amber-500/10 text-amber-400 border-amber-500/20">
                        <FaCoins className="inline mr-1 text-amber-400" size={11} />
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-emerald-400 tracking-wide">
                      {row.amount}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {formatDateTime(row.createdAt)}
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
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
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
                      ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20"
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
    </div>
  );
};

export default ROIEarnings;