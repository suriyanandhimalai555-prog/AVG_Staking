import React, { useMemo, useState, useEffect } from "react";
import API from "../utils/api";
import * as XLSX from "xlsx"; // Imported for true Excel .xlsx format download

const formatDateOnly = (value) => {
  if (!value) return "-";

  const raw = String(value);
  const normalized = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

const RankRewards = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rewardsData, setRewardsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedReward, setSelectedReward] = useState(null);

  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const fetchRewards = async () => {
    try {
      setLoading(true);

      const res = await API.get("/ranks/admin");

      const formatted = (res.data || []).map((item, index) => ({
        sno: index + 1,
        userId: item.userId,
        userCode: item.userCode || "-",
        rewardName: item.reward,
        target_amount: item.target_amount,
        progress: item.progress,
        username: item.username || "-",
        phoneNo: item.phone || "-",
        reward: `${item.reward} ($${item.progress} / $${item.target_amount})`,
        status: item.status || "pending",
        achievedDate: formatDateOnly(item.achieved_date),
      }));

      setRewardsData(formatted);
    } catch (err) {
      console.error("Fetch rewards error:", err);
      setRewardsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const handleView = (reward) => {
    setSelectedReward(reward);
    setModalType("view");
    setShowModal(true);
  };

  const handleEdit = (reward) => {
    setSelectedReward(reward);
    setModalType("edit");
    setShowModal(true);
  };

  const handleDelete = (reward) => {
    setSelectedReward(reward);
    setModalType("delete");
    setShowModal(true);
  };

  const handleApprove = async (reward) => {
    try {
      await API.post("/ranks/status", {
        userId: reward.userId,
        reward: reward.rewardName,
        target_amount: reward.target_amount,
        progress: reward.progress,
        status: "approved",
      });

      fetchRewards();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (reward) => {
    try {
      await API.post("/ranks/status", {
        userId: reward.userId,
        reward: reward.rewardName,
        target_amount: reward.target_amount,
        progress: reward.progress,
        status: "rejected",
      });

      fetchRewards();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const handleModalConfirm = () => {
    if (modalType === "delete" && selectedReward) {
      const updatedData = rewardsData.filter(
        (item) => item.sno !== selectedReward.sno
      );
      setRewardsData(updatedData);
      showPopupMessage(
        `Reward for ${selectedReward.username} deleted successfully`
      );
    } else if (modalType === "edit" && selectedReward) {
      showPopupMessage(
        `Reward for ${selectedReward.username} updated successfully`
      );
    }

    setShowModal(false);
    setSelectedReward(null);
  };

  // True Excel (.xlsx) Download Handler
  const handleDownloadExcel = (statusType) => {
    const dataToExport = rewardsData.filter(
      (item) => item.status.toLowerCase() === statusType.toLowerCase()
    );

    if (dataToExport.length === 0) {
      showPopupMessage(`No ${statusType} rewards data found to export.`);
      return;
    }

    // Format headers and rows for Excel layout
    const excelRows = dataToExport.map((item, idx) => ({
      "S.No": idx + 1,
      "Username": item.username,
      "User Code": item.userCode,
      "Phone No": item.phoneNo,
      "Reward Details": item.reward,
      "Achieved Date": item.achievedDate,
      "Status": item.status.toUpperCase(),
    }));

    // Generate Excel worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${statusType.toUpperCase()} Rewards`);

    // Auto-adjust column widths so data is clean and readable
    const maxProps = [{ wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 }];
    worksheet["!cols"] = maxProps;

    // Trigger true .xlsx file download
    const fileName = `Rank_Rewards_${statusType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return rewardsData.filter((item) => {
      const matchesSearch =
        item.username.toLowerCase().includes(q) ||
        item.reward.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.phoneNo.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rewardsData, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, statusFilter]);

  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 1) return [1];

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

  const startIndex = (currentPage - 1) * rowsPerPage;

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
  };

  const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "approved";
      case "pending":
        return "pending";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="rr-modal-overlay">
        <div className="rr-modal">
          <div className="rr-modal-header">
            <h3>
              {modalType === "delete"
                ? "Confirm Delete"
                : modalType === "edit"
                ? "Edit Reward"
                : "View Details"}
            </h3>
            <button className="rr-modal-close" onClick={() => setShowModal(false)}>
              ×
            </button>
          </div>

          <div className="rr-modal-body">
            {modalType === "delete" && (
              <p>
                Are you sure you want to delete the reward for{" "}
                {selectedReward?.username}?
              </p>
            )}

            {modalType === "edit" && (
              <div className="rr-edit-form">
                <div className="rr-form-group">
                  <label>Username:</label>
                  <input type="text" defaultValue={selectedReward?.username} />
                </div>
                <div className="rr-form-group">
                  <label>Phone No:</label>
                  <input type="text" defaultValue={selectedReward?.phoneNo} />
                </div>
                <div className="rr-form-group">
                  <label>Reward:</label>
                  <input type="text" defaultValue={selectedReward?.reward} />
                </div>
              </div>
            )}

            {modalType === "view" && selectedReward && (
              <div className="rr-view-details">
                {Object.entries(selectedReward).map(([key, value]) => (
                  <div key={key} className="rr-detail-row">
                    <strong>{key}:</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rr-modal-footer">
            <button
              className="rr-modal-btn cancel"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

            {(modalType === "delete" || modalType === "edit") && (
              <button className="rr-modal-btn confirm" onClick={handleModalConfirm}>
                {modalType === "delete" ? "Delete" : "Save"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPopup = () => {
    if (!showPopup) return null;
    return <div className="rr-popup">{popupMessage}</div>;
  };

  return (
    <div className="rr-container">
      <div className="rr-header">
        <h1 className="rr-title">Rank Rewards</h1>

        <div className="rr-search-box">
          <div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rr-filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="approved">Completed</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Excel Downloads Section */}
          <div className="rr-excel-actions" style={{ display: "flex", gap: "10px" }}>
            <button 
              className="excel-btn  tx-manual-deposit-btn" 
              onClick={() => handleDownloadExcel("pending")}
            >
              Download Pending Excel
            </button>
            <button 
              className="excel-btn approved tx-manual-deposit-btn" 
              onClick={() => handleDownloadExcel("approved")}
            >
              Download Approved Excel
            </button>
            <button 
              className="excel-btn rejected tx-manual-deposit-btn" 
              onClick={() => handleDownloadExcel("rejected")}
            >
              Download Rejected Excel
            </button>
          </div>
        </div>
      </div>

      <div className="rr-table-responsive">
        <table className="rr-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USERNAME</th>
              <th>PHONE NO</th>
              <th>REWARD</th>
              <th>ACHIEVED DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="rr-no-data">
                  Loading...
                </td>
              </tr>
            ) : pageItems.length > 0 ? (
              pageItems.map((reward, i) => (
                <tr key={reward.sno}>
                  <td>{startIndex + i + 1}</td>
                  <td style={{ display: "flex", flexDirection: "column" }}>
                    {reward.username}
                    <small>{reward.userCode}</small>
                  </td>
                  <td>{reward.phoneNo}</td>
                  <td className="rr-reward-cell">{reward.reward}</td>
                  <td>{reward.achievedDate}</td>
                  <td>
                    <span className={`rr-status-badge ${getStatusClass(reward.status)}`}>
                      {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="rr-actions-dropdown">
                      <button className="rr-action-btn">⋮</button>
                      <div className="rr-actions-menu">
                        <button onClick={() => handleView(reward)}>👁️ View</button>
                        <button onClick={() => handleEdit(reward)}>✏️ Edit</button>

                        {reward.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(reward)}>
                              ✅ Approve
                            </button>
                            <button onClick={() => handleReject(reward)}>
                              ❌ Reject
                            </button>
                          </>
                        )}

                        <button onClick={() => handleDelete(reward)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="rr-no-data">
                  No rewards found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="usrDeposit__rows">
          Rows per page
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                className={currentPage === p ? "active" : ""}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            {">"}
          </button>
        </div>
      </div>

      {renderModal()}
      {renderPopup()}
    </div>
  );
};

export default RankRewards;