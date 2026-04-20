// ActivePlans.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";
import { FaEllipsisV } from "react-icons/fa";

const ActivePlans = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [plansData, setPlansData] = useState([]);
  const [requestPlans, setRequestPlans] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  const [menuOpen, setMenuOpen] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [editForm, setEditForm] = useState({
    amount: '',
    status: 'active',
  });

  /* ✅ DATE FORMAT (YOUR EXACT LOGIC) */
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    const istDate = new Date(
      d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const day = String(istDate.getDate()).padStart(2, "0");
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const year = istDate.getFullYear();

    let hours = istDate.getHours();
    const minutes = String(istDate.getMinutes()).padStart(2, "0");
    const seconds = String(istDate.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  /* ================= FETCH ================= */
  const fetchAllPlans = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || 'N/A',
        userCode: item.user_code || '-',
        planName: item.plan_name || 'N/A',

        // raw values for editing
        amountValue: Number(item.amount ?? 0),
        dailyROIValue: Number(item.daily_roi ?? 0),

        // display values
        depositAmount: `$${Number(item.amount ?? 0)}`,
        dailyROI: `$${Number(item.daily_roi ?? 0)}`,

        status:
          String(item.status || '').toLowerCase() === 'active'
            ? 'Active'
            : 'Inactive',
        createdAt: formatDate(item.created_at),
      }));

      setPlansData(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Failed to load plans ❌");
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        user: item.user || 'N/A',
        userCode: item.user_code || '-',
        planName: item.plan_name || 'N/A',
        amount: `$${item.amount ?? 0}`,
        status:
          String(item.status || '').toLowerCase() === 'pending'
            ? 'Pending'
            : String(item.status || '').toLowerCase(),
        createdAt: formatDate(item.created_at),
      }));

      setRequestPlans(formatted);
    } catch (err) {
      console.error('Fetch request plans error:', err);
      toast.error("Failed to load requests ❌");
    }
  }, []);

  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  useEffect(() => {
    if (showRequests) {
      fetchRequests();
    }
  }, [showRequests, fetchRequests]);

  useEffect(() => {
    setMenuOpen(null);
    setCurrentPage(1);
  }, [showRequests]);

  const handleApproveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.put(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Request approved ✅");
      fetchRequests();
      fetchAllPlans();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Approve failed ❌");
    }
  };

  const handleRejectRequest = async (requestId) => {
  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${requestId}/reject`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toast.success("Request rejected ❌");
    fetchRequests();
    fetchAllPlans();
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || "Reject failed ❌");
  }
};

  /* ================= ACTIONS ================= */
  const handleView = (plan) => {
    setSelectedPlan(plan);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setEditForm({
      amount: String(plan.amountValue ?? 0),
      status: String(plan.status || 'Active').toLowerCase() === 'active' ? 'active' : 'inactive',
    });
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
        setShowModal(false);
        setSelectedPlan(null);
        return;
      }

      if (modalType === 'edit' && selectedPlan) {
        const amount = Number(editForm.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
          toast.error("Enter a valid amount ❌");
          return;
        }

        await axios.put(
          `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/${selectedPlan.id}`,
          {
            amount,
            status: editForm.status,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Plan updated ✅");
        fetchAllPlans();
        setShowModal(false);
        setSelectedPlan(null);
        return;
      }

      setShowModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Action failed ❌");
    }
  };

  const dataSource = showRequests ? requestPlans : plansData;

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return dataSource.filter((item) => {
      const user = String(item.user || '').toLowerCase();
      const userCode = String(item.userCode || '').toLowerCase();
      const planName = String(item.planName || '').toLowerCase();
      const depositAmount = String(item.depositAmount || item.amount || '').toLowerCase();
      const dailyROI = String(item.dailyROI || '').toLowerCase();
      const status = String(item.status || '').toLowerCase();

      return (
        user.includes(q) ||
        userCode.includes(q) ||
        planName.includes(q) ||
        depositAmount.includes(q) ||
        dailyROI.includes(q) ||
        status.includes(q)
      );
    });
  }, [dataSource, searchTerm]);

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

            {modalType === 'edit' && selectedPlan && (
              <div style={{ display: "grid", gap: "12px" }}>
                <div className="modal-row">
                  <label>User</label>
                  <span>{selectedPlan.user}</span>
                </div>

                <div className="modal-row">
                  <label>Plan</label>
                  <span>{selectedPlan.planName}</span>
                </div>

                <div className="modal-row">
                  <label>Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="modal-row">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            {modalType === 'view' && selectedPlan && (
              Object.entries(selectedPlan).map(([k, v]) => (
                <div key={k} className="modal-row">
                  <label>{k}</label>
                  <span>{String(v)}</span>
                </div>
              ))
            )}
          </div>

          <div className="modal-footer">
            <button onClick={() => setShowModal(false)}>Cancel</button>

            {modalType === 'delete' && (
              <button onClick={handleModalConfirm}>Delete</button>
            )}

            {modalType === 'edit' && (
              <button onClick={handleModalConfirm}>Save Changes</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>{showRequests ? 'Plan Requests' : 'Active Plans'}</h2>

        <div>
          <button
            type="button"
            onClick={() => setShowRequests((prev) => !prev)}
            className='tx-manual-deposit-btn'
          >
            {showRequests ? "Show Active Plans" : "Request Plan"}
          </button>

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table className="users-table">
          <thead>
            {showRequests ? (
              <tr>
                <th>S.NO</th>
                <th>USER</th>
                <th>PLAN</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            ) : (
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
            )}
          </thead>

          <tbody>
            {currentItems.length > 0 ? (
              showRequests ? (
                currentItems.map((plan, index) => (
                  <tr key={plan.id}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{plan.user}</span>
                        <small style={{ color: "#aaa" }}>{plan.userCode}</small>
                      </div>
                    </td>
                    <td>{plan.planName}</td>
                    <td>{plan.amount}</td>
                    <td>
                      <span className="badge-inactive">{plan.status}</span>
                    </td>
                    <td>{plan.createdAt}</td>
                    <td style={{ display: "flex", gap: "8px" }}>
  <button 
    onClick={() => handleApproveRequest(plan.id)}
    style={{
      backgroundColor: "green",
      color: "#fff",
      padding: "6px 12px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    }}
    >
    Approve
  </button>

  <button
    onClick={() => handleRejectRequest(plan.id)}
    style={{
      background: "#dc3545",
      color: "#fff",
      padding: "6px 12px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    }}
  >
    Reject
  </button>
</td>
                  </tr>
                ))
              ) : (
                currentItems.map((plan, index) => (
                  <tr key={plan.id}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{plan.user}</span>
                        <small style={{ color: "#aaa" }}>{plan.userCode}</small>
                      </div>
                    </td>
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
              )
            ) : (
              <tr>
                <td colSpan={showRequests ? "7" : "8"} style={{ textAlign: "center" }}>
                  No plans found
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
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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