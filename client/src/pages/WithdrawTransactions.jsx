import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const WithdrawTransactions = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [menu, setMenu] = useState(null);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const dropdownRef = useRef(null);
  const token = localStorage.getItem("token");
  const EXCHANGE_RATE = 95;

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

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formatted = (res.data || []).map((d) => {
        const amount = Number(d.amount || 0);
        const fee = amount * 0.1;
        const approvedUsd = Number(d.approved_amount ?? amount - fee);
        const approvedInr = Number(
          d.approved_amount ? d.approved_amount : approvedUsd * EXCHANGE_RATE
        );

        return {
          id: d.id,
          user: `${d.name || ""} ${d.lastname || ""} (${d.user_code || "-"})`.trim(),
          wallet: d.wallet_type || "-",
          amount,
          amountDisplay: `$${amount.toFixed(2)}`,
          fee: fee.toFixed(2),
          approvedUsd: approvedUsd.toFixed(2),
          approvedInr: approvedInr.toFixed(2),
          transactionId: d.transaction_id || "",
          currency: d.currency_type || "USD",
          proof: d.proof || d.transaction_proof || d.tx_proof || "-",
          status: d.status || "PENDING",
          created: formatDateTime(d.created_at),
        };
      });

      setData(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    return data.filter((d) => {
      return (
        d.user.toLowerCase().includes(q) ||
        d.wallet.toLowerCase().includes(q) ||
        d.amountDisplay.toLowerCase().includes(q) ||
        d.transactionId.toLowerCase().includes(q) ||
        d.proof.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
      );
    });
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

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${deleteId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDeleteId(null);
      setMenu(null);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${editData.id}/status`,
        {
          status: editData.status,
          transactionId: editData.transactionId || null,
          approvedAmount: Number(editData.approvedInr || 0),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditData(null);
      fetchData();
    } catch (err) {
      console.error("Save edit error:", err);
    }
  };

  const approve = async (d) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${d.id}/status`,
        {
          status: "APPROVED",
          transactionId: d.transactionId || null,
          approvedAmount: Number(d.approvedInr || 0),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMenu(null);
      fetchData();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const reject = async (id) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/${id}/status`,
        { status: "REJECTED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMenu(null);
      fetchData();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Transactions</h2>
          <p>Withdraw Management</p>
        </div>

        <input
          placeholder="Search by user, wallet type, proof, txn id, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: "15px" }}>Withdraw List</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USER</th>
              <th>WALLET TYPE</th>
              <th>REQUEST AMOUNT</th>
              {/* <th>TXN ID</th> */}
              <th>TRANSACTION PROOF</th>
              <th>STATUS</th>
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
                  <td>{d.wallet}</td>
                  <td>{d.amountDisplay}</td>
                  {/* <td></td> */}
                  <td>
  {[d.proof !== "-" ? d.proof : null,
    d.transactionId !== "-" ? d.transactionId : null]
    .filter(Boolean)
    .join(" | ") || "-"}
</td>
                  <td>
                    <span className={`status-badge ${String(d.status).toLowerCase()}`}>
                      {d.status}
                    </span>
                  </td>
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

                        <div onClick={() => approve(d)}>Approve</div>
                        <div onClick={() => reject(d.id)}>Reject</div>

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
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No withdrawals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="usrDeposit__rows">
          Rows per page
          <select value={rows} onChange={(e) => setRows(Number(e.target.value))}>
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

      {editData && (
        <div className="wd-modal-overlay">
          <div className="wd-modal">
            <div className="wd-header">
              <h2>Edit Withdraw</h2>
              <button onClick={() => setEditData(null)}>✕</button>
            </div>

            <div className="wd-body">
              <div className="wd-box">
                <h4>To Details</h4>

                <div className="wd-row">
                  <span>User</span>
                  <b>{editData.user || "-"}</b>
                </div>

                <div className="wd-row">
                  <span>Wallet</span>
                  <b>{editData.wallet || "-"}</b>
                </div>
              </div>

              <div className="wd-box wd-full">
                <h4>Transaction Details</h4>

                <div className="wd-grid">
                  <div>
                    <span>Currency</span>
                    <b>{editData.currency}</b>
                  </div>

                  <div>
                    <span>Request</span>
                    <b>${Number(editData.amount || 0).toFixed(2)}</b>
                  </div>

                  <div>
                    <span>Fee (10%)</span>
                    <b>${Number(editData.fee || 0).toFixed(2)}</b>
                  </div>

                  <div>
                    <span>Approved Amount (₹)</span>
                    <input
                      type="number"
                      name="approvedInr"
                      value={editData.approvedInr || ""}
                      onChange={handleEditChange}
                      step="0.01"
                    />
                  </div>

                  <div>
                    <span>Transaction ID</span>
                    <input
                      type="text"
                      name="transactionId"
                      value={editData.transactionId || ""}
                      onChange={handleEditChange}
                      placeholder="Enter transaction ID"
                    />
                  </div>

                  <div>
                    <span>Status</span>
                    <input
                      type="text"
                      name="status"
                      value={editData.status || ""}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div>
                    <span>Created</span>
                    <b>{editData.created}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={saveEdit}>Save</button>
              <button onClick={() => setEditData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {viewData && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Withdraw Details</h3>
              <button onClick={() => setViewData(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p><b>User:</b> {viewData.user}</p>
              <p><b>Wallet:</b> {viewData.wallet}</p>
              <p><b>Amount:</b> {viewData.amountDisplay}</p>
              <p><b>Txn ID:</b> {viewData.transactionId || "-"}</p>
              <p><b>Proof:</b> {viewData.proof}</p>
              <p><b>Status:</b> {viewData.status}</p>
              <p><b>Created:</b> {viewData.created}</p>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Withdraw</h3>
            <p>Are you sure you want to delete this request?</p>

            <div className="delete-buttons">
              <button onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawTransactions;