import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const DepositTransactions = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [menu, setMenu] = useState(null);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [showManualDeposit, setShowManualDeposit] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);

  const dropdownRef = useRef(null);

const formatDateTime = (value) => {
  if (!value) return "-";

  // 🔥 FIX: force it as LOCAL time (NOT UTC)
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

  const fetchDropdownData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const [usersRes, plansRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/dropdown/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/dropdown/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      console.error("Dropdown fetch error:", err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || "N/A",
        hash: item.hash || `0x${Math.random().toString(36).substring(2, 10)}`,
        plan: item.plan_name || "N/A",
        amount: `$${item.amount ?? 0}`,
        created: formatDateTime(item.created_at),
      }));

      setData(formatted);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchDropdownData();
  }, [fetchTransactions, fetchDropdownData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(
      (d) =>
        d.user.toLowerCase().includes(q) ||
        d.hash.toLowerCase().includes(q) ||
        d.plan.toLowerCase().includes(q)
    );
  }, [search, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));

  const paginated = useMemo(() => {
    const start = (page - 1) * rows;
    return filtered.slice(start, start + rows);
  }, [filtered, page, rows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, rows]);

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

  const createDeposit = () => {
    if (!selectedUser || !selectedPlan || !depositAmount) {
      alert("Please fill all fields");
      return;
    }

    const newDeposit = {
      id: Date.now(),
      user: selectedUser,
      hash: `0x${Math.random().toString(36).substring(2, 10)}`,
      plan: selectedPlan,
      amount: `$${depositAmount}`,
      created: formatDateTime(new Date()),
    };

    setData((prev) => [newDeposit, ...prev]);
    setShowManualDeposit(false);
    setSelectedUser("");
    setSelectedPlan("");
    setDepositAmount("");
  };

  const confirmDelete = () => {
    setData((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = () => {
    setData((prev) => prev.map((d) => (d.id === editData.id ? editData : d)));
    setEditData(null);
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Transactions</h2>
          <p>Deposit Management</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="tx-manual-deposit-btn"
            onClick={() => setShowManualDeposit(true)}
          >
            + Manual Deposit
          </button>

          <input
            type="text"
            placeholder="Search by user, hash, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: "15px" }}>Deposit List</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TRANSACTION HASH</th>
              <th>PLAN NAME</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length > 0 ? (
              paginated.map((d, i) => (
                <tr key={d.id}>
                  <td>{(page - 1) * rows + i + 1}</td>
                  <td>{d.user}</td>
                  <td>{d.hash}</td>
                  <td>{d.plan}</td>
                  <td>{d.amount}</td>
                  <td>{d.created}</td>

                  <td className="action-cell" style={{ position: "relative" }}>
                    <FaEllipsisV
                      style={{ cursor: "pointer" }}
                      onClick={() => setMenu(menu === d.id ? null : d.id)}
                    />

                    {menu === d.id && (
                      <div ref={dropdownRef} className="action-dropdown">
                        <div
                          onClick={() => {
                            setViewData(d);
                            setMenu(null);
                          }}
                        >
                          View
                        </div>

                        <div
                          onClick={() => {
                            setEditData(d);
                            setMenu(null);
                          }}
                        >
                          Edit
                        </div>

                        <div
                          className="delete"
                          onClick={() => {
                            setDeleteId(d.id);
                            setMenu(null);
                          }}
                        >
                          Delete
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="usrDeposit__rows">
          Rows per page
          <select
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
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
              <span key={i} className="dots">
                ...
              </span>
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {">"}
          </button>
        </div>
      </div>

      {viewData && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Transaction Details</h3>
              <button onClick={() => setViewData(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p><b>User:</b> {viewData.user}</p>
              <p><b>Hash:</b> {viewData.hash}</p>
              <p><b>Plan:</b> {viewData.plan}</p>
              <p><b>Amount:</b> {viewData.amount}</p>
              <p><b>Created:</b> {viewData.created}</p>
            </div>
          </div>
        </div>
      )}

      {editData && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Edit Transaction</h3>
              <button onClick={() => setEditData(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>User</label>
                <input
                  name="user"
                  value={editData.user}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Plan Name</label>
                <input
                  name="plan"
                  value={editData.plan}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  name="amount"
                  value={editData.amount}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={saveEdit}>Save</button>
              <button onClick={() => setEditData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Transaction</h3>
            <p>Are you sure you want to delete this transaction?</p>

            <div className="delete-buttons">
              <button onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualDeposit && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Manual Deposit</h3>
              <button onClick={() => setShowManualDeposit(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={`${u.name} ${u.user_code}`}>
                      {u.name} {u.user_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="">Select Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  placeholder="Enter Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={createDeposit}>Create Deposit</button>
              <button onClick={() => setShowManualDeposit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositTransactions;