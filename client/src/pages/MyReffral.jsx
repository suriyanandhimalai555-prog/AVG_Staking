import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import axios from "axios";
import toast from "react-hot-toast";

const MyReferral = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [dateRange, setDateRange] = useState("Today");
  const [showFilter, setShowFilter] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    count: "",
  });

  const [data, setData] = useState([]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const API = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

  // ================= FETCH =================
  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/my-referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load referrals");
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // reset page when filters/search/rows change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters.startDate, filters.endDate, rowsPerPage, dateRange]);

  const getDateRange = (label) => {
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (label === "Today") {
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }

    if (label === "Last 7 Days") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return {
        startDate: from.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }

    if (label === "1 Month") {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 1);
      from.setHours(0, 0, 0, 0);
      return {
        startDate: from.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }

    if (label === "3 Months") {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      from.setHours(0, 0, 0, 0);
      return {
        startDate: from.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }

    return { startDate: "", endDate: "" };
  };

  // ================= FILTER + SEARCH =================
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const username = (item.username || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const userCode = (item.user_code || "").toLowerCase();
      const searchValue = search.toLowerCase();

      const matchSearch =
        username.includes(searchValue) ||
        phone.includes(searchValue) ||
        userCode.includes(searchValue);

      const createdAt = item.created_at ? new Date(item.created_at) : null;

      const matchStart =
        !filters.startDate || (createdAt && createdAt >= new Date(filters.startDate));
      const matchEnd =
        !filters.endDate || (createdAt && createdAt <= new Date(filters.endDate));

      return matchSearch && matchStart && matchEnd;
    });
  }, [data, search, filters.startDate, filters.endDate]);

  // ================= PAGINATION =================
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
      startPage = 1;
      endPage = 5;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 4;
      endPage = totalPages;
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // ================= DATE FORMAT =================
  const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};

  const handleDateRangeChange = (item) => {
    setDateRange(item);
    const { startDate, endDate } = getDateRange(item);
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
    setDropdownOpen(false);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="refLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="refContent">
          {/* HEADER */}
          <div className="refHeader">
            <h2>My Referrals</h2>

            <div className="refActions">
              {/* DATE RANGE */}
              <div className="refDropdown">
                <div
                  className="refDropdownHeader"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {dateRange}
                  <span>▾</span>
                </div>

                {dropdownOpen && (
                  <div className="refDropdownMenu">
                    {["Today", "Last 7 Days", "1 Month", "3 Months"].map((item) => (
                      <div
                        key={item}
                        className={`refDropdownItem ${dateRange === item ? "active" : ""}`}
                        onClick={() => handleDateRangeChange(item)}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="refBtn outline"
                onClick={() => setShowFilter(true)}
              >
                Filter
              </button>
            </div>
          </div>

          {/* SEARCH */}
          <div className="refSearch">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* TABLE */}
          <div className="refTableWrapper">
            <table className="refTable">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>USERNAME</th>
                  <th>LASTNAME</th>
                  <th>PHONE NUMBER</th>
                  <th>LEVEL</th>
                  <th>CREATED AT</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="refEmpty">
                      No available options
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span>{item.username}</span>
                          <small style={{ color: "#aaa" }}>{item.user_code}</small>
                        </div>
                      </td>
                      <td>{item.lastname || "-"}</td>
                      <td>{item.phone || "-"}</td>
                      <td>Level {item.level || "-"}</td>
                      <td>{formatDate(item.created_at)}</td>
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
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="usrDeposit__pagination">
              <button onClick={handlePrev} disabled={currentPage === 1}>
                {"< Prev"}
              </button>

              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button onClick={handleNext} disabled={currentPage === totalPages}>
                {"Next >"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER MODAL */}
      {showFilter && (
        <div className="refModalOverlay">
          <div className="refModal">
            <div className="refModalHeader">
              <h3>Filter Referrals</h3>
              <button onClick={() => setShowFilter(false)}>✕</button>
            </div>

            <div className="refModalBody">
              <div className="refField">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="refField">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>

              <div className="refField">
                <label>Direct Referral Count</label>
                <input
                  type="number"
                  placeholder="Enter count"
                  value={filters.count}
                  onChange={(e) =>
                    setFilters({ ...filters, count: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="refModalFooter">
              <button
                className="refCancel"
                onClick={() => setShowFilter(false)}
              >
                Cancel
              </button>

              <button
                className="refApply"
                onClick={() => setShowFilter(false)}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReferral;