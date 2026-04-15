import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserWithdraw = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [wallets, setWallets] = useState({
    roi: 0,
    level: 0,
    direct: 0,
    reward: 0,
    usdtPrice: 0,
  });

  const [form, setForm] = useState({
    walletType: "",
    currencyType: "",
    amount: "",
  });

  const [errors, setErrors] = useState({});

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = localStorage.getItem("token");

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedHours = String(hours).padStart(2, "0");

    return `${day}/${month}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  };

  const fetchData = async () => {
    try {
      const [summaryRes, withdrawRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setWallets(summaryRes.data);

      const formatted = (withdrawRes.data || []).map((w) => {
  const amount = Number(w.amount || 0);
  const fee = amount * 0.1;
  const approvedUsd = amount - fee;

  return {
    id: w.id,
    currency: w.currency_type,
    transactionId: w.transaction_id || "",
    proof: w.transaction_proof || "",
    request: `$${amount.toFixed(2)}`,
    approved: `₹${Number(w.approved_amount ?? (approvedUsd * 95)).toFixed(2)}`,
    status: w.status,
    date: w.created_at,
  };
});

      setData(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item)
        .join("")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, data]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const getPagination = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(page - 2, 1);
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

  const validate = () => {
    const newErrors = {};
    const amount = Number(form.amount);

    if (!form.walletType) newErrors.walletType = "Wallet required";
    if (!form.currencyType) newErrors.currencyType = "Currency required";

    if (!form.amount) newErrors.amount = "Amount required";
    else if (amount < 20) newErrors.amount = "Minimum $20";
    else {
      const balance = wallets[form.walletType] || 0;
      if (amount > balance) newErrors.amount = "Insufficient balance";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (Object.keys(err).length) return setErrors(err);

    try {
      await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowModal(false);
      setForm({ walletType: "", currencyType: "", amount: "" });
      setErrors({});
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="uwLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="uwContent">
          <div className="uwHeader">
            <h2>Withdraw</h2>
            <button onClick={() => setShowModal(true)}>
              Create Withdraw
            </button>
          </div>

          <div className="uwSearch">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
            />
          </div>

          <div className="uwTableWrapper">
            <table className="uwTable">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>CURRENCY</th>
                  {/* <th>TXN ID</th> */}
                  <th>PROOF</th>
                  <th>REQUEST</th>
                  <th>APPROVED</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8">No data</td>
                  </tr>
                ) : (
                  paginatedData.map((item, i) => (
                    <tr key={item.id}>
                      <td>{(page - 1) * rowsPerPage + i + 1}</td>
                      <td>{item.currency}</td>
                      {/* <td></td> */}
                      <td>
                        {item.proof !== "-" && item.proof}
                        {item.proof !== "-" && item.transactionId !== "-" && " | "}
                        {item.transactionId !== "-" && item.transactionId}
                      </td>
                      <td>{item.request}</td>
                      <td>{item.approved}</td>
                      <td>{item.status}</td>
                      <td>{formatDateTime(item.date)}</td>
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
                {"<"}
              </button>

              {getPagination().map((p, i) =>
                p === "..." ? (
                  <span key={i}>...</span>
                ) : (
                  <button
                    key={i}
                    className={page === p ? "active" : ""}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="uw2Overlay">
          <div className="uw2Modal">
            <div className="uw2Header">
              <h3>Create Withdraw</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="uw2Price">
              Live USDT Price: ${wallets.usdtPrice}
            </div>

            <div className="uw2Stats">
              <div><p>ROI</p><h4>${wallets.roi}</h4></div>
              <div><p>Level</p><h4>${wallets.level}</h4></div>
              <div><p>Direct</p><h4>${wallets.direct}</h4></div>
              {/* <div><p>Reward</p><h4>${wallets.reward}</h4></div> */}
            </div>

            <div className="uw2Form">
              <div className="uw2Field">
                <label>Wallet Type</label>
                <select
                  value={form.walletType}
                  onChange={(e) =>
                    setForm({ ...form, walletType: e.target.value })
                  }
                >
                  <option value="">Select Wallet</option>
                  <option value="roi">ROI (${wallets.roi})</option>
                  <option value="level">Level (${wallets.level})</option>
                  <option value="direct">
                    Direct (${wallets.direct})
                  </option>
                  {/* <option value="reward">Reward (${wallets.reward})</option> */}
                </select>
                <span className="error">{errors.walletType}</span>
              </div>

              <div className="uw2Field">
                <label>Currency</label>
                <select
                  value={form.currencyType}
                  onChange={(e) =>
                    setForm({ ...form, currencyType: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="INR">INR</option>
                  <option value="USDT">USDT</option>
                </select>
                <span className="error">{errors.currencyType}</span>
              </div>

              <div className="uw2Field">
                <label>Amount</label>
                <input
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
                <span className="error">{errors.amount}</span>
              </div>
            </div>

            <div className="uw2Notes">
              <h4>Withdraw Notes</h4>
              <ul>
                <li>Minimum withdrawal is <b>$20</b></li>
                <li>Ensure wallet balance is sufficient</li>
                <li>Approval may take some time</li>
              </ul>
            </div>

            <div className="uw2Footer">
              <button className="uw2Cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="uw2Submit" onClick={handleSubmit}>Create Withdraw</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWithdraw;