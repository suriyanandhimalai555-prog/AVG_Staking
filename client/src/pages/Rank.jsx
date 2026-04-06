import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

/**
 * RankConfig.jsx
 */

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/ranks`;

const RankConfig = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [editForm, setEditForm] = useState({
    targetAmount: "",
    reward: "",
  });

  const [addForm, setAddForm] = useState({
    targetAmount: "",
    reward: "",
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const showPopupMessage = (msg) => {
    setPopupMessage(msg);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2500);
  };

  // ✅ FETCH DATA
  const fetchData = async () => {
    try {
      const res = await axios.get(API, getAuthConfig());

      const formatted = res.data.map((item, index) => ({
        sno: index + 1,
        id: item.id,
        targetAmount: `$${item.target_amount}`,
        reward: item.reward,
        status: item.status,
        createdAt: item.created_at,
      }));

      setData(formatted);
    } catch (err) {
      console.error(err);
      showPopupMessage("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ TOGGLE
  const toggleStatus = async (item) => {
    try {
      await axios.put(`${API}/${item.id}/toggle`, {}, getAuthConfig());
      fetchData();
      showPopupMessage("Status updated");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ ACTIONS
  const handleView = (item) => {
    setSelectedItem(item);
    setModalType("view");
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditForm({
      targetAmount: item.targetAmount.replace("$", ""),
      reward: item.reward,
    });
    setModalType("edit");
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setModalType("delete");
    setShowModal(true);
  };

  const openAdd = () => {
    setAddForm({ targetAmount: "", reward: "" });
    setModalType("add");
    setShowModal(true);
  };

  // ✅ CONFIRM
  const confirmModal = async () => {
    try {
      if (modalType === "delete") {
        await axios.delete(`${API}/${selectedItem.id}`, getAuthConfig());
        showPopupMessage("Deleted successfully");
      }

      if (modalType === "edit") {
        await axios.put(
          `${API}/${selectedItem.id}`,
          {
            target_amount: editForm.targetAmount,
            reward: editForm.reward,
          },
          getAuthConfig()
        );
        showPopupMessage("Updated successfully");
      }

      if (modalType === "add") {
        await axios.post(
          API,
          {
            target_amount: addForm.targetAmount,
            reward: addForm.reward,
          },
          getAuthConfig()
        );
        showPopupMessage("Added successfully");
      }

      fetchData();
      setShowModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      showPopupMessage("Action failed");
    }
  };

  // ✅ SEARCH
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return data.filter(
      (r) =>
        r.targetAmount.toLowerCase().includes(q) ||
        r.reward.toLowerCase().includes(q)
    );
  }, [searchTerm, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="cf-main-content">
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Rank Configuration</h1>
          <p className="cf-page-subtitle">Manage rank rewards</p>
        </div>

        <button className="tx-manual-deposit-btn" onClick={openAdd}>
          Add Configuration
        </button>
      </div>

      <div className="cf-table-container">
        <div className="cf-table-header">
          <h2 className="cf-table-title">Rank Configuration</h2>
          <div className="cf-search-box">
            <input
              type="text"
              placeholder="Search by amount or reward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="cf-table-responsive">
          <table className="cf-data-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>TARGET AMOUNT</th>
                <th>REWARD</th>
                <th>STATUS</th>
                <th>CREATED AT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.sno}</td>
                  <td>{item.targetAmount}</td>
                  <td className="cf-reward-cell">{item.reward}</td>
                  <td>
                    <button
                      className={`cf-toggle-btn ${
                        item.status ? "cf-active" : "cf-inactive"
                      }`}
                      onClick={() => toggleStatus(item)}
                    >
                      <span className="cf-toggle-slider" />
                    </button>
                  </td>
                  <td>{item.createdAt}</td>
                  <td>
                    <div className="cf-actions-dropdown">
                      <button className="cf-action-btn">⋮</button>
                      <div className="cf-actions-menu">
                        <button onClick={() => handleView(item)}>👁️ View</button>
                        <button onClick={() => handleEdit(item)}>✏️ Edit</button>
                        <button onClick={() => handleDelete(item)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="cf-no-data">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cf-table-footer">
        <div className="cf-rows-selector">
          <span>Rows:</span>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span className="cf-rows-info">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filtered.length)} of {filtered.length}</span>
        </div>

        <div className="cf-pagination">
          <button className="cf-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} className={`cf-page-btn ${currentPage === i + 1 ? "cf-active" : ""}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="cf-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="cf-modal-overlay">
          <div className="cf-modal">
            <div className="cf-modal-header">
              <h3>
                {modalType === "add"
                  ? "Add Configuration"
                  : modalType === "edit"
                  ? "Edit Configuration"
                  : modalType === "delete"
                  ? "Confirm Delete"
                  : "Details"}
              </h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="cf-modal-body">
              {modalType === "view" && selectedItem && (
                <div className="cf-view-details">
                  <div className="cf-detail-row">
                    <strong>Target Amount:</strong>
                    <span>{selectedItem.targetAmount}</span>
                  </div>
                  <div className="cf-detail-row">
                    <strong>Reward:</strong>
                    <span>{selectedItem.reward}</span>
                  </div>
                  <div className="cf-detail-row">
                    <strong>Status:</strong>
                    <span>{selectedItem.status ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="cf-detail-row">
                    <strong>Created At:</strong>
                    <span>{selectedItem.createdAt}</span>
                  </div>
                </div>
              )}

              {modalType === "add" && (
                <>
                  <input
                    placeholder="Target Amount"
                    value={addForm.targetAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, targetAmount: e.target.value })
                    }
                  />
                  <input
                    placeholder="Reward"
                    value={addForm.reward}
                    onChange={(e) =>
                      setAddForm({ ...addForm, reward: e.target.value })
                    }
                  />
                </>
              )}

              {modalType === "edit" && (
                <>
                  <input
                    value={editForm.targetAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, targetAmount: e.target.value })
                    }
                  />
                  <input
                    value={editForm.reward}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reward: e.target.value })
                    }
                  />
                </>
              )}

              {modalType === "delete" && (
                <p>Are you sure you want to delete?</p>
              )}
            </div>

            <div className="cf-modal-footer">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={confirmModal}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showPopup && <div className="cf-popup">{popupMessage}</div>}
    </div>
  );
};

export default RankConfig;