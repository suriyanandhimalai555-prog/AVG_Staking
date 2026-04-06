import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const Bank = () => {
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [menuOpen, setMenuOpen] = useState(null);
  const dropdownRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/banks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((b) => ({
          id: b.id,
          username: b.username || "-",
          bank: b.bank_name || "-",
          account: b.account_number || "-",
          ifsc: b.ifsc_code || "-",
          gpay: b.gpay_number || "-",
          status: b.status || "Pending",
          created: b.created_at ? new Date(b.created_at).toLocaleString() : "-",
        }));

        setBanks(formatted);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch banks");
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return banks.filter((b) => {
      return (
        b.username.toLowerCase().includes(q) ||
        b.bank.toLowerCase().includes(q) ||
        b.account.toLowerCase().includes(q) ||
        b.ifsc.toLowerCase().includes(q) ||
        b.gpay.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
      );
    });
  }, [search, banks]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
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

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/users/banks/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBanks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );

      setMenuOpen(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const deleteBank = async (id) => {
    if (!window.confirm("Delete this bank?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/users/banks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBanks((prev) => prev.filter((b) => b.id !== id));
      setMenuOpen(null);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "badge-approved";
      case "Rejected":
        return "badge-rejected";
      default:
        return "badge-pending";
    }
  };

  if (loading) return <div>Loading banks...</div>;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>User Management</h2>
          <p>Bank Management</p>
        </div>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3>Bank Configuration</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USERNAME</th>
              <th>BANK</th>
              <th>ACCOUNT</th>
              <th>IFSC Code</th>
              <th>Gpay</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length > 0 ? (
              paginated.map((b, index) => (
                <tr key={b.id}>
                  <td>{(page - 1) * rowsPerPage + index + 1}</td>
                  <td>{b.username}</td>
                  <td>{b.bank}</td>
                  <td>{b.account}</td>
                  <td>{b.ifsc}</td>
                  <td>{b.gpay}</td>
                  <td>
                    <span className={getStatusClass(b.status)}>{b.status}</span>
                  </td>
                  <td>{b.created}</td>
                  <td style={{ position: "relative" }}>
                    <FaEllipsisV
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setMenuOpen(menuOpen === b.id ? null : b.id)
                      }
                    />

                    {menuOpen === b.id && (
                      <div
                        ref={dropdownRef}
                        className="action-dropdown"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 25,
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 6,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          zIndex: 10,
                        }}
                      >
                        <div onClick={() => updateStatus(b.id, "Approved")}>
                          ✅ Approve
                        </div>

                        <div onClick={() => updateStatus(b.id, "Rejected")}>
                          ❌ Reject
                        </div>

                        <div
                          className="delete"
                          onClick={() => deleteBank(b.id)}
                          style={{ color: "red" }}
                        >
                          🗑 Delete
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No banks found
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
    </div>
  );
};

export default Bank;