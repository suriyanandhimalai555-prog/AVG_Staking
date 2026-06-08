import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaEllipsisV, FaSearch, FaUser, FaPhone, FaLayerGroup, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import axios from "axios";

const Referral = () => {
    const [referrals, setReferrals] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [menuOpen, setMenuOpen] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Global listener setup to keep action dropdown selections stable and working perfectly
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (!event.target.closest(".action-trigger")) {
                    setMenuOpen(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDateTime = (value) => {
        if (!value) return "-";
        const raw = String(value);
        const [datePart, timePart] = raw.split(" ");
        if (!datePart || !timePart) return raw;

        const [year, month, day] = datePart.split("-");
        let [hour, minute, second] = timePart.split(":");
        hour = Number(hour);

        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        const formattedHour = String(hour).padStart(2, "0");
        return `${day}/${month}/${year}, ${formattedHour}:${minute}:${second} ${ampm}`;
    };

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/referrals`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const formatted = res.data.map((r) => ({
                    id: r.id,
                    referrer: `${r.referrer_name || ""} ${r.referrer_lastname || ""}`.trim() || "N/A",
                    referred: `${r.referred_name || ""} ${r.referred_lastname || ""}`.trim() || "N/A",
                    referrerCode: r.referrer_code || "-",
                    referredCode: r.referred_code || "-",
                    referrerPhone: r.referrer_phone || "-",
                    referredPhone: r.referred_phone || "-",
                    level: r.level ? `Level ${r.level}` : "Level 1",
                    created: formatDateTime(r.created_at),
                }));

                setReferrals(formatted);
            } catch (err) {
                console.error(err);
                alert("Failed to fetch referrals");
            } finally {
                setLoading(false);
            }
        };

        fetchReferrals();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return referrals.filter((r) => {
            return (
                r.referrer.toLowerCase().includes(q) ||
                r.referred.toLowerCase().includes(q) ||
                r.referrerCode.toLowerCase().includes(q) ||
                r.referredCode.toLowerCase().includes(q) ||
                r.referrerPhone.toLowerCase().includes(q) ||
                r.referredPhone.toLowerCase().includes(q) ||
                r.level.toLowerCase().includes(q)
            );
        });
    }, [search, referrals]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

    const paginated = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
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

    const confirmDelete = () => {
        setReferrals(referrals.filter((r) => r.id !== deleteId));
        setDeleteId(null);
    };

    return (
        <div className="min-h-screen bg-[#070b1e] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none rounded-2xl shadow-2xl">
            {/* Premium Background Ambient Glow Filters */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
                
                {/* Header Action Row Card */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Referral Management</h2>
                        <p className="text-xs text-slate-400 mt-1">Monitor multilevel account invitation records and lineages</p>
                    </div>

                    <div className="relative w-full sm:w-72 lg:w-96">
                        {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <FaSearch className="text-sm" />
                        </span> */}
                        <input
                            type="text"
                            placeholder="Search name, code, phone, level..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#0d153a]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition duration-200"
                        />
                    </div>
                </div>

                {/* Table Dynamic Layout Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-[#0d153a]/40 text-slate-300 font-semibold tracking-wider text-xs uppercase">
                                    <th className="py-4 px-5 w-16 text-center">S.No</th>
                                    <th className="py-4 px-6">Referrer Profile</th>
                                    <th className="py-4 px-6">Referred Profile</th>
                                    <th className="py-4 px-6">Referrer Phone</th>
                                    <th className="py-4 px-6">Referred Phone</th>
                                    <th className="py-4 px-5 text-center w-32">Affiliate Level</th>
                                    <th className="py-4 px-6">Timestamp Created</th>
                                    <th className="py-4 px-6 text-center w-24">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Fetching referral logs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-400">
                                            No matching referral logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((r, index) => (
                                        <tr key={r.id} onClick={() => setViewData(r)} className="hover:bg-white/[0.02] transition duration-150 group">
                                            <td className="py-4 px-5 text-center font-medium text-slate-400">
                                                {(page - 1) * rowsPerPage + index + 1}
                                            </td>
                                            
                                            {/* Referrer Meta */}
                                            <td className="py-4 px-6 font-semibold text-white">
                                                <div className="flex flex-col">
                                                    <span className="group-hover:text-purple-400 transition-colors">{r.referrer}</span>
                                                    <span className="text-xs font-mono font-medium text-slate-500 mt-0.5">{r.referrerCode}</span>
                                                </div>
                                            </td>

                                            {/* Referred Meta */}
                                            <td className="py-4 px-6 font-semibold text-white">
                                                <div className="flex flex-col">
                                                    <span className="group-hover:text-indigo-400 transition-colors">{r.referred}</span>
                                                    <span className="text-xs font-mono font-medium text-slate-500 mt-0.5">{r.referredCode}</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 text-slate-300 font-medium">{r.referrerPhone}</td>
                                            <td className="py-4 px-6 text-slate-300 font-medium">{r.referredPhone}</td>
                                            
                                            {/* Level Badge Column */}
                                            <td className="py-4 px-5 text-center">
                                                <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    {r.level}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-slate-400 text-xs font-medium">{r.created}</td>

                                            {/* Actions Context Trigger Cell */}
                                            <td className="py-4 px-6 text-center relative overflow-visible"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpen(menuOpen === r.id ? null : r.id);
                                                    }}
                                                    className="action-trigger p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition duration-150 focus:outline-none"
                                                >
                                                    <FaEllipsisV className="pointer-events-none" />
                                                </button>

                                                {menuOpen === r.id && (
                                                    <div 
                                                        ref={dropdownRef}
                                                        className="absolute right-12 top-2 w-32 bg-[#0f1631] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5"
                                                    >
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setViewData(r); setMenuOpen(null); }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-white/5 hover:text-white transition"
                                                        >
                                                            View
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); setMenuOpen(null); }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls Section Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 p-5 bg-[#0d153a]/20">
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-400">
                            <span>Rows per page</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-[#0f1631] border border-white/10 rounded-lg py-1 px-2.5 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/5 bg-white/5 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                            >
                                {"<"}
                            </button>

                            {getPagination().map((p, i) =>
                                p === "..." ? (
                                    <span key={i} className="px-2 text-slate-500 text-sm tracking-wider">...</span>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={() => setPage(p)}
                                        className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-xs font-bold transition duration-150 active:scale-95 ${
                                            page === p 
                                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950/50" 
                                            : "border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/5 bg-white/5 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                            >
                                {">"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW VIEW DETAILS DIALOG MODAL */}
            {viewData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
                            <h3 className="text-base font-bold text-white tracking-wide">Referral Matrix Trace</h3>
                            <button onClick={() => setViewData(null)} className="text-slate-400 hover:text-white transition text-sm">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Referrer Segment */}
                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaUser className="text-purple-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Referrer (Upline)</span>
                                    <span className="text-sm font-semibold text-white mt-0.5">{viewData.referrer}</span>
                                    <span className="text-xs text-slate-400 font-mono mt-0.5">Invite Code: {viewData.referrerCode}</span>
                                </div>
                            </div>

                            {/* Referred Segment */}
                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaUser className="text-indigo-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Referred Account (Downline)</span>
                                    <span className="text-sm font-semibold text-white mt-0.5">{viewData.referred}</span>
                                    <span className="text-xs text-slate-400 font-mono mt-0.5">Profile Code: {viewData.referredCode}</span>
                                </div>
                            </div>

                            {/* Contact Grid details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                    <FaPhone className="text-slate-400 text-sm flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Referrer Mobile</span>
                                        <span className="text-xs font-semibold text-slate-200 mt-0.5">{viewData.referrerPhone}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                    <FaPhone className="text-slate-400 text-sm flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Referred Mobile</span>
                                        <span className="text-xs font-semibold text-slate-200 mt-0.5">{viewData.referredPhone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tier Rank Matrix Level */}
                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaLayerGroup className="text-amber-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Affiliate Level Depth</span>
                                    <span className="text-sm font-bold text-purple-400 mt-0.5">{viewData.level}</span>
                                </div>
                            </div>

                            {/* Timestamp details */}
                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaCalendarAlt className="text-slate-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Binding Generation Timestamp</span>
                                    <span className="text-xs text-slate-400 font-medium mt-0.5">{viewData.created}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex justify-end">
                            <button 
                                onClick={() => setViewData(null)}
                                className="px-5 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNBIND DELETE WARNING MODAL */}
            {deleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 text-center">
                        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            ⚠️
                        </div>
                        
                        <div className="space-y-1.5">
                            <h3 className="text-base font-bold text-white">Sever Referral Lineage?</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                Are you sure you want to drop this referral affiliation node? Network commission calculations may be altered.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button 
                                onClick={() => setDeleteId(null)}
                                className="w-28 py-2.5 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="w-28 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-red-950/40 transition active:scale-95"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Referral;