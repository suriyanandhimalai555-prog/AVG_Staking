import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = "http://localhost:5000/api/users";

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

    // ================= STATUS =================
    const getStatusClass = (status) => {
        if (!status) return "badge";

        switch (status.toLowerCase()) {
            case "open":
                return "badge pending";
            case "in progress":
                return "badge progress";
            case "resolved":
                return "badge resolved";
            default:
                return "badge";
        }
    };

    // ================= PRIORITY (SAFE FIX) =================
    const getPriorityClass = (priority) => {
        if (!priority) return "priority low"; // fallback

        switch (priority.toLowerCase()) {
            case "high":
                return "priority high";
            case "medium":
                return "priority medium";
            case "low":
                return "priority low";
            default:
                return "priority";
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(`${API}/tickets/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Status updated");

            fetchTickets(); // refresh

        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="ticket-container">
            <div className="ticket-card">

                <div className="ticket-header">
                    <h2>Support Tickets</h2>

                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* TABLE */}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>User</th>
                                <th>Ticket ID</th>
                                <th>Tittle</th>
                                <th>Description</th>
                                <th>Status</th>
                                {/* <th>Priority</th> */}
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentTickets.length > 0 ? (
                                currentTickets.map((t, i) => (
                                    <tr key={t.id}>
                                        <td>{startIndex + i + 1}</td>
                                        <td>{t.username}</td>
                                        <td className="ticket-id">{t.ticket_id}</td>
                                        <td className="short">{t.short_desc}</td>
                                        <td className="desc">{t.short_desc}</td>

                                        <td>
                                            <span className={getStatusClass(t.status)}>
                                                {t.status}
                                            </span>
                                        </td>

                                        {/* <td>
                                            <span className={getPriorityClass(t.priority)}>
                                                {t.priority || "Low"}
                                            </span>
                                        </td> */}

                                        <td>
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>

                                        <td>
                                            <select
                                                value={t.status || "open"}
                                                onChange={(e) => updateStatus(t.id, e.target.value)}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data">
                                        No tickets found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="pagination">
                    <div className="rows">
                        <span>Rows:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>

                        <span>
                            {startIndex + 1} -{" "}
                            {Math.min(startIndex + rowsPerPage, filteredTickets.length)} of{" "}
                            {filteredTickets.length}
                        </span>
                    </div>

                    <div className="pages">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={currentPage === i + 1 ? "active" : ""}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                            disabled={currentPage === totalPages || totalPages === 0}
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