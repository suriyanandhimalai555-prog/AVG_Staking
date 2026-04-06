import React from "react";

const SectionCard = ({ title, children }) => {
  return (
    <div className="section-card">
      <h3 className="section-card-title">{title}</h3>
      {children}
    </div>
  );
};

export default SectionCard;