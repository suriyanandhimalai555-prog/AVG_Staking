import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/**
 * LevelConfig.jsx
 * Route: /dashboard/configuration/level
 */

const API_BASE = "http://localhost:5000/api/levels"; // change only if your mounted route is different

const LevelConfig = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // add | edit | view | delete
  const [selectedItem, setSelectedItem] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [formData, setFormData] = useState({
    level: "",
    percentage: "",
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

  const normalizeRow = (row) => {
    const rawPercentage =
      row.percentage !== undefined && row.percentage !== null
        ? String(row.percentage)
        : "";

    const displayPercentage = rawPercentage.endsWith("%")
      ? rawPercentage
      : rawPercentage
      ? `${rawPercentage}%`
      : "";

    const rawStatus = row.status;

    const normalizedStatus =
      rawStatus === true ||
      rawStatus === 1 ||
      rawStatus === "1" ||
      rawStatus === "true";

    return {
      id: row.id,
      level: Number(row.level),
      percentage: displayPercentage,
      status: normalizedStatus,
      createdAt: row.created_at || row.createdAt || row.created_at_at || "",
    };
  };

  const fetchLevels = async () => {
    try {
      const res = await axios.get(API_BASE, getAuthConfig());
      const rows = Array.isArray(res.data) ? res.data : [];
      setData(rows.map(normalizeRow));
    } catch (err) {
      console.error("fetchLevels error:", err);
      showPopupMessage(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to load levels"
      );
    }
  };

  useEffect(() => {
    fetchLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setModalType("add");
    setSelectedItem(null);
    setFormData({ level: "", percentage: "" });
    setShowModal(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setModalType("view");
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setModalType("edit");
    setFormData({
      level: item.level,
      percentage: String(item.percentage).replace("%", ""),
    });
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setModalType("delete");
    setShowModal(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleStatus = async (item) => {
    try {
      await axios.put(`${API_BASE}/${item.id}/toggle`, {}, getAuthConfig());
      await fetchLevels();
      showPopupMessage(
        `Level ${item.level} ${item.status ? "deactivated" : "activated"}`
      );
    } catch (err) {
      console.error("toggleStatus error:", err);
      showPopupMessage(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to update status"
      );
    }
  };

  const confirmModal = async () => {
    try {
      if (modalType === "add") {
        const payload = {
          level: Number(formData.level),
          percentage: String(formData.percentage).replace("%", "").trim(),
        };

        if (!payload.level || !payload.percentage) {
          showPopupMessage("All fields are required");
          return;
        }

        await axios.post(API_BASE, payload, getAuthConfig());
        await fetchLevels();
        showPopupMessage("Configuration added successfully");
      }

      if (modalType === "edit" && selectedItem) {
        const payload = {
          level: Number(formData.level),
          percentage: String(formData.percentage).replace("%", "").trim(),
        };

        if (!payload.level || !payload.percentage) {
          showPopupMessage("All fields are required");
          return;
        }

        await axios.put(`${API_BASE}/${selectedItem.id}`, payload, getAuthConfig());
        await fetchLevels();
        showPopupMessage("Configuration updated successfully");
      }

      if (modalType === "delete" && selectedItem) {
        await axios.delete(`${API_BASE}/${selectedItem.id}`, getAuthConfig());
        await fetchLevels();
        showPopupMessage(`Level ${selectedItem.level} configuration deleted`);
      }

      setShowModal(false);
      setSelectedItem(null);
      setModalType("");
    } catch (err) {
      console.error("confirmModal error:", err);
      showPopupMessage(
        err?.response?.data?.message || err?.response?.data?.error || "Action failed"
      );
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;

    return data.filter((r) => {
      const levelText = String(r.level).toLowerCase();
      const percentageText = String(r.percentage).toLowerCase();
      const statusText = r.status ? "active" : "inactive";
      return (
        levelText.includes(q) ||
        percentageText.includes(q) ||
        statusText.includes(q)
      );
    });
  }, [searchTerm, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="cf-main-content">
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Level Configuration</h1>
          <p className="cf-page-subtitle">Manage level percentages</p>
        </div>

        <button className="tx-manual-deposit-btn" onClick={openAddModal}>
          Add configuration
        </button>
      </div>

      <div className="cf-table-container">
        <div className="cf-table-header">
          <h2 className="cf-table-title">Level Configuration</h2>
          <div className="cf-search-box">
            <input
              type="text"
              placeholder="Search by level or percentage..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="cf-table-responsive">
          <table className="cf-data-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>LEVEL</th>
                <th>PERCENTAGE</th>
                <th>STATUS</th>
                <th>CREATED AT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr key={item.id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>Level {item.level}</td>
                  <td>{item.percentage}</td>
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
                  <td>{item.createdAt || "-"}</td>
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
                    No level configurations found
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
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span className="cf-rows-info">
            {filtered.length === 0
              ? "0-0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(
                  indexOfLastItem,
                  filtered.length
                )} of ${filtered.length}`}
          </span>
        </div>

        <div className="cf-pagination">
          <button
            className="cf-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`cf-page-btn ${currentPage === i + 1 ? "cf-active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="cf-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <div className="cf-modal-overlay">
          <div className="cf-modal">
            <div className="cf-modal-header">
              <h3>
                {modalType === "delete"
                  ? "Confirm Delete"
                  : modalType === "edit"
                  ? "Edit Configuration"
                  : modalType === "add"
                  ? "Add Configuration"
                  : "Configuration Details"}
              </h3>
              <button
                className="cf-modal-close"
                onClick={() => {
                  setShowModal(false);
                  setModalType("");
                  setSelectedItem(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="cf-modal-body">
              {modalType === "delete" && (
                <p>Are you sure you want to delete this configuration?</p>
              )}

              {modalType === "view" && selectedItem && (
                <div className="cf-view-details">
                  <div className="cf-detail-row">
                    <strong>Level:</strong>
                    <span>Level {selectedItem.level}</span>
                  </div>
                  <div className="cf-detail-row">
                    <strong>Percentage:</strong>
                    <span>{selectedItem.percentage}</span>
                  </div>
                  <div className="cf-detail-row">
                    <strong>Status:</strong>
                    <span>{selectedItem.status ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="cf-detail-row">
                    <strong>Created At:</strong>
                    <span>{selectedItem.createdAt || "-"}</span>
                  </div>
                </div>
              )}

              {(modalType === "edit" || modalType === "add") && (
                <div className="cf-add-form">
                  <div className="cf-form-group">
                    <label>Level</label>
                    <input
                      type="number"
                      name="level"
                      value={formData.level}
                      onChange={handleModalChange}
                      className="cf-input"
                      placeholder="Enter level"
                    />
                  </div>

                  <div className="cf-form-group">
                    <label>Percentage</label>
                    <input
                      type="text"
                      name="percentage"
                      value={formData.percentage}
                      onChange={handleModalChange}
                      className="cf-input"
                      placeholder="Enter percentage"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="cf-modal-footer">
              <button
                className="cf-modal-btn cancel"
                onClick={() => {
                  setShowModal(false);
                  setModalType("");
                  setSelectedItem(null);
                }}
              >
                Cancel
              </button>

              {(modalType === "delete" ||
                modalType === "edit" ||
                modalType === "add") && (
                <button className="cf-modal-btn confirm" onClick={confirmModal}>
                  {modalType === "delete"
                    ? "Delete"
                    : modalType === "edit"
                    ? "Save"
                    : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPopup && <div className="cf-popup">{popupMessage}</div>}
    </div>
  );
};

export default LevelConfig;