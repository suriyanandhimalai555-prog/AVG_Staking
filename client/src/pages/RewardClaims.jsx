import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { 
  FaSearch, FaGift, FaCalendarAlt, FaRupeeSign, FaUserCircle, 
  FaExchangeAlt, FaHourglassHalf, FaCheckCircle, FaBan, FaSave, FaFolderMinus 
} from "react-icons/fa";

const RewardClaims = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [savingKey, setSavingKey] = useState("");
  const [monthSavingId, setMonthSavingId] = useState("");
  const [closingId, setClosingId] = useState("");
  const [form, setForm] = useState({});
  const [monthForm, setMonthForm] = useState({});

  const token = localStorage.getItem("token");

  const api = useMemo(() => {
    return axios.create({
      baseURL:
        import.meta.env.VITE_API_URL ||
        `${import.meta.env.VITE_APP_BASE_URL}/api`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ranks/claims/admin");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const keyOf = (row) => `${row.user_id}-${row.reward}-${row.target_amount}`;

  const handleChange = (key, field, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleMonthChange = (monthId, field, value) => {
    setMonthForm((prev) => ({
      ...prev,
      [monthId]: {
        ...(prev[monthId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (row) => {
    if (row.claim_status === "closed") return;

    const key = keyOf(row);
    const current = form[key] || {};

    try {
      setSavingKey(key);

      await api.post("/ranks/claims", {
        userId: row.user_id,
        reward: row.reward,
        target_amount: row.target_amount,
        monthly_amount: current.monthly_amount ?? row.monthly_amount,
        months_count: current.months_count ?? row.months_count ?? 12,
        start_date:
          current.start_date ??
          row.start_date ??
          new Date().toISOString().slice(0, 10),
      });

      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Error saving");
    } finally {
      setSavingKey("");
    }
  };

  const handleCloseClaim = async (row) => {
    if (!row.claim_id || row.claim_status === "closed") return;

    try {
      setClosingId(row.claim_id);

      await api.post("/ranks/claims/close", {
        claimId: row.claim_id,
      });

      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Error closing claim");
    } finally {
      setClosingId("");
    }
  };

  const handleMonthSave = async (monthId) => {
    const current = monthForm[monthId] || {};

    try {
      setMonthSavingId(monthId);

      await api.post("/ranks/claims/month-status", {
        monthId,
        transaction_id: current.transaction_id || "",
        status: current.status || "completed",
      });

      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Error updating month");
    } finally {
      setMonthSavingId("");
    }
  };

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const firstName = String(row.name || "").toLowerCase();
      const lastName = String(row.lastname || "").toLowerCase();
      const rewardName = String(row.reward || "").toLowerCase();
      const userCode = String(
        row.referral_code || row.user_code || row.userid || row.user_id || ""
      ).toLowerCase();

      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        rewardName.includes(query) ||
        userCode.includes(query)
      );
    });
  }, [rows, searchTerm]);

  const getMonthStatusBadge = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "stopped":
        return "bg-slate-700/40 text-slate-400 border-slate-600/30";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 rounded-2xl shadow-2xl">
      
      {/* PREMIUM ACTIONS CONTROL HEADER */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white flex items-center gap-2.5">
            <FaGift className="text-amber-400" size={22} />
            Reward Claims Ledger
          </h2>
          <p className="text-sm text-slate-400 mt-1">Audit recurring monthly payout installments, operational schedules, and network transactions</p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search claims, name tags, IDs..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CORE CONTROL FEED */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 tracking-wider">Syncing processing ledgers...</span>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl text-center py-16 text-slate-500 font-medium text-sm">
          {rows.length === 0 ? "No active claim profiles available inside database matrix." : "No matching claim records found for current parameters."}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRows.map((row) => {
            const key = keyOf(row);
            const local = form[key] || {};
            const isClosed = row.claim_status === "closed";

            return (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden" key={key}>
                
                {/* MATRIC CONTROL SUB-HEADER */}
                <div className="bg-slate-900/60 px-6 py-4 border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-amber-400">
                      <FaUserCircle size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">{row.reward}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                        <span className="text-slate-200 font-semibold">{row.name} {row.lastname}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700/50">
                          {row.referral_code || row.user_code || row.userid || row.user_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-sm font-bold text-emerald-400">
                      <FaRupeeSign size={12} />
                      {row.target_amount}
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wider uppercase ${
                      isClosed 
                        ? "bg-slate-700/40 text-slate-400 border-slate-600/40" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {isClosed ? "Closed Account" : "Active Ledger"}
                    </span>

                    {!isClosed && row.claim_id > 0 && (
                      <button
                        onClick={() => handleCloseClaim(row)}
                        disabled={closingId === row.claim_id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
                      >
                        <FaFolderMinus size={12} />
                        {closingId === row.claim_id ? "Closing..." : "Close Process"}
                      </button>
                    )}
                  </div>
                </div>

                {/* LOGS PARAMETERS REWRITE CONTROLS */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-800/40">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none text-xs font-bold">₹</span>
                      <input
                        type="number"
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-40 transition-colors"
                        value={local.monthly_amount ?? row.monthly_amount ?? ""}
                        onChange={(e) => handleChange(key, "monthly_amount", e.target.value)}
                        disabled={isClosed}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeline Commencement</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-40 transition-colors"
                      value={local.start_date ?? row.start_date ?? ""}
                      onChange={(e) => handleChange(key, "start_date", e.target.value)}
                      disabled={isClosed}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Installment Matrix (Months)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-40 transition-colors"
                      value={local.months_count ?? row.months_count ?? 12}
                      onChange={(e) => handleChange(key, "months_count", e.target.value)}
                      disabled={isClosed}
                    />
                  </div>

                  <button
                    onClick={() => handleSave(row)}
                    disabled={savingKey === key || isClosed}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none h-[34px]"
                  >
                    <FaSave size={12} />
                    {isClosed ? "Closed Layer" : savingKey === key ? "Saving..." : "Save Parameters"}
                  </button>
                </div>

                {/* DETAILED MONTH BREAKDOWN SCHEDULE */}
                {row.claim_months && row.claim_months.length > 0 && (
                  <div className="border-t border-slate-700/60 bg-slate-900/20 overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-400 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-700/50">
                          <th className="py-3 px-6 w-20">Cycle</th>
                          <th className="py-3 px-6">Expected Due Window</th>
                          <th className="py-3 px-6">Installment</th>
                          <th className="py-3 px-6 w-72">Network Transaction Identification (Txn)</th>
                          <th className="py-3 px-6 w-44">Internal Status</th>
                          <th className="py-3 px-6 text-center w-24">Commit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30 text-xs">
                        {row.claim_months.map((m) => {
                          const monthLocal = monthForm[m.id] || {};
                          const monthStatus = m.status || "pending";
                          const disableMonthInput = isClosed && monthStatus === "stopped";

                          return (
                            <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-6 font-mono text-slate-500 font-bold">#{m.month_no}</td>
                              
                              <td className="py-3 px-6 text-slate-300 font-medium">
                                <span className="inline-flex items-center gap-1.5">
                                  <FaCalendarAlt className="text-slate-500" size={11} />
                                  {m.due_date ? new Date(m.due_date).toLocaleDateString("en-IN") : "-"}
                                </span>
                              </td>

                              <td className="py-3 px-6 font-semibold text-slate-200">₹{m.amount}</td>

                              <td className="py-3 px-6">
                                <input
                                  type="text"
                                  className="w-full max-w-xs px-2.5 py-1 bg-slate-950/80 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500 disabled:opacity-40 transition-colors"
                                  value={monthLocal.transaction_id ?? m.transaction_id ?? ""}
                                  onChange={(e) => handleMonthChange(m.id, "transaction_id", e.target.value)}
                                  disabled={disableMonthInput}
                                  placeholder="No transaction ID logged"
                                />
                              </td>

                              <td className="py-3 px-6">
                                <select
                                  className="w-full max-w-[140px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500 disabled:opacity-40 cursor-pointer font-medium"
                                  value={monthLocal.status ?? monthStatus}
                                  onChange={(e) => handleMonthChange(m.id, "status", e.target.value)}
                                  disabled={disableMonthInput}
                                >
                                  <option value="pending">⏳ Pending</option>
                                  <option value="completed">✅ Completed</option>
                                  {monthStatus === "stopped" && (
                                    <option value="stopped">⛔ Halted Stopped</option>
                                  )}
                                </select>
                              </td>

                              <td className="py-3 px-6 text-center">
                                <button
                                  onClick={() => handleMonthSave(m.id)}
                                  disabled={monthSavingId === m.id || disableMonthInput}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-30"
                                >
                                  {monthSavingId === m.id ? "Saving..." : "Update"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RewardClaims;