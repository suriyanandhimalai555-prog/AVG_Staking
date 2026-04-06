import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

const UserBank = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [bankData, setBankData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    upiId: "",
    gpayNumber: "",
  });

  const [loading, setLoading] = useState(false);

  // ================= FETCH =================
  const fetchBank = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/my-bank`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBankData(res.data);

      if (res.data) {
        setFormData({
          accountHolderName: res.data.account_holder_name || "",
          bankName: res.data.bank_name || "",
          accountNumber: res.data.account_number || "",
          ifscCode: res.data.ifsc_code || "",
          branch: res.data.branch || "",
          upiId: res.data.upi_id || "",
          gpayNumber: res.data.gpay_number || "",
        });
      }

    } catch (err) {
      console.log("No bank data");
    }
  };

  useEffect(() => {
    fetchBank();
  }, []);

  // ================= CHANGE =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= SAVE =================
  const handleSave = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(`${API}/my-bank`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Bank details saved");

      setShowModal(false);
      fetchBank();

    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ubLayout">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="ubContainer">

          {/* HEADER */}
          <div className="ubHeader">
            <h2>Bank Details</h2>
            <p>Add your bank or UPI details for withdrawals</p>

            <button
              className="primary"
              onClick={() => setShowModal(true)}
            >
              {bankData ? "Edit Details" : "Add Details"}
            </button>
          </div>

          {/* ================= VIEW MODE ================= */}
          {bankData ? (
            <div className="ubViewCard">

              <div className="ubViewHeader">
                <h3>Bank Information</h3>
                <span className="ubStatus">Saved</span>
              </div>

              <div className="ubViewGrid">

                <div className="ubItem">
                  <p>Account Holder</p>
                  <h4>{bankData.account_holder_name}</h4>
                </div>

                <div className="ubItem">
                  <p>Bank Name</p>
                  <h4>{bankData.bank_name}</h4>
                </div>

                <div className="ubItem">
                  <p>Account Number</p>
                  <h4>****{bankData.account_number?.slice(-4)}</h4>
                </div>

                <div className="ubItem">
                  <p>IFSC Code</p>
                  <h4>{bankData.ifsc_code}</h4>
                </div>

                <div className="ubItem">
                  <p>Branch</p>
                  <h4>{bankData.branch}</h4>
                </div>

                <div className="ubItem">
                  <p>UPI ID</p>
                  <h4>{bankData.upi_id || "-"}</h4>
                </div>

                <div className="ubItem">
                  <p>GPay, PhonePe, Paytm Number</p>
                  <h4>{bankData.gpay_number || "-"}</h4>
                </div>

              </div>

            </div>
          ) : (
            <div className="ubEmptyState">
              {/* <p>No bank details added yet</p>
              <button className="primary" onClick={() => setShowModal(true)}>
                Add Bank Details
              </button> */}
            </div>
          )}

        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="modalOverlay">

          <div className="modalBox modalWide">

            <div className="modalHeader">
              <h3>{bankData ? "Edit Bank Details" : "Add Bank Details"}</h3>
              <button className="modalClose" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalGrid">

              <div className="modalCard">
                <h4>BANK INFORMATION</h4>

                <Input name="accountHolderName" label="Account Holder Name" value={formData.accountHolderName} onChange={handleChange} />
                <Input name="bankName" label="Bank Name" value={formData.bankName} onChange={handleChange} />
                <Input name="accountNumber" label="Account Number" value={formData.accountNumber} onChange={handleChange} />
                <Input name="ifscCode" label="IFSC Code" value={formData.ifscCode} onChange={handleChange} />
                <Input name="branch" label="Branch" value={formData.branch} onChange={handleChange} />
              </div>

              <div className="modalCard">
                <h4>UPI INFORMATION</h4>

                <Input name="upiId" label="UPI ID" value={formData.upiId} onChange={handleChange} />
                <Input
                  name="gpayNumber"
                  label="GPay, PhonePe, Paytm Number"
                  value={formData.gpayNumber}
                  onChange={handleChange}
                />

                <div className="ubWarning">
                  ⚠ Ensure your UPI ID is valid.
                </div>
              </div>

            </div>

            <div className="modalFooter">
              <button onClick={() => setShowModal(false)}>Cancel</button>

              <button className="primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

/* COMPONENTS */
const Input = ({ label, name, value, onChange }) => (
  <div className="ubField">
    <label>{label}</label>
    <input name={name} value={value} onChange={onChange} />
  </div>
);

const Row = ({ label, value }) => (
  <div className="ubRow">
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

export default UserBank;