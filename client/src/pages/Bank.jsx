import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaEllipsisV, FaSearch, FaUniversity, FaUser, FaCreditCard, FaCheckCircle, FaTimesCircle, FaTrashAlt } from "react-icons/fa";
import axios from "axios";

const Bank = () => {
    const [banks, setBanks] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [menuOpen, setMenuOpen] = useState(null);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(true);

    // Fetch and sync structure values from API
    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/banks`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const formatted = res.data
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((b) => ({
                        id: b.id,
                        username: b.username || "-",
                        bank: b.bank_name || "-",
                        account: b.account_number || "-",
                        ifsc: b.ifsc_code || "-",
                        gpay: b.gpay_number || "-",
                        status: b.status || "Pending",
                        created: b.created_at ? new Date(b.created_at).toLocaleString() : "-",
                    }));

                setBanks(formatted);
            } catch (err) {
                console.error(err);
                alert("Failed to fetch banks");
            } finally {
                setLoading(false);
            }
        };

        fetchBanks();
    }, []);

    // Global listener ensures menu interactions stay active and close safely on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                if (!e.target.closest(".action-trigger")) {
                    setMenuOpen(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return banks.filter((b) => {
            return (
                b.username.toLowerCase().includes(q) ||
                b.bank.toLowerCase().includes(q) ||
                b.account.toLowerCase().includes(q) ||
                b.ifsc.toLowerCase().includes(q) ||
                b.gpay.toLowerCase().includes(q) ||
                b.status.toLowerCase().includes(q)
            );
        });
    }, [search, banks]);

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

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${import.meta.env.VITE_APP_BASE_URL}/api/users/banks/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setBanks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, status } : b))
            );
            setMenuOpen(null);
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    const deleteBank = async (id) => {
        if (!window.confirm("Delete this bank configuration permanently?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/users/banks/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBanks((prev) => prev.filter((b) => b.id !== id));
            setMenuOpen(null);
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Approved":
                return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            case "Rejected":
                return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
            default:
                return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        }
    };

    return (
        <div className="min-h-screen bg-[#070b1e] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none rounded-2xl shadow-2xl">
            {/* Ambient Graphic Backdrop Filters */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
                
                {/* Dashboard Control Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Bank Configuration</h2>
                        <p className="text-xs text-slate-400 mt-1">Review, authorize and clear settlement bank account attachments</p>
                    </div>

                    <div className="relative w-full sm:w-72 lg:w-96">
                        {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <FaSearch className="text-sm" />
                        </span> */}
                        <input
                            type="text"
                            placeholder="Search by user, bank, account, status..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#0d153a]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition duration-200"
                        />
                    </div>
                </div>

                {/* Secure Data Table Sheet */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-[#0d153a]/40 text-slate-300 font-semibold tracking-wider text-xs uppercase">
                                    <th className="py-4 px-5 w-16 text-center">S.No</th>
                                    <th className="py-4 px-6">Username</th>
                                    <th className="py-4 px-6">Bank Name</th>
                                    <th className="py-4 px-6">Account Number</th>
                                    <th className="py-4 px-6">IFSC Code</th>
                                    <th className="py-4 px-6">GPay Linked</th>
                                    <th className="py-4 px-5 text-center w-32">Status</th>
                                    <th className="py-4 px-6">Created On</th>
                                    <th className="py-4 px-6 text-center w-24">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Fetching bank listings data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            No configuration settlement data rows matched.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((b, index) => (
                                        <tr key={b.id} className="hover:bg-white/[0.02] transition duration-150 group">
                                            <td className="py-4 px-5 text-center font-medium text-slate-400">
                                                {(page - 1) * rowsPerPage + index + 1}
                                            </td>

                                            {/* Username column context */}
                                            <td className="py-4 px-6 font-bold text-white group-hover:text-purple-400 transition-colors">
                                                {b.username}
                                            </td>

                                            {/* Bank Identity details */}
                                            <td className="py-4 px-6 text-slate-200 font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <FaUniversity className="text-slate-500 text-xs" />
                                                    <span>{b.bank}</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 text-slate-300 font-mono tracking-wide">{b.account}</td>
                                            <td className="py-4 px-6 text-slate-300 font-mono text-xs uppercase">{b.ifsc}</td>
                                            <td className="py-4 px-6 text-slate-400 font-medium">{b.gpay}</td>
                                            
                                            {/* Micro Custom Status Glass Badging */}
                                            <td className="py-4 px-5 text-center">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${getStatusClass(b.status)}`}>
                                                    {b.status}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-slate-400 text-xs font-medium">{b.created}</td>

                                            {/* Dropping Action context Menu */}
                                            <td className="py-4 px-6 text-center relative overflow-visible">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpen(menuOpen === b.id ? null : b.id);
                                                    }}
                                                    className="action-trigger p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition duration-150 focus:outline-none"
                                                >
                                                    <FaEllipsisV className="pointer-events-none" />
                                                </button>

                                                {menuOpen === b.id && (
                                                    <div 
                                                        ref={dropdownRef}
                                                        className="absolute right-12 top-2 w-36 bg-[#0f1631] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5"
                                                    >
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); updateStatus(b.id, "Approved"); }}
                                                            className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition"
                                                        >
                                                            <FaCheckCircle className="text-[10px]" /> Approve Account
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); updateStatus(b.id, "Rejected"); }}
                                                            className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition"
                                                        >
                                                            <FaTimesCircle className="text-[10px]" /> Reject Account
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); deleteBank(b.id); }}
                                                            className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                                                        >
                                                            <FaTrashAlt className="text-[10px]" /> Drop Record
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

                    {/* Integrated Sheet Pagination Footer */}
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
        </div>
    );
};

export default Bank;