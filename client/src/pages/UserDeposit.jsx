import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserDeposit = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const [data, setData] = useState([]);

  // ✅ PAGINATION
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // ✅ FETCH DATA
  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/deposits`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        from: item.from_user || "User",
        fromId: item.from_id || "-",
        to: "Admin",
        toId: "SYSTEM",
        hash: item.hash || "N/A",
        plan: item.plan_name,
        amount: `$${item.amount}`,
        date: item.created_at
      }));

      setData(formatted);
    } catch (err) {
      console.error("Deposit fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // ✅ FILTER
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return data.filter(item =>
      item.from.toLowerCase().includes(q) ||
      item.plan.toLowerCase().includes(q) ||
      item.hash.toLowerCase().includes(q)
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

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
    <div className="usrDeposit__layoutWrapper">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="main">
        <Topbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className="usrDeposit__contentArea">

          {/* HEADER */}
          <div className="usrFirstContent">
            <h2 className="usrDeposit__title">Deposit List</h2>

            <div className="usrDeposit__searchBox">
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="usrDeposit__tableWrapper">
            <table className="usrDeposit__table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>FROM USER</th>
                  <th>TO USER</th>
                  <th>HASH</th>
                  <th>PLAN</th>
                  <th>AMOUNT</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8">No deposits found</td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(page - 1) * rowsPerPage + index + 1}</td>

                      <td>
                        <p>{item.from}</p>
                        <span>{item.fromId}</span>
                      </td>

                      <td>
                        <p>{item.to}</p>
                        <span>{item.toId}</span>
                      </td>

                      <td>{item.hash}</td>
                      <td>{item.plan}</td>
                      <td>{item.amount}</td>

                      <td>
                        {item.date
                          ? formatDateTime(item.date)
                          : "-"}
                      </td>

                      <td>
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === item.id ? null : item.id
                            )
                          }
                        >
                          ⋮
                        </button>

                        {activeDropdown === item.id && (
                          <div>
                            <button
                              onClick={() => {
                                setSelectedRow(item);
                                setActiveDropdown(null);
                              }}
                            >
                              View
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MODAL */}
          {selectedRow && (
            <div className="usrDeposit__modalOverlay">
              <div className="usrDeposit__modalBox">
                <h3>Transaction Details</h3>
                <p>{selectedRow.from} → {selectedRow.to}</p>
                <p>{selectedRow.plan}</p>
                <p>{selectedRow.amount}</p>
                <button onClick={() => setSelectedRow(null)}>Close</button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="usrDeposit__footer">

            <div className="usrDeposit__rows">
              Rows:
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="usrDeposit__pagination">

              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {"<"}
              </button>

              {getPagination().map((p, i) =>
                p === "..." ? (
                  <span key={i}>...</span>
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                {">"}
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default UserDeposit;