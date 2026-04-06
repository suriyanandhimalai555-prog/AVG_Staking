import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";
import { FaEllipsisV } from "react-icons/fa";

const ActivePlans = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [plansData, setPlansData] = useState([]);

  const [menuOpen, setMenuOpen] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  /* ================= FETCH ================= */
  const fetchAllPlans = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || 'N/A',
        planName: item.plan_name || 'N/A',
        depositAmount: `$${item.amount ?? 0}`,
        dailyROI: `$${item.daily_roi ?? 0}`,
        status:
          String(item.status || '').toLowerCase() === 'active'
            ? 'Active'
            : 'Inactive',
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleString()
          : '-',
      }));

      setPlansData(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Failed to load plans ❌");
    }
  }, []);

  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  /* ================= ACTIONS ================= */
  const handleView = (plan) => {
    setSelectedPlan(plan);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = (plan) => {
    setSelectedPlan(plan);
    setModalType('delete');
    setShowModal(true);
  };

  const handleStatusChange = async (plan) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = plan.status === 'Active' ? 'inactive' : 'active';

      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${plan.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Status changed to ${newStatus} ✅`);
      fetchAllPlans();
    } catch (err) {
      console.error(err);
      toast.error("Status update failed ❌");
    }
  };

  const handleModalConfirm = async () => {
    try {
      const token = localStorage.getItem('token');

      if (modalType === 'delete' && selectedPlan) {
        await axios.delete(
          `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${selectedPlan.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Plan deleted 🗑️");
        fetchAllPlans();
      }

      setShowModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error(err);
      toast.error("Delete failed ❌");
    }
  };

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return plansData.filter(
      (item) =>
        item.user.toLowerCase().includes(q) ||
        item.planName.toLowerCase().includes(q)
    );
  }, [plansData, searchTerm]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

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

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  /* ================= MODAL ================= */
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>
              {modalType === 'delete'
                ? 'Confirm Delete'
                : modalType === 'edit'
                  ? 'Edit Plan'
                  : 'View Details'}
            </h3>
            <button onClick={() => setShowModal(false)}>✕</button>
          </div>

          <div className="modal-body">
            {modalType === 'delete' && (
              <p>Delete plan for {selectedPlan?.user}?</p>
            )}

            {modalType === 'view' && selectedPlan && (
              Object.entries(selectedPlan).map(([k, v]) => (
                <div key={k} className="modal-row">
                  <label>{k}</label>
                  <span>{v}</span>
                </div>
              ))
            )}
          </div>

          <div className="modal-footer">
            <button onClick={() => setShowModal(false)}>Cancel</button>
            {modalType === 'delete' && (
              <button onClick={handleModalConfirm}>Delete</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="users-page">

      <div className="users-header">
        <h2>Active Plans</h2>

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USER</th>
              <th>PLAN</th>
              <th>DEPOSIT</th>
              <th>ROI</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((plan, index) => (
                <tr key={plan.id}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>{plan.user}</td>
                  <td>{plan.planName}</td>
                  <td>{plan.depositAmount}</td>
                  <td>{plan.dailyROI}</td>

                  <td>
                    <span className={plan.status === "Active" ? "badge-active" : "badge-inactive"}>
                      {plan.status}
                    </span>
                  </td>

                  <td>{plan.createdAt}</td>

                  <td className="action-cell">
                    <FaEllipsisV
                      onClick={() =>
                        setMenuOpen(menuOpen === plan.id ? null : plan.id)
                      }
                    />

                    {menuOpen === plan.id && (
                      <div className="action-dropdown">
                        <div onClick={() => handleView(plan)}>View</div>
                        <div onClick={() => handleEdit(plan)}>Edit</div>
                        <div onClick={() => handleStatusChange(plan)}>
                          {plan.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </div>
                        <div className="delete" onClick={() => handleDelete(plan)}>
                          Delete
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No plans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ SAME PAGINATION */}
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
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            {"<"}
          </button>

          {getPagination().map((p, i) =>
            p === "..." ? (
              <span key={i}>...</span>
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
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            {">"}
          </button>
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default ActivePlans;