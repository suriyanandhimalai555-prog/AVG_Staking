import React from "react";

const StatCard = ({ title, value, small }) => {
  return (
    <div className={`stat-card ${small ? "small" : ""}`}>
      <p className="card-title">{title}</p>
      <h3 className="card-value">{value}</h3>
    </div>
  );
};

export default StatCard;