import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

const SupportTicket = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10); // Matches your UI screenshot setting
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
        (t.short_desc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
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

    return (
        <div className="min-h-screen bg-[#070b19] p-6 text-slate-300 rounded-2xl">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-xl font-semibold text-white tracking-wide">Support Tickets</h2>
                    <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all">
                        Create Ticket
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm bg-[#0f162a]/60 text-slate-200 text-sm px-4 py-2.5 rounded-xl border border-slate-800/80 focus:outline-none focus:border-purple-500 placeholder-slate-600 transition-all"
                    />
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto bg-[#0f162a]/30 border border-slate-800/60 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-xs font-bold tracking-wider text-slate-400 uppercase bg-[#0d1429]/50">
                                <th className="py-4 px-6 w-20">S.No</th>
                                <th className="py-4 px-6">Ticket ID</th>
                                <th className="py-4 px-6">Short Description</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Created At</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/40 text-sm">
                            {currentTickets.length > 0 ? (
                                currentTickets.map((t, i) => (
                                    <tr key={t.id || i} className="hover:bg-[#151e38]/20 transition-colors">
                                        {/* S.No */}
                                        <td className="py-4 px-6 text-slate-300">
                                            {startIndex + i + 1}
                                        </td>
                                        
                                        {/* Ticket ID */}
                                        <td className="py-4 px-6 text-slate-300">
                                            {t.ticket_id || "N/A"}
                                        </td>
                                        
                                        {/* Short Description */}
                                        <td className="py-4 px-6 text-slate-300">
                                            {t.short_desc || t.description || "No Description"}
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6 text-slate-400 capitalize">
                                            {t.status || "Open"}
                                        </td>

                                        {/* Created At (GLITCH FIXED HERE) */}
                                        <td className="py-4 px-6 text-slate-300">
                                            {(() => {
                                                const rawDate = t.created_at || t.createdAt;
                                                // If database field is blank, null, or empty string, show "Recent"
                                                if (!rawDate) return "Recent";
                                                
                                                const parsedDate = new Date(rawDate);
                                                // If date is invalid or hits the 1970 unix epoch error, bypass it safely
                                                if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1970) {
                                                    return "Recent";
                                                }
                                                
                                                // Custom format matching your template standard: MM/DD/YYYY
                                                return `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}/${parsedDate.getFullYear()}`;
                                            })()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-sm text-slate-500 bg-[#0f162a]/20">
                                        No support tickets matched your current layout criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>Rows:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-[#0a0f24] text-slate-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors flex items-center"
                        >
                            &lt; Prev
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    currentPage === i + 1
                                        ? "bg-[#7c3aed] text-white"
                                        : "bg-[#151e38]/40 text-slate-400 hover:bg-[#1e294b]"
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors flex items-center"
                        >
                            Next &gt;
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SupportTicket;