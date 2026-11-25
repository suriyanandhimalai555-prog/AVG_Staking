import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    FaEllipsisV,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaWallet,
    FaCalendarAlt,
    FaFileExcel,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const Users = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [deleteUserId, setDeleteUserId] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [menuOpen, setMenuOpen] = useState(null);
    const [viewUser, setViewUser] = useState(null);
    const [editUser, setEditUser] = useState(null);

    const dropdownRef = useRef(null);

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

    const filteredUsers = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) return users;

        return users.filter((user) => {
            return (
                String(user.username || "").toLowerCase().includes(searchValue) ||
                String(user.email || "").toLowerCase().includes(searchValue) ||
                String(user.phone || "").toLowerCase().includes(searchValue) ||
                String(user.userCode || "").toLowerCase().includes(searchValue) ||
                String(user.referredByName || "").toLowerCase().includes(searchValue) ||
                String(user.referredByCode || "").toLowerCase().includes(searchValue)
            );
        });
    }, [users, search]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredUsers.slice(start, start + rowsPerPage);
    }, [filteredUsers, page, rowsPerPage]);

    const formatNumber = (val) => {
        const num = Number(val);
        return Number.isFinite(num) ? num.toFixed(2) : "0.00";
    };

    const handleDownloadExcel = () => {
        if (!filteredUsers.length) {
            alert("No user data available to export");
            return;
        }

        const excelData = filteredUsers.map((user, index) => ({
            "S.No": index + 1,
            "User Name": user.username || "-",
            "Code": user.userCode || "-",
            "Email": user.email || "-",
            "Phone Number": user.phone || "-",
            "Wallet Balance": Number(user.walletBalance || 0),
            "ROI": Number(user.roiIncome || 0),
            "Level Income": Number(user.levelIncome || 0),
            "Direct Income": Number(user.directIncome || 0),
            "Total Withdrawal": Number(user.totalWithdrawal || 0),
            "Total Deposit": Number(user.totalDeposit || 0),
            "Referred By Name": user.referredByName || "-",
            "Referred By Code": user.referredByCode || "-",
            "Which User Referred": user.referredBy || "-",
            "This User Referred Count": Number(user.referredCount || 0),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);

        const headers = Object.keys(excelData[0]);
        worksheet["!cols"] = headers.map((key) => {
            const maxLen = Math.max(
                key.length,
                ...excelData.map((row) => String(row[key] ?? "").length)
            );
            return { wch: Math.min(Math.max(maxLen + 4, 14), 42) };
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users Report");

        const dateStamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Users_Report_${dateStamp}.xlsx`);
    };

    const toggleStatus = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const user = users.find((u) => u.id === id);
            const newStatus = !user.status;

            await axios.put(
                `${import.meta.env.VITE_APP_BASE_URL}/api/users/${id}/status`,
                { status: newStatus },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
            );
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

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

        const formattedHours = String(hours).padStart(2, "0");
        return `${day}/${month}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_BASE_URL}/api/users`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const formatted = res.data.map((u) => {
                    const refName =
                        u.referred_by_name && u.referred_by_name !== "-"
                            ? u.referred_by_name
                            : "-";
                    const refCode =
                        u.referred_by_code && u.referred_by_code !== "-"
                            ? u.referred_by_code
                            : "-";
                    const referredByLabel =
                        refName !== "-" && refCode !== "-"
                            ? `${refName} (${refCode})`
                            : refName !== "-"
                            ? refName
                            : refCode !== "-"
                            ? refCode
                            : "-";

                    const walletBal = Number(u.wallet_balance ?? 0);
                    const totalWithdrawnVal = Number(
                        u.total_withdrawn ?? u.total_withdrawal ?? 0
                    );

                    return {
                        id: u.id,
                        username: u.name || "",
                        userCode: u.user_code || "",
                        email: u.email || "",
                        phone: u.phone || "",
                        walletBalance: walletBal,
                        roiIncome: Number(u.roi_income ?? 0),
                        levelIncome: Number(u.level_income ?? 0),
                        directIncome: Number(u.direct_income ?? 0),
                        totalWithdrawal: totalWithdrawnVal,
                        totalDeposit: Number(u.total_deposit ?? 0),
                        referredByName: refName,
                        referredByCode: refCode,
                        referredBy: referredByLabel,
                        referredCount: Number(u.referred_count ?? 0),
                        wallet: formatNumber(walletBal),
                        created: formatDateTime(u.created_at),
                        status: u.login_status ?? false,
                        active: u.has_active_plan ?? false,
                    };
                });

                setUsers(formatted);
            } catch (err) {
                console.error(err);
                alert("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleLoginAsUser = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${import.meta.env.VITE_APP_BASE_URL}/api/auth/login-as-user/${id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            localStorage.setItem("user_code", res.data.user_code);

            navigate(res.data.redirectTo || "/user-dashboard");
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Failed to login as user");
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditUser({ ...editUser, [name]: value });
    };

    const saveEdit = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${import.meta.env.VITE_APP_BASE_URL}/api/users/${editUser.id}`,
                {
                    name: editUser.username,
                    email: editUser.email,
                    phone: editUser.phone,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUsers(users.map((u) => (u.id === editUser.id ? editUser : u)));
            setEditUser(null);
        } catch (err) {
            alert("Failed to update user");
        }
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `${import.meta.env.VITE_APP_BASE_URL}/api/users/${deleteUserId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUsers(users.filter((u) => u.id !== deleteUserId));
            setDeleteUserId(null);
        } catch (err) {
            alert("Failed to delete user");
        }
    };

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

    return (
        <div className="min-h-screen bg-[#070b1e] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none rounded-2xl shadow-xl">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                            User Management
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Manage platform authorization profiles and records
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Search by Name, Email, Phone, Code or Referrer..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full sm:w-72 lg:w-80 bg-[#0d153a]/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition duration-200"
                        />

                        <button
                            type="button"
                            onClick={handleDownloadExcel}
                            disabled={loading || filteredUsers.length === 0}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
                        >
                            <FaFileExcel className="text-sm" />
                            <span>Export Excel</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-[#0d153a]/40 text-slate-300 font-semibold tracking-wider text-xs uppercase">
                                    <th className="py-4 px-5 w-16 text-center">S.No</th>
                                    <th className="py-4 px-6">Username</th>
                                    <th className="py-4 px-6">Email</th>
                                    <th className="py-4 px-5 text-center">Active</th>
                                    <th className="py-4 px-6">Phone</th>
                                    <th className="py-4 px-6">Wallet</th>
                                    <th className="py-4 px-5 text-center">Status</th>
                                    <th className="py-4 px-6">Created</th>
                                    <th className="py-4 px-6 text-center w-24">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Fetching profiles data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            No matching profiles records found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setViewUser(user)}
                                            className="hover:bg-white/[0.02] transition duration-150 group cursor-pointer"
                                        >
                                            <td className="py-4 px-5 text-center font-medium text-slate-400">
                                                {(page - 1) * rowsPerPage + index + 1}
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-white">
                                                <div className="flex flex-col">
                                                    <span className="group-hover:text-purple-400 transition-colors">
                                                        {user.username}
                                                    </span>
                                                    <span className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                                                        {user.userCode || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-300 max-w-[200px] truncate">
                                                {user.email}
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md ${
                                                        user.active
                                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    }`}
                                                >
                                                    {user.active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-300 font-medium">
                                                {user.phone}
                                            </td>
                                            <td className="py-4 px-6 text-emerald-400 font-semibold">
                                                {user.wallet}
                                            </td>
                                            <td
                                                className="py-4 px-5 text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <label className="relative inline-flex items-center cursor-pointer justify-center select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.status}
                                                        onChange={() => toggleStatus(user.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500 shadow-sm shadow-black/50"></div>
                                                </label>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-xs font-medium">
                                                {user.created}
                                            </td>

                                            <td
                                                className="py-4 px-6 text-center relative overflow-visible"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpen(menuOpen === user.id ? null : user.id);
                                                    }}
                                                    className="action-trigger p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition duration-150 focus:outline-none"
                                                >
                                                    <FaEllipsisV className="pointer-events-none" />
                                                </button>

                                                {menuOpen === user.id && (
                                                    <div
                                                        ref={dropdownRef}
                                                        className="absolute right-12 top-2 w-36 bg-[#0f1631] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5"
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setViewUser(user);
                                                                setMenuOpen(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-white/5 hover:text-white transition"
                                                        >
                                                            View Profile
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditUser(user);
                                                                setMenuOpen(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-white/5 hover:text-white transition"
                                                        >
                                                            Edit Info
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                setMenuOpen(null);
                                                                await handleLoginAsUser(user.id);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 transition"
                                                        >
                                                            Login System
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteUserId(user.id);
                                                                setMenuOpen(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                                                        >
                                                            Delete Record
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
                                    <span key={i} className="px-2 text-slate-500 text-sm tracking-wider">
                                        ...
                                    </span>
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

            {viewUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
                            <h3 className="text-base font-bold text-white tracking-wide">
                                User Account Profile
                            </h3>
                            <button
                                onClick={() => setViewUser(null)}
                                className="text-slate-400 hover:text-white transition text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaUser className="text-purple-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                        Username
                                    </span>
                                    <span className="text-sm font-semibold text-white mt-0.5">
                                        {viewUser.username}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono mt-0.5">
                                        Code: {viewUser.userCode || "N/A"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaEnvelope className="text-indigo-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                        Email Address
                                    </span>
                                    <span className="text-sm font-medium text-slate-200 mt-0.5">
                                        {viewUser.email}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaPhone className="text-emerald-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                        Phone Number
                                    </span>
                                    <span className="text-sm font-medium text-slate-200 mt-0.5">
                                        {viewUser.phone}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                    <FaWallet className="text-amber-400 text-sm flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                            Wallet Bal
                                        </span>
                                        <span className="text-sm font-bold text-emerald-400 mt-0.5">
                                            {formatNumber(viewUser.walletBalance)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full ${
                                            viewUser.active ? "bg-emerald-400" : "bg-amber-400"
                                        } flex-shrink-0`}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                            Plan Status
                                        </span>
                                        <span className="text-sm font-bold text-slate-200 mt-0.5">
                                            {viewUser.active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 border border-white/5 p-4 rounded-xl">
                                <div>
                                    <span className="text-slate-500 block">ROI Income</span>
                                    <span className="text-slate-200 font-semibold">
                                        {formatNumber(viewUser.roiIncome)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Level Income</span>
                                    <span className="text-slate-200 font-semibold">
                                        {formatNumber(viewUser.levelIncome)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Direct Income</span>
                                    <span className="text-slate-200 font-semibold">
                                        {formatNumber(viewUser.directIncome)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Total Deposit</span>
                                    <span className="text-slate-200 font-semibold">
                                        {formatNumber(viewUser.totalDeposit)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Total Withdrawal</span>
                                    <span className="text-slate-200 font-semibold">
                                        {formatNumber(viewUser.totalWithdrawal)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Referred Count</span>
                                    <span className="text-slate-200 font-semibold">
                                        {viewUser.referredCount}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500 block">Referred By</span>
                                    <span className="text-slate-200 font-semibold">
                                        {viewUser.referredBy}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <FaCalendarAlt className="text-slate-400 text-base flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                        Created System timestamp
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium mt-0.5">
                                        {viewUser.created}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setViewUser(null)}
                                className="px-5 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
                            <h3 className="text-base font-bold text-white tracking-wide">
                                Modify Member Account
                            </h3>
                            <button
                                onClick={() => setEditUser(null)}
                                className="text-slate-400 hover:text-white transition text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400">
                                    Username Profile Name
                                </label>
                                <input
                                    name="username"
                                    value={editUser.username}
                                    onChange={handleEditChange}
                                    className="w-full bg-[#0d153a]/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-purple-500 transition duration-200"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400">
                                    Email Address Contact
                                </label>
                                <input
                                    name="email"
                                    value={editUser.email}
                                    onChange={handleEditChange}
                                    className="w-full bg-[#0d153a]/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-purple-500 transition duration-200"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400">
                                    Mobile Phone Number
                                </label>
                                <input
                                    name="phone"
                                    value={editUser.phone}
                                    onChange={handleEditChange}
                                    className="w-full bg-[#0d153a]/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-purple-500 transition duration-200"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setEditUser(null)}
                                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md shadow-purple-950/40 transition active:scale-95"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteUserId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 text-center">
                        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            ⚠️
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="text-base font-bold text-white">
                                Permanently Delete Record?
                            </h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                Are you sure you want to drop this user profile from active data sets? This operation cannot be rolled back.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setDeleteUserId(null)}
                                className="w-28 py-2.5 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition active:scale-95"
                            >
                                Cancel Action
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

export default Users;