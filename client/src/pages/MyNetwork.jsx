import React, { useState, useEffect } from "react";
import Tree from "react-d3-tree";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import axios from "axios";
import toast from "react-hot-toast";

const MyNetwork = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [treeData, setTreeData] = useState(null);

  const API = `${import.meta.env.VITE_APP_BASE_URL}/api/users`;

  // ===== FORMAT TREE =====
  const formatTree = (node) => {
    if (!node) return null;

    return {
      name: node.name || "User",
      attributes: {
        userCode: node.user_code,
        wallet: `₹${Number(node.wallet || 0).toFixed(2)}`,
      },
      children: node.children?.map(formatTree) || [],
    };
  };

  // ===== FETCH =====
  const fetchNetwork = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/my-network`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTreeData(formatTree(res.data));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load network");
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  return (
    <div className="networkLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="networkMain">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="networkContent">
          <h2 className="pageTitle">My Network</h2>

          {treeData ? (
            <Tree
              data={treeData}
              orientation="vertical"
              pathFunc="step"
              zoomable
              draggable
              collapsible
              separation={{ siblings: 1.5, nonSiblings: 2 }}
              nodeSize={{ x: 220, y: 140 }}
              translate={{ x: window.innerWidth / 2, y: 120 }}
              renderCustomNodeElement={({ nodeDatum }) => (
                <g>
                  <foreignObject x="-90" y="-45" width="180" height="100">
                    <div className="nodeCard">
                      <div className="nodeHeader">
                        <div className="avatar">
                          {nodeDatum.name?.charAt(0)?.toUpperCase()}
                        </div>

                        <div className="nodeText">
                          <div className="name">{nodeDatum.name}</div>
                          <div className="id">{nodeDatum.attributes?.userCode}</div>
                        </div>
                      </div>

                      <div className="wallet" style={{ marginTop: "10px", color: "#555" }}>
                        Deposit: {nodeDatum.attributes?.wallet}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )}
            />
          ) : (
            <p className="loadingText">Loading network...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNetwork;