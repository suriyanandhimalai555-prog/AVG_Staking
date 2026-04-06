import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const RewardClaims = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [monthSavingId, setMonthSavingId] = useState("");
  const [form, setForm] = useState({});
  const [monthForm, setMonthForm] = useState({});

  const token = localStorage.getItem("token");

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ranks/claims/admin");
      console.log("DATA:", res.data); // DEBUG
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

  const keyOf = (row) =>
    `${row.user_id}-${row.reward}-${row.target_amount}`;

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
      alert("Error saving");
    } finally {
      setSavingKey("");
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
      alert("Error updating month");
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

            return (
              <div className="rc-card" key={key}>

                {/* HEADER */}
                <div className="rc-card-header">
                  <div>
                    <h3>{row.reward}</h3>
                    <p>
                      {row.name} {row.lastname}
                    </p>
                  </div>

                  <div className="rc-target">
                    ₹{row.target_amount}
                  </div>
                </div>

                {/* FORM */}
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
                    />
                  </div>

                  <button
                    className="rc-save-btn"
                    onClick={() => handleSave(row)}
                    disabled={savingKey === key}
                  >
                    {savingKey === key ? "Saving..." : "Save"}
                  </button>
                </div>

                {/* MONTH TABLE */}
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

                          return (
                            <tr key={m.id}>
                              <td>{m.month_no}</td>

                              <td>
                                {m.due_date
                                  ? new Date(m.due_date).toLocaleDateString("en-IN")
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
                                />
                              </td>

                              <td>
                                <select
                                  className="rc-select"
                                  value={monthLocal.status ?? m.status ?? "pending"}
                                  onChange={(e) =>
                                    handleMonthChange(
                                      m.id,
                                      "status",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="pending">Pending</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </td>

                              <td>
                                <button
                                  className="rc-update-btn"
                                  onClick={() => handleMonthSave(m.id)}
                                >
                                  Update
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