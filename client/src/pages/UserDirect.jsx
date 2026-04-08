import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import { formatDateTimeIST } from "../utils/dateFormat";

const UserDirect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDirectIncome = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/users/my-direct-income`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(res.data || []);
      } catch (err) {
        console.error("Failed to fetch direct income:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectIncome();
  }, []);

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return data.filter((item) => {
      const from = (item.from || "").toLowerCase();
      const to = (item.to || "").toLowerCase();
      const type = (item.type || "").toLowerCase();
      const fromId = (item.fromId || "").toLowerCase();
      const toId = (item.toId || "").toLowerCase();

      return (
        from.includes(q) ||
        to.includes(q) ||
        type.includes(q) ||
        fromId.includes(q) ||
        toId.includes(q)
      );
    });
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className="udiLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="udiContent">
          <div className="utxFirstContent">
            <h2 className="udiTitle">My Direct Income</h2>

          <div className="udiSearch">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          </div>

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
                {loading ? (
                  <tr>
                    <td colSpan="6" className="udiEmpty">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="udiEmpty">
                      No available options
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={`${item.id}-${item.level}-${index}`}>
                      <td>{(page - 1) * rowsPerPage + index + 1}</td>

                      <td>
                        <p>{item.from}</p>
                        <span>{item.fromId}</span>
                      </td>

                      <td>
                        <p>{item.to}</p>
                        <span>{item.toId}</span>
                      </td>

                      <td className="udiType">{item.type}</td>

                      <td className="udiAmount">${item.amount}</td>

                      <td>{formatDateTimeIST(item.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {"< "}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={page === p ? "active" : ""}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {" >"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDirect;