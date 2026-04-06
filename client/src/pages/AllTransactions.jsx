import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const AllTransactions = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [menu, setMenu] = useState(null);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem("token");

  // ✅ FETCH ALL (TX + DIRECT + LEVEL)
  const fetchTransactions = async () => {
    try {
      const [txRes, directRes, levelRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/transactions-all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/direct-income`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/level-income`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ TRANSACTIONS
      const txData = (txRes.data || []).map((d, i) => ({
        id: `T-${d.id}-${i}`,
        from: `${d.from_user} (${d.from_id})`,
        to: `${d.to_user} (${d.to_id})`,
        type: d.type || "Transaction",
        amount: `$${Number(d.amount || 0).toFixed(2)}`,
        created: d.created_at,
      }));

      // ✅ DIRECT
      const directData = (directRes.data || []).map((d, i) => ({
        id: `D-${d.id}-${i}`,
        from: d.from_user || "-",
        to: d.to_user || "-",
        type: "Direct Income",
        amount: `$${Number(d.income || 0).toFixed(2)}`,
        created: d.created_at,
      }));

      // ✅ LEVEL
      const levelData = (levelRes.data || []).map((d, i) => ({
        id: `L-${d.id}-${i}`,
        from: `${d.from_name} ${d.from_lastname}`,
        to: `${d.name} ${d.lastname}`,
        type: `Level ${d.level}`,
        amount: `$${Number(d.income || 0).toFixed(2)}`,
        created: d.created_at,
      }));

      // ✅ MERGE + SORT
      const merged = [...txData, ...directData, ...levelData].sort(
        (a, b) => new Date(b.created) - new Date(a.created)
      );

      setData(merged);
    } catch (err) {
      console.error("Admin TX fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ SEARCH
  const filtered = useMemo(() => {
    return data.filter((d) =>
      d.from.toLowerCase().includes(search.toLowerCase()) ||
      d.to.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
  const paginated = filtered.slice((page - 1) * rows, page * rows);

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
          <h2>Transactions</h2>
          <p>All</p>
        </div>

        <input
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
        <h3 style={{ marginBottom: 15 }}>All Transactions</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM</th>
              <th>TO</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>CREATED</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="6">No data</td>
              </tr>
            ) : (
              paginated.map((d, i) => (
                <tr key={d.id}>
                  <td>{(page - 1) * rows + i + 1}</td>
                  <td>{d.from}</td>
                  <td>{d.to}</td>
                  <td><span className="type-badge">{d.type}</span></td>
                  <td>{d.amount}</td>
                  <td>{new Date(d.created).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">

        <div className="usrDeposit__rows">
          Rows
          <select
            value={rows}
            onChange={(e) => {
              setRows(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>

        <div>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            {"<"}
          </button>

          {getPagination().map((p, i) =>
            p === "..." ? (
              <span key={i} style={{ padding: "0 6px" }}>...</span>
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
            onClick={() => setPage(p => p + 1)}
          >
            {">"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AllTransactions;