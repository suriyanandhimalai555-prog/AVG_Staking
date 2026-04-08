import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import { formatDateTimeIST } from "../utils/dateFormat";

const UserDirect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ FETCH DATA
  useEffect(() => {
    const fetchLevelIncome = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/users/my-level-income`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLevelIncome();
  }, []);

  // ✅ FILTER
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return data.filter((item) =>
      (item.from || "").toLowerCase().includes(q) ||
      (item.to || "").toLowerCase().includes(q) ||
      (item.type || "").toLowerCase().includes(q) ||
      (item.amount?.toString() || "").toLowerCase().includes(q)
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
    <div className="udiLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="udiContent">

          {/* HEADER */}
          <div className="utxFirstContent">
            <h2 className="udiTitle">My Level Income</h2>

            <div className="udiSearch">
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
          <div className="udiTableWrapper">
            <table className="udiTable">
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6">No available options</td>
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

                      <td>{item.type}</td>

                      <td className="udiAmount">{item.amount}</td>

                      <td>
                        {formatDateTimeIST(item.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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

            {/* ✅ CLEAN PAGINATION */}
            <div className="usrDeposit__pagination">

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
      </div>
    </div>
  );
};

export default UserDirect;