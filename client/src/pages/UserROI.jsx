import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserROI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ FETCH ROI
  const fetchROI = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/roi-history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        from: item.from_user || "Admin",
        fromId: item.from_id || "SYSTEM",
        to: item.to_user || "-",
        toId: item.to_id || "-",
        type: "Daily ROI Income",
        amount: `$${Number(item.amount || 0).toFixed(2)}`,
        date: item.created_at,
      }));

      setData(formatted);
    } catch (err) {
      console.error("ROI fetch error:", err);
    }
  };

  useEffect(() => {
    fetchROI();
  }, []);

  // ✅ FILTER
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.amount.toLowerCase().includes(search.toLowerCase()) ||
      item.from.toLowerCase().includes(search.toLowerCase()) ||
      item.to.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // ✅ SMART PAGINATION
  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(currentPage - 2, 1);
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
    <div className="uroiLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="uroiContent">

          {/* HEADER */}
          <div className="utxFirstContent">
            <h2 className="uroiTitle">My ROI Income</h2>

            <div className="uroiSearch">
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="uroiTableWrapper">
            <table className="uroiTable">
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
                    <td colSpan="6">No ROI data found</td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>

                      <td>
                        <p>{item.from}</p>
                        <span>{item.fromId}</span>
                      </td>

                      <td>
                        <p>{item.to}</p>
                        <span>{item.toId}</span>
                      </td>

                      <td className="uroiType">{item.type}</td>

                      <td className="uroiAmount">{item.amount}</td>

                      <td>{item.date}</td>
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
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="usrDeposit__pagination">

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
              >
                {"<"}
              </button>

              {getPagination().map((p, i) =>
                p === "..." ? (
                  <span key={i} className="dots">...</span>
                ) : (
                  <button
                    key={i}
                    className={currentPage === p ? "active" : ""}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
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

export default UserROI;