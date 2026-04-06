import React, { useState } from 'react';

const Transactions = ({ activeSubMenuItem = 'Deposit' }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  
  // Manual Deposit states
  const [showManualDeposit, setShowManualDeposit] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // Sample users for dropdown
  const [users] = useState([
    { id: 1, name: 'Anusha AVG95530' },
    { id: 2, name: 'KAVERI AVG36402' },
    { id: 3, name: 'Arjunon s AVG15895' },
    { id: 4, name: 'DHAHIRAGANI AVG86673' },
    { id: 5, name: 'NAGARAJAN AVG31182' },
  ]);

  // Sample plans for dropdown
  const [plans] = useState([
    { id: 1, name: 'AVG Super', price: '$100' },
    { id: 2, name: 'AVG Pro', price: '$200' },
    { id: 3, name: 'AVG Premium', price: '$300' },
    { id: 4, name: 'AVG Enterprise', price: '$500' },
  ]);

  // Sample data for Deposit List
  const [depositData, setDepositData] = useState([
    {
      sno: 1,
      fromUser: 'Anusha AVG95530',
      transactionHash: '0x34f4...eb8f',
      planName: 'AVG Super',
      amount: '$100',
      createdAt: '2/3/2026, 9:53:00 pm',
      status: 'pending'
    },
    {
      sno: 2,
      fromUser: 'KAVERI AVG36402',
      transactionHash: '0xa364...0295',
      planName: 'AVG Super',
      amount: '$100',
      createdAt: '2/3/2026, 9:51:48 pm',
      status: 'pending'
    },
    {
      sno: 3,
      fromUser: 'Arjunon s AVG15895',
      transactionHash: '0xd643...fa85',
      planName: 'AVG Super',
      amount: '$100',
      createdAt: '2/3/2026, 5:03:37 am',
      status: 'completed'
    },
    {
      sno: 4,
      fromUser: 'DHAHIRAGANI AVG86673',
      transactionHash: '0x6048...a270',
      planName: 'AVG Super',
      amount: '$100',
      createdAt: '2/3/2026, 4:25:42 am',
      status: 'completed'
    },
    {
      sno: 5,
      fromUser: 'NAGARAJAN AVG31182',
      transactionHash: '0x494...21f6',
      planName: 'AVG Super',
      amount: '$200',
      createdAt: '2/3/2026, 2:58:28 am',
      status: 'completed'
    }
  ]);

  // Sample data for Withdraw List
  const [withdrawData, setWithdrawData] = useState([
    {
      sno: 1,
      user: 'Thajudin AVG57494',
      walletType: 'Level Wallet Amount',
      requestAmount: '₹209',
      transactionProof: 'RefNo.939805045',
      status: 'APPROVED',
      createdAt: '2/3/2026, 6:34:07 am'
    },
    {
      sno: 2,
      user: 'DINESH AVG32752',
      walletType: 'Direct Referral Wallet Amount',
      requestAmount: '₹110',
      transactionProof: 'T2603021531151432001416',
      status: 'APPROVED',
      createdAt: '2/3/2026, 1:12:45 am'
    },
    {
      sno: 3,
      user: 'DINESH AVG32752',
      walletType: 'Level Wallet Amount',
      requestAmount: '₹110',
      transactionProof: 'T2603021531151432001416',
      status: 'APPROVED',
      createdAt: '1/3/2026, 9:50:48 pm'
    },
    {
      sno: 4,
      user: 'Manikandan AVG03389',
      walletType: 'Roi Wallet Amount',
      requestAmount: '₹49.5',
      transactionProof: 'T2603021530157101747753',
      status: 'APPROVED',
      createdAt: '28/2/2026, 6:17:52 pm'
    },
    {
      sno: 5,
      user: 'KAMARAJ A AVG46322',
      walletType: 'Direct Referral Wallet Amount',
      requestAmount: '₹50',
      transactionProof: 'RefNo.938827313',
      status: 'APPROVED',
      createdAt: '28/2/2026, 4:58:08 am'
    }
  ]);

  // Sample data for Transaction List (All Transactions)
  const [transactionListData, setTransactionListData] = useState([
    {
      sno: 1,
      fromUser: 'Anusha AVG95530',
      toUser: 'AGILANVASUDEVAN AVG26949',
      type: 'Level 4 Income',
      amount: '$2.5',
      createdAt: '2/3/2026, 9:53:00 pm'
    },
    {
      sno: 2,
      fromUser: 'Anusha AVG95530',
      toUser: 'KAVERI AVG36402',
      type: 'Level 1 Income',
      amount: '$5',
      createdAt: '2/3/2026, 9:53:00 pm'
    },
    {
      sno: 3,
      fromUser: 'Anusha AVG95530',
      toUser: 'KAVERI AVG36402',
      type: 'Direct Referral Income',
      amount: '$5',
      createdAt: '2/3/2026, 9:53:00 pm'
    },
    {
      sno: 4,
      fromUser: 'Anusha AVG95530',
      toUser: 'Admin AVG83331',
      type: 'Deposit',
      amount: '$100',
      createdAt: '2/3/2026, 9:53:00 pm'
    },
    {
      sno: 5,
      fromUser: 'KAVERI AVG36402',
      toUser: 'AGILANVASUDEVAN AVG26949',
      type: 'Level 3 Income',
      amount: '$3',
      createdAt: '2/3/2026, 9:51:49 pm'
    }
  ]);

  // Show popup message
  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  // Action handlers
  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setModalType('edit');
    setShowModal(true);
  };

  const handleApprove = (transaction) => {
    const updatedData = withdrawData.map(item => {
      if (item.sno === transaction.sno) {
        showPopupMessage(`Withdrawal for ${item.user} approved`);
        return {
          ...item,
          status: 'APPROVED'
        };
      }
      return item;
    });
    setWithdrawData(updatedData);
  };

  const handleReject = (transaction) => {
    const updatedData = withdrawData.map(item => {
      if (item.sno === transaction.sno) {
        showPopupMessage(`Withdrawal for ${item.user} rejected`);
        return {
          ...item,
          status: 'REJECTED'
        };
      }
      return item;
    });
    setWithdrawData(updatedData);
  };

  const handleDelete = (transaction) => {
    setSelectedTransaction(transaction);
    setModalType('delete');
    setShowModal(true);
  };

  // Manual Deposit handlers
  const handleManualDeposit = () => {
    setShowManualDeposit(true);
  };

  const handleCancelDeposit = () => {
    setShowManualDeposit(false);
    setSelectedUser('');
    setSelectedPlan('');
    setDepositAmount('');
  };

  const handleBuyNow = () => {
    if (!selectedUser || !selectedPlan || !depositAmount) {
      showPopupMessage('Please fill all fields');
      return;
    }

    // Create new deposit entry
    const newDeposit = {
      sno: depositData.length + 1,
      fromUser: selectedUser,
      transactionHash: `0x${Math.random().toString(36).substr(2, 9)}...`,
      planName: plans.find(p => p.id === parseInt(selectedPlan))?.name || 'Unknown Plan',
      amount: `$${depositAmount}`,
      createdAt: new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      }).replace(',', ''),
      status: 'pending'
    };

    setDepositData([newDeposit, ...depositData]);
    showPopupMessage('Manual deposit created successfully');
    handleCancelDeposit();
  };

  // Modal action confirm
  const handleModalConfirm = () => {
    if (modalType === 'delete' && selectedTransaction) {
      if (activeSubMenuItem === 'Deposit') {
        const updatedData = depositData.filter(item => item.sno !== selectedTransaction.sno);
        setDepositData(updatedData);
      } else if (activeSubMenuItem === 'Withdraw') {
        const updatedData = withdrawData.filter(item => item.sno !== selectedTransaction.sno);
        setWithdrawData(updatedData);
      } else if (activeSubMenuItem === 'All Transactions') {
        const updatedData = transactionListData.filter(item => item.sno !== selectedTransaction.sno);
        setTransactionListData(updatedData);
      }
      showPopupMessage(`Transaction deleted successfully`);
    } else if (modalType === 'edit' && selectedTransaction) {
      showPopupMessage(`Transaction updated successfully`);
    }
    setShowModal(false);
    setSelectedTransaction(null);
  };

  // Get current data based on active submenu, search, and pagination
  const getCurrentData = () => {
    let data = [];
    switch(activeSubMenuItem) {
      case 'Deposit':
        data = depositData;
        break;
      case 'Withdraw':
        data = withdrawData;
        break;
      case 'All Transactions':
        data = transactionListData;
        break;
      default:
        data = depositData;
    }

    // Filter based on search term
    const filteredData = data.filter(item => {
      const searchString = searchTerm.toLowerCase();
      if (activeSubMenuItem === 'Deposit') {
        return item.fromUser.toLowerCase().includes(searchString) ||
               item.transactionHash.toLowerCase().includes(searchString) ||
               item.planName.toLowerCase().includes(searchString);
      } else if (activeSubMenuItem === 'Withdraw') {
        return item.user.toLowerCase().includes(searchString) ||
               item.walletType.toLowerCase().includes(searchString) ||
               item.transactionProof.toLowerCase().includes(searchString);
      } else if (activeSubMenuItem === 'All Transactions') {
        return item.fromUser.toLowerCase().includes(searchString) ||
               item.toUser.toLowerCase().includes(searchString) ||
               item.type.toLowerCase().includes(searchString);
      }
      return true;
    });

    return filteredData;
  };

  // Pagination logic
  const filteredData = getCurrentData();
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const renderManualDepositForm = () => (
    <div className="tx-manual-deposit-form">
      <h3>Manual Deposit</h3>
      
      <div className="tx-form-group">
        <label>Select User:</label>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          className="tx-select"
        >
          <option value="">-- Select User --</option>
          {users.map(user => (
            <option key={user.id} value={user.name}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tx-form-group">
        <label>Select Plan:</label>
        <select 
          value={selectedPlan} 
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="tx-select"
        >
          <option value="">-- Select Plan --</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - {plan.price}
            </option>
          ))}
        </select>
      </div>

      <div className="tx-form-group">
        <label>Amount ($):</label>
        <input 
          type="number" 
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Enter amount"
          className="tx-input"
          min="1"
        />
      </div>

      <div className="tx-form-actions">
        <button className="tx-btn-cancel" onClick={handleCancelDeposit}>
          Cancel
        </button>
        <button className="tx-btn-buy" onClick={handleBuyNow}>
          Buy Now
        </button>
      </div>
    </div>
  );

  const renderDepositTable = () => (
    <div className="tx-table-container">
      <div className="tx-table-header">
        <h2 className="tx-table-title">Deposit List</h2>
        <div className="tx-header-actions">
          <button 
            className="tx-manual-deposit-btn"
            onClick={handleManualDeposit}
          >
            + Manual Deposit
          </button>
          <div className="tx-search-box">
            <input 
              type="text" 
              placeholder="Search by user, hash, or plan..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>
      
      {showManualDeposit && renderManualDepositForm()}

      <div className="tx-table-responsive">
        <table className="tx-data-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TRANSACTION HASH</th>
              <th>PLAN NAME</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.sno}>
                <td>{item.sno}</td>
                <td>{item.fromUser}</td>
                <td className="tx-hash">
                  {item.transactionHash} <span className="tx-emoji">🚫</span>
                </td>
                <td>{item.planName}</td>
                <td>{item.amount}</td>
                <td>{item.createdAt}</td>
                <td>
                  <div className="tx-actions-dropdown">
                    <button className="tx-action-btn">⋮</button>
                    <div className="tx-actions-menu">
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
                <td colSpan="7" className="tx-no-data">No deposits found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="tx-table-footer">
        <div className="tx-rows-selector">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="tx-rows-info">
            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
          </span>
        </div>
        <div className="tx-pagination">
          <button 
            className="tx-page-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >Previous</button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`tx-page-btn ${currentPage === i + 1 ? 'tx-active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            className="tx-page-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >Next</button>
        </div>
      </div>
    </div>
  );

  const renderWithdrawTable = () => (
    <div className="tx-table-container">
      <div className="tx-table-header">
        <h2 className="tx-table-title">Withdraw List</h2>
        <div className="tx-search-box">
          <input 
            type="text" 
            placeholder="Search by user, wallet type, or proof..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="tx-table-responsive">
        <table className="tx-data-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USER</th>
              <th>WALLET TYPE</th>
              <th>REQUEST AMOUNT</th>
              <th>TRANSACTION PROOF</th>
              <th>STATUS</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.sno}>
                <td>{item.sno}</td>
                <td>{item.user}</td>
                <td>{item.walletType}</td>
                <td>{item.requestAmount}</td>
                <td className="tx-proof">{item.transactionProof}</td>
                <td>
                  <span className={`tx-status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.createdAt}</td>
                <td>
                  <div className="tx-actions-dropdown">
                    <button className="tx-action-btn">⋮</button>
                    <div className="tx-actions-menu">
                      <button onClick={() => handleView(item)}>👁️ View</button>
                      <button onClick={() => handleEdit(item)}>✏️ Edit</button>
                      <button onClick={() => handleApprove(item)}>✅ Approve</button>
                      <button onClick={() => handleReject(item)}>❌ Reject</button>
                      <button onClick={() => handleDelete(item)}>🗑️ Delete</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan="8" className="tx-no-data">No withdrawals found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="tx-table-footer">
        <div className="tx-rows-selector">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="tx-rows-info">
            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
          </span>
        </div>
        <div className="tx-pagination">
          <button 
            className="tx-page-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >Previous</button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`tx-page-btn ${currentPage === i + 1 ? 'tx-active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            className="tx-page-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >Next</button>
        </div>
      </div>
    </div>
  );

  const renderTransactionListTable = () => (
    <div className="tx-table-container">
      <div className="tx-table-header">
        <h2 className="tx-table-title">Transaction List</h2>
        <div className="tx-search-box">
          <input 
            type="text" 
            placeholder="Search by user or type..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="tx-table-responsive">
        <table className="tx-data-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TO USER</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.sno}>
                <td>{item.sno}</td>
                <td>{item.fromUser}</td>
                <td>{item.toUser}</td>
                <td>
                  <span className="tx-type-badge">{item.type}</span>
                </td>
                <td>{item.amount}</td>
                <td>{item.createdAt}</td>
                <td>
                  <div className="tx-actions-dropdown">
                    <button className="tx-action-btn">⋮</button>
                    <div className="tx-actions-menu">
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
                <td colSpan="7" className="tx-no-data">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="tx-table-footer">
        <div className="tx-rows-selector">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="tx-rows-info">
            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
          </span>
        </div>
        <div className="tx-pagination">
          <button 
            className="tx-page-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >Previous</button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`tx-page-btn ${currentPage === i + 1 ? 'tx-active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            className="tx-page-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >Next</button>
        </div>
      </div>
    </div>
  );

  // Render modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="tx-modal-overlay">
        <div className="tx-modal">
          <div className="tx-modal-header">
            <h3>
              {modalType === 'delete' ? 'Confirm Delete' : 
               modalType === 'edit' ? 'Edit Transaction' : 
               'Transaction Details'}
            </h3>
            <button className="tx-modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          <div className="tx-modal-body">
            {modalType === 'delete' && (
              <p>Are you sure you want to delete this transaction?</p>
            )}
            {modalType === 'edit' && selectedTransaction && (
              <div className="tx-edit-form">
                {Object.entries(selectedTransaction).map(([key, value]) => {
                  if (key === 'sno' || key === 'createdAt') return null;
                  return (
                    <div key={key} className="tx-form-group">
                      <label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</label>
                      <input 
                        type="text" 
                        defaultValue={value}
                        className="tx-input"
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {modalType === 'view' && selectedTransaction && (
              <div className="tx-view-details">
                {Object.entries(selectedTransaction).map(([key, value]) => (
                  <div key={key} className="tx-detail-row">
                    <strong>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</strong> 
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="tx-modal-footer">
            <button className="tx-modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
            {(modalType === 'delete' || modalType === 'edit') && (
              <button className="tx-modal-btn confirm" onClick={handleModalConfirm}>
                {modalType === 'delete' ? 'Delete' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render popup
  const renderPopup = () => {
    if (!showPopup) return null;
    return (
      <div className="tx-popup">
        {popupMessage}
      </div>
    );
  };

  // Render based on active submenu item
  const renderContent = () => {
    switch(activeSubMenuItem) {
      case 'Deposit':
        return renderDepositTable();
      case 'Withdraw':
        return renderWithdrawTable();
      case 'All Transactions':
        return renderTransactionListTable();
      default:
        return renderDepositTable();
    }
  };

  return (
    <div className="tx-main-content">
      {/* Page Header */}
      <div className="tx-page-header">
        <h1 className="tx-page-title">Transactions</h1>
        <p className="tx-page-subtitle">{activeSubMenuItem} Management</p>
      </div>

      {/* Dynamic Content */}
      {renderContent()}
      
      {/* Modal and Popup */}
      {renderModal()}
      {renderPopup()}
    </div>
  );
};

export default Transactions;