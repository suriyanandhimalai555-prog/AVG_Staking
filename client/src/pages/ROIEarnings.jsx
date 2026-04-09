import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

const ROIEarnings = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH DATA
  const fetchROI = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/roi-all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        fromUser: `${item.from_user} (${item.from_id})`,
        toUser: `${item.to_user} (${item.to_id})`,
        type: "Daily ROI Income",
        amount: `$${Number(item.amount).toFixed(2)}`,
        createdAt: item.created_at,
      }));

      setData(formatted);
    } catch (err) {
      console.error("Admin ROI fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchROI();
  }, []);

  // ✅ SEARCH
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) =>
      r.fromUser.toLowerCase().includes(q) ||
      r.toUser.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.amount.toLowerCase().includes(q)
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const pageItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // ✅ SMART PAGINATION
  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;

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
      {/* HEADER */}
      <div className="users-header">
        <div>
          <h2>Earnings</h2>
          <p>ROI Income</p>
        </div>

        <input
          className="tx-search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="table-card">
        <h3 style={{ marginBottom: 15 }}>All ROI Income</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TO USER</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading...</td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan="6">No records found</td>
              </tr>
            ) : (
              pageItems.map((row, i) => (
                <tr key={row.id}>
                  <td>{(page - 1) * rowsPerPage + i + 1}</td>
                  <td>{row.fromUser}</td>
                  <td>{row.toUser}</td>

                  <td>
                    <span className="type-badge type-roi">
                      {row.type}
                    </span>
                  </td>

                  <td>{row.amount}</td>

                  <td>{formatDateTime(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
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

        <div className="pagination-controls">
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
    </div>
  );
};

export default ROIEarnings;