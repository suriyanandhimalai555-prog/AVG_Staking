// Earnings.jsx
import React, { useState, useEffect } from 'react';


const Earnings = ({ activeEarningType = 'ROI' }) => {
  const [activeTab, setActiveTab] = useState(activeEarningType.toLowerCase());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setActiveTab(activeEarningType.toLowerCase());
    setCurrentPage(1); // Reset page when tab changes
  }, [activeEarningType]);

  // ROI Income Data
  const roiData = [
    { sno: 1, fromUser: 'Admin AV683331', toUser: 'AGILANVASUDEVAN AVG26949', type: 'Daily ROI Income', amount: '$5', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 2, fromUser: 'Admin AV683331', toUser: 'Arjunan s AVG15895', type: 'Daily ROI Income', amount: '$0.5', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 3, fromUser: 'Admin AV683331', toUser: 'THANGAM AVG34378', type: 'Daily ROI Income', amount: '$15', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 4, fromUser: 'Admin AV683331', toUser: 'DHAHIRAGANI AVG86673', type: 'Daily ROI Income', amount: '$0.5', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 5, fromUser: 'Admin AV683331', toUser: 'NAGARAJAN AVG31882', type: 'Daily ROI Income', amount: '$1', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 6, fromUser: 'Admin AV683331', toUser: 'RAMESH AVG63596', type: 'Daily ROI Income', amount: '$1', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 7, fromUser: 'Admin AV683331', toUser: 'Venkatesan AVG02607', type: 'Daily ROI Income', amount: '$0.5', createdAt: '2/3/2026, 10:20:04 am' },
    { sno: 8, fromUser: 'Admin AV683331', toUser: 'SIVAKANTHAN AVG30847', type: 'Daily ROI Income', amount: '$0.5', createdAt: '2/3/2026, 10:20:04 am' }
  ];

  // Direct Income Data
  const directData = [
    { sno: 1, fromUser: 'Anusha AVG95530', toUser: 'KAVERI AVG36402', type: 'Direct Referral Income', amount: '$5', createdAt: '2/3/2026, 9:53:00 pm' },
    { sno: 2, fromUser: 'KAVERI AVG36402', toUser: 'Hishan AVG50060', type: 'Direct Referral Income', amount: '$5', createdAt: '2/3/2026, 9:51:49 pm' },
    { sno: 3, fromUser: 'Arjunan s AVG15895', toUser: 'C.PERUMAL AVG38406', type: 'Direct Referral Income', amount: '$5', createdAt: '2/3/2026, 5:03:37 am' },
    { sno: 4, fromUser: 'DHAHIRAGANI AVG86673', toUser: 'THANGAM AVG34378', type: 'Direct Referral Income', amount: '$5', createdAt: '2/3/2026, 4:25:42 am' },
    { sno: 5, fromUser: 'NAGARAJAN AVG31182', toUser: 'MARIMUTHU AVG96919', type: 'Direct Referral Income', amount: '$10', createdAt: '2/3/2026, 2:58:28 am' },
    { sno: 6, fromUser: 'RAMESH AVG63596', toUser: 'THANGAM AVG34378', type: 'Direct Referral Income', amount: '$10', createdAt: '2/3/2026, 1:43:37 am' },
    { sno: 7, fromUser: 'Venkatesan AVG02607', toUser: 'S SARATHY AVG43919', type: 'Direct Referral Income', amount: '$5', createdAt: '2/3/2026, 1:25:13 am' },
    { sno: 8, fromUser: 'SIVAKANTHAN AVG30847', toUser: 'MARIMUTHU AVG96919', type: 'Direct Referral Income', amount: '$5', createdAt: '1/3/2026, 11:52:44 pm' }
  ];

  // Level Income Data
  const levelData = [
    { sno: 1, fromUser: 'Anusha AVG95530', toUser: 'AGILANVASUDEVAN AVG26949', type: 'Level 4 Income', amount: '$2.5', createdAt: '2/3/2026, 9:53:00 pm' },
    { sno: 2, fromUser: 'Anusha AVG95530', toUser: 'KAVERI AVG36402', type: 'Level 1 Income', amount: '$5', createdAt: '2/3/2026, 9:53:00 pm' },
    { sno: 3, fromUser: 'KAVERI AVG36402', toUser: 'AGILANVASUDEVAN AVG26949', type: 'Level 3 Income', amount: '$3', createdAt: '2/3/2026, 9:51:49 pm' },
    { sno: 4, fromUser: 'KAVERI AVG36402', toUser: 'Hilshan AVG50060', type: 'Level 1 Income', amount: '$5', createdAt: '2/3/2026, 9:51:49 pm' },
    { sno: 5, fromUser: 'Arjunan s AVG51895', toUser: 'AGILANVASUDEVAN AVG26949', type: 'Level 2 Income', amount: '$4', createdAt: '2/3/2026, 5:03:37 am' },
    { sno: 6, fromUser: 'Arjunan s AVG51895', toUser: 'C.PERUMAL AVG38406', type: 'Level 1 Income', amount: '$5', createdAt: '2/3/2026, 5:03:37 am' },
    { sno: 7, fromUser: 'DHAHIRAGANI AVG86673', toUser: 'AGILANVASUDEVAN AVG26949', type: 'Level 2 Income', amount: '$4', createdAt: '2/3/2026, 4:25:42 am' },
    { sno: 8, fromUser: 'DHAHIRAGANI AVG86673', toUser: 'THANGAM AVG34378', type: 'Level 1 Income', amount: '$5', createdAt: '2/3/2026, 4:25:42 am' }
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setIsDropdownOpen(false);
    setCurrentPage(1); // Reset page when tab changes
    setSearchTerm(''); // Optional: reset search when tab changes
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'roi': return 'My ROI Income';
      case 'direct': return 'My Direct Income';
      case 'level': return 'My Level Income';
      default: return 'My ROI Income';
    }
  };

  const getData = () => {
    switch(activeTab) {
      case 'roi': return roiData;
      case 'direct': return directData;
      case 'level': return levelData;
      default: return roiData;
    }
  };

  // Filter data based on search term
  const filteredData = getData().filter(row => {
    const searchString = searchTerm.toLowerCase();
    return (
      row.fromUser.toLowerCase().includes(searchString) ||
      row.toUser.toLowerCase().includes(searchString) ||
      row.type.toLowerCase().includes(searchString) ||
      row.amount.toLowerCase().includes(searchString) ||
      row.createdAt.toLowerCase().includes(searchString)
    );
  });

  // Pagination logic
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
    setCurrentPage(1); // Reset to first page
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="earnings-container">
      <div className="earnings-header">
        <h1 className="earnings-title">{getTitle()}</h1>
        
      
      </div>

      <div className="search-section">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="table-container">
        <table className="earnings-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TO USER</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row) => (
              <tr key={`${activeTab}-${row.sno}`}>
                <td>{row.sno}</td>
                <td>{row.fromUser}</td>
                <td>{row.toUser}</td>
                <td>
                  <span className={`type-badge type-${activeTab}`}>
                    {row.type}
                  </span>
                </td>
                <td className="amount-cell">{row.amount}</td>
                <td>{row.createdAt}</td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="rows-selector">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="rows-info">
            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
          </span>
        </div>
        <div className="pagination">
          <button 
            className="page-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >Previous</button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            className="page-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >Next</button>
        </div>
      </div>
    </div>
  );
};

export default Earnings;