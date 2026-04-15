import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const Referral = () => {
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [menuOpen, setMenuOpen] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [loading, setLoading] = useState(true);

const formatDateTime = (value) => {
  if (!value) return "-";

  // 🔥 DO NOT use new Date() directly
  const raw = String(value);

  // Expected format: "YYYY-MM-DD HH:mm:ss"
  const [datePart, timePart] = raw.split(" ");

  if (!datePart || !timePart) return raw;

  const [year, month, day] = datePart.split("-");
  let [hour, minute, second] = timePart.split(":");

  hour = Number(hour);

  const ampm = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;

  return `${day}/${month}/${year}, ${hour}:${minute}:${second} ${ampm}`;
};

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/referrals`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((r) => ({
          id: r.id,
          referrer:
            `${r.referrer_name || ""} ${r.referrer_lastname || ""}`.trim() ||
            "N/A",
          referred:
            `${r.referred_name || ""} ${r.referred_lastname || ""}`.trim() ||
            "N/A",
          referrerCode: r.referrer_code || "-",
          referredCode: r.referred_code || "-",
          referrerPhone: r.referrer_phone || "-",
          referredPhone: r.referred_phone || "-",
          level: r.level ? `Level ${r.level}` : "Level 1",
          created: formatDateTime(r.created_at),
        }));

        setReferrals(formatted);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch referrals");
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return referrals.filter((r) => {
      return (
        r.referrer.toLowerCase().includes(q) ||
        r.referred.toLowerCase().includes(q) ||
        r.referrerCode.toLowerCase().includes(q) ||
        r.referredCode.toLowerCase().includes(q) ||
        r.referrerPhone.toLowerCase().includes(q) ||
        r.referredPhone.toLowerCase().includes(q) ||
        r.level.toLowerCase().includes(q)
      );
    });
  }, [search, referrals]);

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

  const confirmDelete = () => {
    setReferrals(referrals.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  };

  if (loading) return <div>Loading referrals...</div>;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Referral Management</h2>
          <p>All referral records</p>
        </div>

        <input
          type="text"
          placeholder="Search by name, code, phone, level..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: "15px" }}>All Referrals</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>REFERRER</th>
              <th>REFERRED</th>
              <th>REFERRER PHONE</th>
              <th>REFERRED PHONE</th>
              <th>LEVEL</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length > 0 ? (
              paginated.map((r, index) => (
                <tr key={r.id}>
                  <td>{(page - 1) * rowsPerPage + index + 1}</td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{r.referrer}</span>
                      <small style={{ color: "#aaa" }}>{r.referrerCode}</small>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{r.referred}</span>
                      <small style={{ color: "#aaa" }}>{r.referredCode}</small>
                    </div>
                  </td>

                  <td>{r.referrerPhone}</td>
                  <td>{r.referredPhone}</td>
                  <td>
                    <span className="level-badge">{r.level}</span>
                  </td>
                  <td>{r.created}</td>

                  <td className="action-cell">
                    <FaEllipsisV
                      onClick={() =>
                        setMenuOpen(menuOpen === r.id ? null : r.id)
                      }
                    />

                    {menuOpen === r.id && (
                      <div className="action-dropdown">
                        <div
                          onClick={() => {
                            setViewData(r);
                            setMenuOpen(null);
                          }}
                        >
                          View
                        </div>

                        <div
                          className="delete"
                          onClick={() => {
                            setDeleteId(r.id);
                            setMenuOpen(null);
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
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                  No referrals found
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
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
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
              <h3>Referral Details</h3>
              <button className="modal-close" onClick={() => setViewData(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-row">
                <label>Referrer</label>
                <span>{viewData.referrer}</span>
              </div>

              <div className="modal-row">
                <label>Referred</label>
                <span>{viewData.referred}</span>
              </div>

              <div className="modal-row">
                <label>Referrer Phone</label>
                <span>{viewData.referrerPhone}</span>
              </div>

              <div className="modal-row">
                <label>Referred Phone</label>
                <span>{viewData.referredPhone}</span>
              </div>

              <div className="modal-row">
                <label>Level</label>
                <span>{viewData.level}</span>
              </div>

              <div className="modal-row">
                <label>Created At</label>
                <span>{viewData.created}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Referral</h3>
            <p>Are you sure you want to delete this referral?</p>

            <div className="delete-buttons">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </button>

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

export default Referral;