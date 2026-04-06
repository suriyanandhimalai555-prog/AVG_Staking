import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const API = "http://localhost:5000/api/users";

const UserSupportTicket = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [data, setData] = useState([]);

  const [formData, setFormData] = useState({
    shortDesc: "",
    description: "",
  });

  // ================= FETCH =================
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/my-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ================= INPUT CHANGE =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= CREATE =================
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(`${API}/tickets`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Ticket created");

      setShowModal(false);
      setFormData({ shortDesc: "", description: "" });

      fetchTickets();

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="ustLayout">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="ustContent">

          {/* HEADER */}
          <div className="ustHeader">
            <h2>Support Tickets</h2>
            <button
              className="ustCreateBtn"
              onClick={() => setShowModal(true)}
            >
              Create Ticket
            </button>
          </div>

          {/* SEARCH */}
          <div className="ustSearch">
            <input placeholder="Search..." />
          </div>

          {/* TABLE */}
          <div className="ustTableWrapper">
            <table className="ustTable">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>TICKET ID</th>
                  <th>SHORT DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>CREATED AT</th>
                  {/* <th>ACTIONS</th> */}
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="ustEmpty">
                      No available options
                    </td>
                  </tr>
                ) : (
                  data.map((item, i) => (
                    <tr key={item.id}>
                      <td>{i + 1}</td>
                      <td>{item.ticket_id}</td>
                      <td>{item.short_desc}</td>
                      <td className="ustStatus">{item.status}</td>
                      <td>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      {/* <td>⋮</td> */}
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
              <select>
                <option>10</option>
                <option>25</option>
              </select>
            </div>

            <div className="usrDeposit__pagination">
              <button>{"< Prev"}</button>
              <button className="active">1</button>
              <button>{"Next >"}</button>
            </div>
          </div>

        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="ustModalOverlay">
          <div className="ustModal">

            <div className="ustModalHeader">
              <div>
                <h3>Create Support Ticket</h3>
                <p className="ustSubText">Describe your issue clearly</p>
              </div>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="ustModalBody">

              <div className="ustField">
                <label>Short Description</label>
                <input
                  name="shortDesc"
                  value={formData.shortDesc}
                  onChange={handleChange}
                  placeholder="Enter short title..."
                />
              </div>

              <div className="ustField">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Explain your issue in detail..."
                />
              </div>

              <div className="ustField">
                <label>Attachment</label>
                <div className="ustUploadBox">
                  <input type="file" disabled />
                  <span>Upload screenshot / proof</span>
                </div>
              </div>

            </div>

            <div className="ustModalFooter">
              <button
                className="ustCancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button className="primary" onClick={handleSubmit}>
                Submit Ticket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UserSupportTicket;