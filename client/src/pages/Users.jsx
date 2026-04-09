import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

    const filteredUsers = useMemo(() => {
    const searchValue = search.toLowerCase();

    return users.filter((u) => {
        const username = u.username?.toLowerCase() || "";
        const email = u.email?.toLowerCase() || "";
        const phone = u.phone || "";
        const userCode = u.userCode?.toLowerCase() || ""; // ✅ ADD

        return (
            username.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(search) ||
            userCode.includes(searchValue)   // ✅ ADD THIS LINE
        );
    });
}, [search, users]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredUsers.slice(start, start + rowsPerPage);
    }, [filteredUsers, page, rowsPerPage]);

    const toggleStatus = async (id) => {
        try {
            const token = localStorage.getItem("token");

            const user = users.find(u => u.id === id);
            const newStatus = !user.status;

            await axios.put(
                `${import.meta.env.VITE_APP_BASE_URL}/api/users/${id}/status`,
                { status: newStatus },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setUsers(prev =>
                prev.map((u) =>
                    u.id === id ? { ...u, status: newStatus } : u
                )
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

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
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

                const formatted = res.data.map((u) => ({
                    id: u.id,
                    username: u.name,
                    userCode: u.user_code,
                    email: u.email,
                    active: true,
                    phone: u.phone || "-",
                    wallet: "-",
                    created: formatDateTime(u.created_at),
                    status: u.status ?? false,
                }));

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

    const deleteUser = (id) => {
        if (window.confirm("Delete this user?")) {
            setUsers(users.filter((u) => u.id !== id));
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
                    phone: editUser.phone
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setUsers(users.map((u) =>
                u.id === editUser.id ? editUser : u
            ));

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
                    headers: { Authorization: `Bearer ${token}` }
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
        <div className="users-page">
            <div className="users-header">
                <h2>User Management</h2>

                <input
                    type="text"
                    placeholder="Search username, email, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="table-card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>USERNAME</th>
                            <th>EMAIL</th>
                            <th>ACTIVE</th>
                            <th>PHONE</th>
                            <th>WALLET</th>
                            <th>STATUS</th>
                            <th>CREATED</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedUsers.map((user, index) => (
                            <tr key={user.id}>
                                <td>{(page - 1) * rowsPerPage + index + 1}</td>
                                <td>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span>{user.username}</span>
                                        <small style={{ color: "#aaa" }}>{user.userCode}</small>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={user.status ? "badge-active" : "badge-inactive"}>
                                        {user.status ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td>{user.phone}</td>
                                <td>{user.wallet}</td>
                                <td>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={user.status}
                                            onChange={() => toggleStatus(user.id)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </td>
                                <td>{user.created}</td>
                                <td className="action-cell">
                                    <FaEllipsisV
                                        onClick={() =>
                                            setMenuOpen(menuOpen === user.id ? null : user.id)
                                        }
                                    />

                                    {menuOpen === user.id && (
                                        <div className="action-dropdown">
                                            <div onClick={() => {
                                                setViewUser(user);
                                                setMenuOpen(null);
                                            }}>
                                                View
                                            </div>

                                            <div onClick={() => {
                                                setEditUser(user);
                                                setMenuOpen(null);
                                            }}>
                                                Edit
                                            </div>

                                            <div
                                                onClick={async () => {
                                                    setMenuOpen(null);
                                                    await handleLoginAsUser(user.id);
                                                }}
                                            >
                                                Login
                                            </div>

                                            <div
                                                className="delete"
                                                onClick={() => {
                                                    setDeleteUserId(user.id);
                                                    setMenuOpen(null);
                                                }}
                                            >
                                                Delete
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <div className="usrDeposit__rows">
                    Rows per page
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        {"<"}
                    </button>

                    {getPagination().map((p, i) =>
                        p === "..." ? (
                            <span key={i} className="dots">...</span>
                        ) : (
                            <button
                                key={i}
                                className={page === p ? "active" : ""}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        disabled={page === totalPages}
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                    >
                        {">"}
                    </button>
                </div>
            </div>

            {viewUser && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>User Details</h3>
                            <button
                                className="modal-close"
                                onClick={() => setViewUser(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-row">
                                <label>Username</label>
                                <span>{viewUser.username}</span>
                            </div>

                            <div className="modal-row">
                                <label>Email</label>
                                <span>{viewUser.email}</span>
                            </div>

                            <div className="modal-row">
                                <label>Phone</label>
                                <span>{viewUser.phone}</span>
                            </div>

                            <div className="modal-row">
                                <label>Active</label>
                                <span>{viewUser.active ? "Active" : "Inactive"}</span>
                            </div>

                            <div className="modal-row">
                                <label>Wallet</label>
                                <span>{viewUser.wallet}</span>
                            </div>

                            <div className="modal-row">
                                <label>Status</label>
                                <span>{viewUser.status}</span>
                            </div>

                            <div className="modal-row">
                                <label>Created At</label>
                                <span>{viewUser.created}</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setViewUser(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editUser && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Edit User</h3>
                            <button
                                className="modal-close"
                                onClick={() => setEditUser(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    name="username"
                                    value={editUser.username}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    name="email"
                                    value={editUser.email}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    name="phone"
                                    value={editUser.phone}
                                    onChange={handleEditChange}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-primary"
                                onClick={saveEdit}
                            >
                                Save Changes
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={() => setEditUser(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteUserId && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete User</h3>

                        <p>
                            Are you sure you want to delete this user?
                        </p>

                        <div className="delete-buttons">
                            <button
                                className="btn-secondary"
                                onClick={() => setDeleteUserId(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn-danger"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;