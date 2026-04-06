import React from "react";

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-[#142a63] p-5 rounded-xl border border-[#1f3c88] flex justify-between items-center">

      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <h2 className="text-xl font-bold mt-1">{value}</h2>
      </div>

      <div className="bg-linear-to-br from-green-400 to-blue-500 p-3 rounded-lg text-xl">
        {icon}
      </div>

    </div>
  );
};

export default StatCard;