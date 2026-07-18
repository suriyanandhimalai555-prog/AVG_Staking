import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

const SupportTicket = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [ticketsData, setTicketsData] = useState([]);

    // ================= FETCH =================
    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API}/all-tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTicketsData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tickets");
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // ================= FILTER =================
    const filteredTickets = ticketsData.filter((t) =>
        (t.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.ticket_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.short_desc || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ================= PAGINATION =================
    const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentTickets = filteredTickets.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    // ================= UPDATE STATUS =================
    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API}/tickets/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Status updated");
            fetchTickets(); 
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    // Helper to determine status switch visual state
    const isTicketActive = (status) => {
        if (!status) return false;
        return status.toLowerCase() !== "resolved";
    };

    return (
        <div className="min-h-screen bg-[#070b19] p-6 text-slate-300 selection:bg-purple-500 selection:text-white rounded-2xl shadow-2xl">
            {/* Main Wrapper Panel */}
            <div className="max-w-7xl mx-auto bg-[#0f162a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
                
                {/* Header Section */}
                <div className="p-6 border-b border-slate-800 bg-[#131c36] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-2xl font-bold text-white tracking-wide">
                            <span>🎫</span>
                            <h2>Support Ticket Configuration</h2>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Configure user-submitted support tickets, monitor response timelines, and update resolution statuses.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by user, ID or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 bg-[#0a0f24] text-xs text-slate-200 pl-4 pr-10 py-2.5 rounded-md border border-slate-800 focus:outline-none focus:border-purple-500 placeholder-slate-500 transition-all"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-500 text-sm">🔍</span>
                        </div>
                        
                        {/* Primary Action Button */}
                        <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg shadow-purple-900/20 transition-all flex items-center gap-1.5">
                            <span className="text-sm font-bold">+</span> Add Ticket
                        </button>
                    </div>
                </div>

                {/* Content Sub-Header */}
                <div className="px-6 py-4 bg-[#111931] border-b border-slate-800">
                    <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase">
                        Active Support Queue
                    </h3>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-[11px] font-bold tracking-wider text-slate-400 uppercase bg-[#0d1429]">
                                <th className="py-4 px-6 w-16">S.No</th>
                                <th className="py-4 px-4">User</th>
                                <th className="py-4 px-4">Ticket ID</th>
                                <th className="py-4 px-4">Title / Topic</th>
                                <th className="py-4 px-4">Description</th>
                                <th className="py-4 px-4 text-center">Is Active</th>
                                <th className="py-4 px-4">Created At</th>
                                <th className="py-4 px-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/60 bg-[#0f162a]">
                            {currentTickets.length > 0 ? (
                                currentTickets.map((t, i) => (
                                    <tr key={t.id} className="hover:bg-[#151e38]/40 transition-colors group">
                                        {/* S.No */}
                                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                                            {String(startIndex + i + 1).padStart(2, '0')}
                                        </td>
                                        
                                        {/* Username */}
                                        <td className="py-4 px-4 text-xs font-semibold text-slate-200">
                                            {t.username || "N/A"}
                                        </td>
                                        
                                        {/* Ticket ID */}
                                        <td className="py-4 px-4 text-xs font-mono text-emerald-400 font-medium">
                                            #{t.ticket_id || "000000"}
                                        </td>
                                        
                                        {/* Title */}
                                        <td className="py-4 px-4 text-xs text-slate-300 font-medium max-w-[160px] truncate">
                                            {t.short_desc || "No Title"}
                                        </td>
                                        
                                        {/* Description */}
                                        <td className="py-4 px-4 text-xs text-slate-400 max-w-[240px] truncate">
                                            {t.short_desc || "No Description Provided"}
                                        </td>

                                        {/* Status Toggle Switch styled like image */}
                                        <td className="py-4 px-4 text-center">
                                            <label className="inline-flex items-center cursor-pointer relative group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isTicketActive(t.status)}
                                                    onChange={() => updateStatus(t.id, isTicketActive(t.status) ? "resolved" : "open")}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a855f7]"></div>
                                            </label>
                                        </td>

                                        {/* Date */}
                                        <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                                            {(() => {
                                                if (!t.created_at) return "Recent";
                                                const parsedDate = new Date(t.created_at);
                                                return !isNaN(parsedDate.getTime()) 
                                                    ? parsedDate.toISOString().replace('T', ' ').substring(0, 19) 
                                                    : "Recent";
                                            })()}
                                        </td>

                                        {/* Interactive Quick-Select Action */}
                                        <td className="py-4 px-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    value={t.status || "open"}
                                                    onChange={(e) => updateStatus(t.id, e.target.value)}
                                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-all cursor-pointer outline-none capitalize ${
                                                        t.status?.toLowerCase() === "resolved" 
                                                            ? "bg-slate-900 border-slate-700 text-slate-400"
                                                            : t.status?.toLowerCase() === "in progress"
                                                            ? "bg-amber-950/40 border-amber-800/60 text-amber-400"
                                                            : "bg-purple-950/40 border-purple-800/60 text-purple-400"
                                                    }`}
                                                >
                                                    <option value="open" className="bg-[#0f162a] text-slate-300">Open</option>
                                                    <option value="in progress" className="bg-[#0f162a] text-slate-300">In Progress</option>
                                                    <option value="resolved" className="bg-[#0f162a] text-slate-300">Resolved</option>
                                                </select>
                                                
                                                {/* More Options Trigger */}
                                                <button className="text-slate-500 hover:text-white p-1 rounded transition-colors">
                                                    ⋮
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-xs text-slate-500 tracking-wide bg-[#0f162a]">
                                        No support tickets matched your current layout criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 bg-[#0d1429] border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span>Rows:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="bg-[#0a0f24] text-slate-300 border border-slate-800 rounded px-2 py-1 focus:outline-none cursor-pointer"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                        </div>

                        <span className="font-mono text-slate-500">
                            {filteredTickets.length > 0 ? startIndex + 1 : 0} -{" "}
                            {Math.min(startIndex + rowsPerPage, filteredTickets.length)} of{" "}
                            {filteredTickets.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Prev Button */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded bg-[#151e38] text-slate-300 hover:bg-[#1e294b] disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium"
                        >
                            Prev
                        </button>

                        {/* Page Numbers */}
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1.5 rounded font-mono font-medium transition-colors ${
                                    currentPage === i + 1
                                        ? "bg-[#7c3aed] text-white"
                                        : "bg-[#151e38] text-slate-400 hover:bg-[#1e294b]"
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1.5 rounded bg-[#151e38] text-slate-300 hover:bg-[#1e294b] disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium"
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SupportTicket;