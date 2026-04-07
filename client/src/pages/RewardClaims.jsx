import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const RewardClaims = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [monthSavingId, setMonthSavingId] = useState("");
  const [closingId, setClosingId] = useState("");
  const [form, setForm] = useState({});
  const [monthForm, setMonthForm] = useState({});

  const token = localStorage.getItem("token");

  const api = useMemo(() => {
    return axios.create({
      baseURL:
        import.meta.env.VITE_API_URL ||
        `${import.meta.env.VITE_APP_BASE_URL}/api`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ranks/claims/admin");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const keyOf = (row) => `${row.user_id}-${row.reward}-${row.target_amount}`;

  const handleChange = (key, field, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleMonthChange = (monthId, field, value) => {
    setMonthForm((prev) => ({
      ...prev,
      [monthId]: {
        ...(prev[monthId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (row) => {
    if (row.claim_status === "closed") return;

    const key = keyOf(row);
    const current = form[key] || {};

    try {
      setSavingKey(key);

      await api.post("/ranks/claims", {
        userId: row.user_id,
        reward: row.reward,
        target_amount: row.target_amount,
        monthly_amount: current.monthly_amount ?? row.monthly_amount,
        months_count: current.months_count ?? row.months_count ?? 12,
        start_date:
          current.start_date ??
          row.start_date ??
          new Date().toISOString().slice(0, 10),
      });

      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Error saving");
    } finally {
      setSavingKey("");
    }
  };

  const handleCloseClaim = async (row) => {
    if (!row.claim_id || row.claim_status === "closed") return;

    try {
      setClosingId(row.claim_id);

      await api.post("/ranks/claims/close", {
        claimId: row.claim_id,
      });

      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Error closing claim");
    } finally {
      setClosingId("");
    }
  };

  const handleMonthSave = async (monthId) => {
    const current = monthForm[monthId] || {};

    try {
      setMonthSavingId(monthId);

      await api.post("/ranks/claims/month-status", {
        monthId,
        transaction_id: current.transaction_id || "",
        status: current.status || "completed",
      });

      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Error updating month");
    } finally {
      setMonthSavingId("");
    }
  };

  return (
    <div className="rc-container">
      <h2 className="rc-title">Reward Claims</h2>

      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#999" }}>No data available</p>
      ) : (
        <div className="rc-card-container">
          {rows.map((row) => {
            const key = keyOf(row);
            const local = form[key] || {};
            const isClosed = row.claim_status === "closed";

            return (
              <div className="rc-card" key={key}>
                <div className="rc-card-header">
                  <div>
                    <h3>{row.reward}</h3>
                    <p>
                      {row.name} {row.lastname}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div className="rc-target">₹{row.target_amount}</div>

                    <span
                      className={`statusBadge ${
                        isClosed ? "rejected" : "approved"
                      }`}
                    >
                      {isClosed ? "Closed" : "Active"}
                    </span>

                    {!isClosed && row.claim_id > 0 && (
                      <button
                        className="rc-save-btn"
                        onClick={() => handleCloseClaim(row)}
                        disabled={closingId === row.claim_id}
                        style={{ background: "#b91c1c" }}
                      >
                        {closingId === row.claim_id ? "Closing..." : "Close Process"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="rc-card-form">
                  <div className="rc-field">
                    <label>Monthly</label>
                    <input
                      className="rc-input"
                      type="number"
                      value={local.monthly_amount ?? row.monthly_amount ?? ""}
                      onChange={(e) =>
                        handleChange(key, "monthly_amount", e.target.value)
                      }
                      disabled={isClosed}
                    />
                  </div>

                  <div className="rc-field">
                    <label>Start</label>
                    <input
                      className="rc-input"
                      type="date"
                      value={local.start_date ?? row.start_date ?? ""}
                      onChange={(e) =>
                        handleChange(key, "start_date", e.target.value)
                      }
                      disabled={isClosed}
                    />
                  </div>

                  <div className="rc-field">
                    <label>Months</label>
                    <input
                      className="rc-input"
                      type="number"
                      value={local.months_count ?? row.months_count ?? 12}
                      onChange={(e) =>
                        handleChange(key, "months_count", e.target.value)
                      }
                      disabled={isClosed}
                    />
                  </div>

                  <button
                    className="rc-save-btn"
                    onClick={() => handleSave(row)}
                    disabled={savingKey === key || isClosed}
                  >
                    {isClosed
                      ? "Closed"
                      : savingKey === key
                      ? "Saving..."
                      : "Save"}
                  </button>
                </div>

                {row.claim_months && row.claim_months.length > 0 && (
                  <div className="rc-month-box">
                    <table className="rc-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Txn</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>

                      <tbody>
                        {row.claim_months.map((m) => {
                          const monthLocal = monthForm[m.id] || {};
                          const monthStatus = m.status || "pending";

                          return (
                            <tr key={m.id}>
                              <td>{m.month_no}</td>

                              <td>
                                {m.due_date
                                  ? new Date(m.due_date).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "-"}
                              </td>

                              <td>₹{m.amount}</td>

                              <td>
                                <input
                                  className="rc-input rc-input-wide"
                                  value={
                                    monthLocal.transaction_id ??
                                    m.transaction_id ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleMonthChange(
                                      m.id,
                                      "transaction_id",
                                      e.target.value
                                    )
                                  }
                                  disabled={isClosed && monthStatus === "stopped"}
                                />
                              </td>

                              <td>
                                <select
                                  className="rc-select"
                                  value={monthLocal.status ?? monthStatus}
                                  onChange={(e) =>
                                    handleMonthChange(
                                      m.id,
                                      "status",
                                      e.target.value
                                    )
                                  }
                                  disabled={isClosed && monthStatus === "stopped"}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="completed">Completed</option>
                                  {monthStatus === "stopped" && (
                                    <option value="stopped">Stopped</option>
                                  )}
                                </select>
                              </td>

                              <td>
                                <button
                                  className="rc-update-btn"
                                  onClick={() => handleMonthSave(m.id)}
                                  disabled={
                                    monthSavingId === m.id ||
                                    (isClosed && monthStatus === "stopped")
                                  }
                                >
                                  {monthSavingId === m.id ? "Saving..." : "Update"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RewardClaims;