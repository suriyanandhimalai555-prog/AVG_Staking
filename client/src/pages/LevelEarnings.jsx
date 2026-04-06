import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";

const LevelEarnings = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewItem, setViewItem] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/users/admin/level-income",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        fromUser: `${item.from_name || ""} ${item.from_lastname || ""} (${item.from_code || "-"})`,
        toUser: `${item.name || ""} ${item.lastname || ""} (${item.user_code || "-"})`,
        type: `Level ${item.level} Income`,
        amount: `$${Number(item.income || 0).toFixed(2)}`,
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleString()
          : "-",
      }));

      setData(formatted);
    } catch (err) {
      console.error("Fetch level income error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= SEARCH ================= */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;

    return data.filter((r) =>
      r.fromUser.toLowerCase().includes(q) ||
      r.toUser.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.amount.toLowerCase().includes(q) ||
      r.createdAt.toLowerCase().includes(q)
    );
  }, [search, data]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const pageItems = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filtered.slice(startIndex, startIndex + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
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

  const startIndex = (page - 1) * rowsPerPage;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Earnings</h2>
          <p>Level Income</p>
        </div>

        <input
          className="tx-search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: 15 }}>Level Income</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TO USER</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Loading...
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No records found
                </td>
              </tr>
            ) : (
              pageItems.map((row, i) => (
                <tr key={row.id}>
                  <td>{startIndex + i + 1}</td>
                  <td>{row.fromUser}</td>
                  <td>{row.toUser}</td>
                  <td>
                    <span className="type-badge type-level">{row.type}</span>
                  </td>
                  <td>{row.amount}</td>
                  <td>{row.createdAt}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => setViewItem(row)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ SAME PAGINATION UI */}
      <div className="pagination">
        <div className="usrDeposit__rows">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
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

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Level Income Details</h3>
              <button onClick={() => setViewItem(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p><b>From:</b> {viewItem.fromUser}</p>
              <p><b>To:</b> {viewItem.toUser}</p>
              <p><b>Type:</b> {viewItem.type}</p>
              <p><b>Amount:</b> {viewItem.amount}</p>
              <p><b>Created:</b> {viewItem.createdAt}</p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelEarnings;