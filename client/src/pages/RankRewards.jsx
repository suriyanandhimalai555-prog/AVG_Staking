import React, { useMemo, useState, useEffect } from "react";
import API from "../utils/api";
import * as XLSX from "xlsx";
import { 
  FaSearch, FaFilter, FaFileExcel, FaTrophy, FaCalendarAlt, 
  FaUserAlt, FaPhoneAlt, FaEye, FaEdit, FaTrashAlt, 
  FaCheckCircle, FaTimesCircle, FaClock, FaTimes, FaEllipsisV, FaUndo 
} from "react-icons/fa";

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
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await API.get("/ranks/admin");

      // 1. Parse and sort data by raw achieved_date in descending order (newest first)
      const sortedRaw = (res.data || []).sort((a, b) => {
        const dateA = a.achieved_date ? new Date(a.achieved_date).getTime() : 0;
        const dateB = b.achieved_date ? new Date(b.achieved_date).getTime() : 0;
        return dateB - dateA; // Descending order (newest date on top)
      });

      // 2. Map sorted items to table rows with sequential S.No
      const formatted = sortedRaw.map((item, index) => ({
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
        rawAchievedDate: item.achieved_date, // Saved for sorting reference if needed
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
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleActionClick = (reward, type) => {
    setSelectedReward(reward);
    setModalType(type);
    setShowModal(true);
    setActiveMenuId(null);
  };

  const handleUpdateStatus = async (reward, status) => {
    try {
      setActiveMenuId(null);
      await API.post("/ranks/status", {
        userId: reward.userId,
        reward: reward.rewardName,
        target_amount: reward.target_amount,
        progress: reward.progress,
        status,
      });
      fetchRewards();
      showPopupMessage(`Status changed to ${status.toUpperCase()} successfully`);
    } catch (err) {
      console.error("Status update error:", err);
      showPopupMessage("Failed to update status");
    }
  };

  const handleModalConfirm = () => {
    if (modalType === "delete" && selectedReward) {
      const updatedData = rewardsData.filter((item) => item.sno !== selectedReward.sno);
      setRewardsData(updatedData);
      showPopupMessage(`Reward for ${selectedReward.username} deleted successfully`);
    } else if (modalType === "edit" && selectedReward) {
      showPopupMessage(`Reward for ${selectedReward.username} updated successfully`);
    }
    setShowModal(false);
    setSelectedReward(null);
  };

  const handleDownloadExcel = (statusType) => {
    const dataToExport = rewardsData.filter(
      (item) => item.status.toLowerCase() === statusType.toLowerCase()
    );

    if (dataToExport.length === 0) {
      showPopupMessage(`No ${statusType} rewards data found to export.`);
      return;
    }

    const excelRows = dataToExport.map((item, idx) => ({
      "S.No": idx + 1,
      "Username": item.username,
      "User Code": item.userCode,
      "Phone No": item.phoneNo,
      "Reward Details": item.reward,
      "Achieved Date": item.achievedDate,
      "Status": item.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${statusType.toUpperCase()} Rewards`);

    worksheet["!cols"] = [{ wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 }];
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
      const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
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
    if (end - start < maxVisible - 1) start = Math.max(end - maxVisible + 1, 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const startIndex = (currentPage - 1) * rowsPerPage;

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 relative rounded-2xl shadow-2xl">
      
      {/* HEADER PANELS */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-white flex items-center gap-2">
              <FaTrophy className="text-amber-400" size={22} />
              Rank Milestone Rewards
            </h2>
            <p className="text-sm text-slate-400 mt-1">Manage global target metrics, processing checkpoints, and audit distributions</p>
          </div>

          {/* EXCEL ACTION CONTROL MATRIX */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleDownloadExcel("pending")}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-xl transition-all"
            >
              <FaFileExcel size={13} /> Export Pending
            </button>
            <button
              onClick={() => handleDownloadExcel("approved")}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-xl transition-all"
            >
              <FaFileExcel size={13} /> Export Approved
            </button>
            <button
              onClick={() => handleDownloadExcel("rejected")}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl transition-all"
            >
              <FaFileExcel size={13} /> Export Rejected
            </button>
          </div>
        </div>

        <hr className="my-5 border-slate-700/60" />

        {/* INPUT FILTERS CONTROL BAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <FaSearch size={14} />
            </span> */}
            <input
              type="text"
              placeholder="Search users, phone tags, status arrays..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-slate-400 text-xs flex items-center gap-1.5 whitespace-nowrap">
              <FaFilter size={12} className="text-slate-500" /> Segment Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-44 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* REWARDS LEDGER CARD */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider font-semibold border-b border-slate-700">
                <th className="py-4 px-5 w-16">S.No</th>
                <th className="py-4 px-5">User Identification Profile</th>
                <th className="py-4 px-5">Phone Link</th>
                <th className="py-4 px-5">Target Progression Track</th>
                <th className="py-4 px-5">Achieved Window</th>
                <th className="py-4 px-5">State Status</th>
                <th className="py-4 px-5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400">Extracting profile bonus matrices...</span>
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-500 font-medium">
                    No reward targets logged matching structural context parameters.
                  </td>
                </tr>
              ) : (
                pageItems.map((reward, i) => (
                  <tr key={reward.sno} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-5 text-slate-500 font-medium">{startIndex + i + 1}</td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">{reward.username}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{reward.userCode}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-300 font-medium">{reward.phoneNo}</td>
                    <td className="py-4 px-5">
                      <span className="text-amber-400 font-medium bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg text-xs">
                        {reward.reward}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-400">{reward.achievedDate}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(reward.status)}`}>
                        {reward.status.toUpperCase()}
                      </span>
                    </td>
                    
                    {/* DROP CONTROL MECHANIC WITHOUT LEGACY STYLES */}
                    <td className="py-4 px-5 text-center relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === reward.sno ? null : reward.sno)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                      >
                        <FaEllipsisV size={14} />
                      </button>

                      {activeMenuId === reward.sno && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-6 mt-1 w-48 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden text-left py-1 animate-fadeIn">
                            <button
                              onClick={() => handleActionClick(reward, "view")}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                              <FaEye size={12} className="text-cyan-400" /> View Profiles
                            </button>
                            <button
                              onClick={() => handleActionClick(reward, "edit")}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                              <FaEdit size={12} className="text-amber-400" /> Adjust Parameters
                            </button>

                            {reward.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(reward, "approved")}
                                  className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                                >
                                  <FaCheckCircle size={12} className="text-emerald-500" /> Verify Approval
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(reward, "rejected")}
                                  className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                                >
                                  <FaTimesCircle size={12} className="text-rose-500" /> Terminate Reject
                                </button>
                              </>
                            )}

                            {reward.status === "approved" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(reward, "pending")}
                                  className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                                >
                                  <FaUndo size={12} className="text-amber-500" /> Revert to Pending
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(reward, "rejected")}
                                  className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                                >
                                  <FaTimesCircle size={12} className="text-rose-500" /> Modify to Reject
                                </button>
                              </>
                            )}

                            {reward.status === "rejected" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(reward, "pending")}
                                  className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                                >
                                  <FaUndo size={12} className="text-amber-500" /> Revert to Pending
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(reward, "approved")}
                                  className="w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                                >
                                  <FaCheckCircle size={12} className="text-emerald-500" /> Force Approve
                                </button>
                              </>
                            )}

                            <div className="border-t border-slate-800 my-1" />
                            <button
                              onClick={() => handleActionClick(reward, "delete")}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                            >
                              <FaTrashAlt size={12} /> Purge Deletion
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROL MATRIX */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Grid Display Viewport:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {"<"}
            </button>

            {getPagination().map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-1.5 text-slate-600 font-bold">...</span>
              ) : (
                <button
                  key={i}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1.5 rounded font-semibold border transition-all ${
                    currentPage === p
                      ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-40 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>

      {/* CORE POPUP MODAL ARCHITECTURE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-base text-white tracking-wide">
                {modalType === "delete" && "Confirm Core System Purge"}
                {modalType === "edit" && "Modify Structural Threshold"}
                {modalType === "view" && "Comprehensive Reward Scope"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-300 max-h-[60vh] overflow-y-auto">
              {modalType === "delete" && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3">
                  <FaTrashAlt className="text-rose-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-slate-200 font-medium">Are you sure you want to delete this log layer?</p>
                    <p className="text-xs text-slate-400 mt-1">Purging the milestone tracker for user node <b className="text-slate-300">{selectedReward?.username}</b> cannot be reverted.</p>
                  </div>
                </div>
              )}

              {modalType === "edit" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username Alias</label>
                    <input type="text" defaultValue={selectedReward?.username} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Network Link</label>
                    <input type="text" defaultValue={selectedReward?.phoneNo} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reward Parameters Metrics</label>
                    <input type="text" defaultValue={selectedReward?.reward} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
              )}

              {modalType === "view" && selectedReward && (
                <div className="grid grid-cols-1 gap-2.5 font-sans">
                  {Object.entries(selectedReward).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-700/40 rounded-xl">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-medium text-slate-200 truncate max-w-xs">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700 flex justify-end gap-2.5">
              <button
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                onClick={() => setShowModal(false)}
              >
                Abort
              </button>
              {(modalType === "delete" || modalType === "edit") && (
                <button 
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all text-white ${
                    modalType === "delete" ? "bg-rose-600 hover:bg-rose-500" : "bg-amber-600 hover:bg-amber-500"
                  }`} 
                  onClick={handleModalConfirm}
                >
                  {modalType === "delete" ? "Execute Purge" : "Commit Changes"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM POPUP CARD */}
      {showPopup && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-950 border-l-4 border-amber-500 text-slate-200 px-5 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-4 max-w-md animate-slideUp">
          <span className="text-xs font-medium tracking-wide">{popupMessage}</span>
          <button onClick={() => setShowPopup(false)} className="text-slate-500 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RankRewards;