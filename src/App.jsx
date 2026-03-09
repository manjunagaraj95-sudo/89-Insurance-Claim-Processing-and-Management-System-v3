
import React, { useState, useEffect } from 'react';

// Define RBAC roles and their capabilities
const ROLES = {
  'Policyholder': {
    canViewClaims: true,
    canSubmitClaims: true,
    canEditClaims: false,
    canApproveClaims: false,
    canViewAuditLogs: false,
    canExportReports: false,
  },
  'Claims Officer': {
    canViewClaims: true,
    canSubmitClaims: false,
    canEditClaims: true,
    canApproveClaims: true, // Can approve certain stages
    canViewAuditLogs: true,
    canExportReports: true,
  },
  'Claims Manager': {
    canViewClaims: true,
    canSubmitClaims: false,
    canEditClaims: true,
    canApproveClaims: true, // Full approval power
    canViewAuditLogs: true,
    canExportReports: true,
  },
  'Verification Team': {
    canViewClaims: true,
    canSubmitClaims: false,
    canEditClaims: true, // For verification specific fields
    canApproveClaims: false, // Can only mark verification complete
    canViewAuditLogs: true,
    canExportReports: false,
  },
  'Finance Team': {
    canViewClaims: true,
    canSubmitClaims: false,
    canEditClaims: true, // For payout details
    canApproveClaims: true, // Can approve final payout
    canViewAuditLogs: true,
    canExportReports: true,
  },
};

// --- Sample Data ---
const claimsData = [
  {
    id: 'CL001',
    title: 'Auto Accident - Front Bumper Damage',
    policyholder: 'Alice Smith',
    policyNumber: 'AP-1002030',
    status: 'In Progress',
    amount: 5200.00,
    submissionDate: '2023-10-26',
    lastUpdate: '2023-11-01',
    description: 'Claim for damages sustained in a rear-end collision on Oct 25, 2023. Front bumper and hood require replacement.',
    attachments: [
      { name: 'Police Report.pdf', url: '/docs/police_report_cl001.pdf', type: 'pdf' },
      { name: 'Vehicle Damage Photos.zip', url: '/docs/photos_cl001.zip', type: 'zip' },
      { name: 'Repair Estimate.docx', url: '/docs/estimate_cl001.docx', type: 'docx' },
    ],
    assignedTo: 'Claims Officer John Doe',
    slaDue: '2023-11-15',
    riskScore: 'Medium',
    priority: 'High',
  },
  {
    id: 'CL002',
    title: 'Home Burglary - Stolen Electronics',
    policyholder: 'Bob Johnson',
    policyNumber: 'HP-5006070',
    status: 'Pending',
    amount: 12500.00,
    submissionDate: '2023-10-28',
    lastUpdate: '2023-10-29',
    description: 'Break-in reported on Oct 27, 2023. Missing laptop, TV, and jewelry. Police report filed.',
    attachments: [
      { name: 'Police Incident Report.pdf', url: '/docs/incident_report_cl002.pdf', type: 'pdf' },
      { name: 'Itemized List of Stolen Goods.xlsx', url: '/docs/items_cl002.xlsx', type: 'xlsx' },
    ],
    assignedTo: 'Claims Officer Jane Doe',
    slaDue: '2023-11-10',
    riskScore: 'High',
    priority: 'Medium',
  },
  {
    id: 'CL003',
    title: 'Medical Claim - Emergency Surgery',
    policyholder: 'Carol White',
    policyNumber: 'MP-2003040',
    status: 'Approved',
    amount: 45000.00,
    submissionDate: '2023-10-20',
    lastUpdate: '2023-11-03',
    description: 'Emergency appendectomy performed on Oct 18, 2023. All medical bills and reports attached.',
    attachments: [
      { name: 'Hospital Bill.pdf', url: '/docs/hospital_bill_cl003.pdf', type: 'pdf' },
      { name: 'Surgery Report.pdf', url: '/docs/surgery_report_cl003.pdf', type: 'pdf' },
    ],
    assignedTo: 'Claims Officer John Doe',
    slaDue: '2023-10-30', // SLA was breached but now approved
    riskScore: 'Low',
    priority: 'High',
  },
  {
    id: 'CL004',
    title: 'Property Damage - Roof Leak',
    policyholder: 'David Green',
    policyNumber: 'HP-5006071',
    status: 'Rejected',
    amount: 3000.00,
    submissionDate: '2023-09-15',
    lastUpdate: '2023-10-01',
    description: 'Roof leak during heavy rains, causing ceiling damage. Claim rejected due to policy exclusions.',
    attachments: [
      { name: 'Damage Photos.zip', url: '/docs/photos_cl004.zip', type: 'zip' },
      { name: 'Denial Letter.pdf', url: '/docs/denial_cl004.pdf', type: 'pdf' },
    ],
    assignedTo: 'Claims Officer Jane Doe',
    slaDue: '2023-09-25',
    riskScore: 'Medium',
    priority: 'Low',
  },
  {
    id: 'CL005',
    title: 'Travel Insurance - Flight Cancellation',
    policyholder: 'Eva Brown',
    policyNumber: 'TP-9008010',
    status: 'Exception',
    amount: 800.00,
    submissionDate: '2023-11-01',
    lastUpdate: '2023-11-02',
    description: 'Flight cancelled due to unexpected airline strike. Seeking reimbursement for non-refundable tickets.',
    attachments: [
      { name: 'Flight Cancellation Notice.pdf', url: '/docs/cancellation_cl005.pdf', type: 'pdf' },
      { name: 'Ticket Purchase Confirmation.pdf', url: '/docs/confirmation_cl005.pdf', type: 'pdf' },
    ],
    assignedTo: 'Claims Officer Mark Lee',
    slaDue: '2023-11-08',
    riskScore: 'Low',
    priority: 'Medium',
  },
];

const milestonesData = {
  'CL001': [
    { stage: 'Claim Submission', date: '2023-10-26', status: 'completed' },
    { stage: 'Initial Review', date: '2023-10-27', status: 'completed' },
    { stage: 'Document Verification', date: '2023-10-29', status: 'completed' },
    { stage: 'Assessment & Estimate', date: null, status: 'current', slaBreach: false },
    { stage: 'Approval / Rejection', date: null, status: 'upcoming', slaBreach: false },
    { stage: 'Payout', date: null, status: 'upcoming', slaBreach: false },
  ],
  'CL002': [
    { stage: 'Claim Submission', date: '2023-10-28', status: 'completed' },
    { stage: 'Initial Review', date: '2023-10-29', status: 'completed' },
    { stage: 'Document Verification', date: null, status: 'current', slaBreach: true }, // SLA breached
    { stage: 'Assessment & Estimate', date: null, status: 'upcoming' },
    { stage: 'Approval / Rejection', date: null, status: 'upcoming' },
    { stage: 'Payout', date: null, status: 'upcoming' },
  ],
  'CL003': [
    { stage: 'Claim Submission', date: '2023-10-20', status: 'completed' },
    { stage: 'Initial Review', date: '2023-10-21', status: 'completed' },
    { stage: 'Document Verification', date: '2023-10-22', status: 'completed' },
    { stage: 'Assessment & Estimate', date: '2023-10-25', status: 'completed' },
    { stage: 'Approval / Rejection', date: '2023-11-01', status: 'completed' },
    { stage: 'Payout', date: '2023-11-03', status: 'completed' },
  ],
  'CL004': [
    { stage: 'Claim Submission', date: '2023-09-15', status: 'completed' },
    { stage: 'Initial Review', date: '2023-09-16', status: 'completed' },
    { stage: 'Document Verification', date: '2023-09-18', status: 'completed' },
    { stage: 'Assessment & Estimate', date: '2023-09-20', status: 'completed' },
    { stage: 'Approval / Rejection', date: '2023-09-30', status: 'completed' },
    { stage: 'Payout', date: null, status: 'rejected' }, // Final stage is rejection
  ],
  'CL005': [
    { stage: 'Claim Submission', date: '2023-11-01', status: 'completed' },
    { stage: 'Initial Review', date: null, status: 'current', slaBreach: false },
    { stage: 'Document Verification', date: null, status: 'upcoming' },
    { stage: 'Assessment & Estimate', date: null, status: 'upcoming' },
    { stage: 'Approval / Rejection', date: null, status: 'upcoming' },
    { stage: 'Payout', date: null, status: 'upcoming' },
  ],
};

const activitiesData = {
  'CL001': [
    { date: '2023-11-01 10:30', user: 'System', action: 'SLA for "Assessment & Estimate" updated to 2023-11-15.' },
    { date: '2023-10-29 16:45', user: 'Claims Officer John Doe', action: 'All supporting documents verified and approved.' },
    { date: '2023-10-27 11:20', user: 'Claims Officer John Doe', action: 'Initial claim review completed. Awaiting document verification.' },
    { date: '2023-10-26 09:00', user: 'Alice Smith', action: 'Claim and documents submitted.' },
  ],
  'CL002': [
    { date: '2023-10-29 14:00', user: 'Claims Officer Jane Doe', action: 'Initial claim review completed. Documents sent to Verification Team.' },
    { date: '2023-10-28 10:15', user: 'Bob Johnson', action: 'Claim and documents submitted.' },
  ],
  'CL003': [
    { date: '2023-11-03 15:00', user: 'Finance Team Sarah K.', action: 'Claim payout finalized and processed.' },
    { date: '2023-11-01 11:30', user: 'Claims Manager Bob R.', action: 'Claim approved after final review.' },
    { date: '2023-10-25 09:00', user: 'Verification Team Alex P.', action: 'Medical reports and bills assessed. Awaiting manager approval.' },
    { date: '2023-10-22 14:00', user: 'Claims Officer John Doe', action: 'Documents verified. Proceeding to assessment.' },
  ],
  'CL004': [
    { date: '2023-10-01 09:30', user: 'Claims Manager Bob R.', action: 'Claim rejected due to policy exclusion (lack of flood coverage).' },
    { date: '2023-09-30 14:00', user: 'Claims Officer Jane Doe', action: 'Assessment completed. Recommended for rejection.' },
  ],
  'CL005': [
    { date: '2023-11-02 10:00', user: 'Claims Officer Mark Lee', action: 'Initial review started. Waiting for airline confirmation.' },
    { date: '2023-11-01 16:00', user: 'Eva Brown', action: 'Claim submitted for flight cancellation.' },
  ],
};

// Calculate rejected claims count
const rejectedClaimsCount = claimsData.filter(claim => claim.status === 'Rejected').length;

const dashboardKPIs = [
  { id: 'totalClaims', title: 'Total Claims', value: 245, trend: '+5%', type: 'positive' },
  { id: 'pendingApproval', title: 'Pending Approval', value: 18, trend: '0%', type: 'neutral' },
  { id: 'slaBreaches', title: 'SLA Breaches', value: 3, trend: '+1', type: 'negative' },
  { id: 'avgProcessingTime', title: 'Avg. Processing Time', value: '7.2 Days', trend: '-10%', type: 'positive' },
  { id: 'rejectedClaims', title: 'Rejected Claims', value: rejectedClaimsCount, trend: '-2%', type: 'negative' },
];

function App() {
  const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
  const [currentUserRole, setCurrentUserRole] = useState('Claims Manager'); // Default role for demo
  const userPermissions = ROLES[currentUserRole];

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All',
    search: '', // For claims in dashboard
  });

  const navigateTo = (screen, params = {}) => {
    setView({ screen, params });
  };

  const handleClaimCardClick = (claimId) => {
    navigateTo('CLAIM_DETAIL', { claimId });
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setFilters({ status: 'All', search: '' });
    setShowFilterModal(false);
  };

  const handleExport = (dataToExport, filename = 'export.csv') => {
    if (!userPermissions?.canExportReports) {
      alert('You do not have permission to export reports.');
      return;
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = Object.keys(dataToExport[0] || {});
    const csvRows = [
      headers.join(','), // Header row
      ...dataToExport.map(row => headers.map(fieldName => {
        // Handle potential commas and double quotes in string fields, wrap in quotes
        let value = row[fieldName];
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`; // Escape double quotes
        } else if (value === null || value === undefined) {
          value = '';
        }
        return value;
      }).join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up the URL object
  };

  const currentClaim = view.screen === 'CLAIM_DETAIL'
    ? claimsData.find(claim => claim.id === view.params.claimId)
    : null;

  const currentMilestones = currentClaim ? milestonesData[currentClaim.id] : [];
  const currentActivities = currentClaim ? activitiesData[currentClaim.id] : [];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'approved';
      case 'In Progress': return 'in-progress';
      case 'Pending': return 'pending';
      case 'Rejected': return 'rejected';
      case 'Exception': return 'exception';
      default: return '';
    }
  };

  const filteredClaims = claimsData.filter(claim => {
    // Status filter
    if (filters.status !== 'All' && claim?.status !== filters.status) {
      return false;
    }
    // Search filter (title or ID)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return claim?.title?.toLowerCase().includes(searchTerm) || claim?.id?.toLowerCase().includes(searchTerm);
    }
    return true;
  });

  // UI Components
  const Header = () => (
    <header className="header-bar glass-effect flex-row align-center justify-between">
      <div className="flex-row align-center gap-md">
        {view.screen !== 'DASHBOARD' && (
          <button
            onClick={() => navigateTo('DASHBOARD')}
            className="btn btn-secondary"
            style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-full)' }}
          >
            <span className="icon icon-back" style={{ color: 'var(--text-main)' }}></span>
          </button>
        )}
        <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0, fontWeight: 700 }}>
          {view.screen === 'DASHBOARD' && 'Insurance Claim Dashboard'}
          {view.screen === 'CLAIM_DETAIL' && `Claim ${currentClaim?.id}`}
        </h1>
      </div>

      <div className="flex-row align-center gap-md">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Global Search..."
            className="search-input"
          />
          <span className="icon icon-search" style={{ position: 'absolute', right: 'var(--spacing-sm)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></span>
        </div>

        {/* Role Switcher for Demo */}
        <select
          value={currentUserRole}
          onChange={(e) => setCurrentUserRole(e.target.value)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid rgba(0,0,0,0.1)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
          }}
        >
          {Object.keys(ROLES).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <span className="icon icon-user" style={{ color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}></span>
      </div>
    </header>
  );

  const ClaimCard = ({ claim, onClick }) => (
    <div className="card card-clickable flex-col" onClick={() => onClick(claim.id)} style={{ padding: 'var(--spacing-lg)' }}>
      <div className="flex-row justify-between align-center mb-md">
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{claim?.title}</h3>
        <span className={`status-tag ${getStatusClass(claim?.status)}`}>{claim?.status}</span>
      </div>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', flexGrow: 1 }}>
        Policyholder: <span className="text-charcoal text-bold">{claim?.policyholder}</span>
      </p>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
        Amount: <span className="text-charcoal text-bold">${claim?.amount?.toFixed(2)}</span> | Submitted: {claim?.submissionDate}
      </p>
      <div className="flex-row justify-between align-center" style={{ marginTop: 'auto' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Last Updated: {claim?.lastUpdate}</span>
        {userPermissions?.canEditClaims && ( // Example of RBAC on actions
          <button className="btn btn-primary" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
            Edit
          </button>
        )}
      </div>
    </div>
  );

  const FilterModal = ({ show, onClose, onApply, onClear, currentFilters }) => {
    const [localFilters, setLocalFilters] = useState(currentFilters);

    useEffect(() => {
      // Sync local state with prop when modal opens or filters are externally reset
      if (show) {
        setLocalFilters(currentFilters);
      }
    }, [currentFilters, show]);

    if (!show) return null;

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content card">
          <div className="flex-row justify-between align-center mb-lg">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>Filter Claims</h3>
            <button onClick={onClose} className="btn-icon">
              <span className="icon icon-close" style={{ color: 'var(--text-secondary)' }}></span>
            </button>
          </div>
          <div className="form-group mb-md">
            <label htmlFor="status" style={{ marginBottom: 'var(--spacing-xs)', display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-main)' }}>Status</label>
            <select
              id="status"
              name="status"
              value={localFilters.status}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Exception">Exception</option>
            </select>
          </div>
          <div className="form-group mb-lg">
            <label htmlFor="search" style={{ marginBottom: 'var(--spacing-xs)', display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-main)' }}>Search (ID or Title)</label>
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Search by ID or Title"
              value={localFilters.search}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="flex-row justify-end gap-sm">
            <button className="btn btn-secondary" onClick={onClear}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={() => onApply(localFilters)}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
      <div className="flex-row justify-between align-center mb-lg">
        <h2 style={{ fontSize: 'var(--font-size-h2)', margin: 0 }}>Overview</h2>
        <div className="flex-row gap-sm">
          <button className="btn btn-secondary" onClick={() => setShowFilterModal(true)}>
            <span className="icon icon-filter mr-sm" style={{ backgroundColor: 'var(--color-primary)' }}></span> Filters
          </button>
          {userPermissions?.canExportReports && (
            <button className="btn btn-secondary" onClick={() => handleExport(filteredClaims, 'claims_dashboard.csv')}>
              <span className="icon icon-export mr-sm" style={{ backgroundColor: 'var(--color-primary)' }}></span> Export
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xxl)' }}>
        {dashboardKPIs.map(kpi => (
          <div key={kpi.id} className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)', margin: 0, marginBottom: 'var(--spacing-xs)' }}>{kpi.title}</h3>
            <div className="flex-row align-center">
                <span className="metric-value realtime-pulse">{kpi.value}</span>
                <span className={`trends-indicator ${kpi.type}`}>
                    {kpi.type === 'positive' && <span className="icon arrow-up"></span>}
                    {kpi.type === 'negative' && <span className="icon arrow-down"></span>}
                    {kpi.type === 'neutral' && <span className="icon arrow-neutral"></span>}
                    {kpi.trend}
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-row justify-between align-center mb-lg">
        <h2 style={{ fontSize: 'var(--font-size-h2)', margin: 0 }}>Recent Claims</h2>
        {userPermissions?.canSubmitClaims && (
            <button className="btn btn-primary">
                Submit New Claim
            </button>
        )}
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xxl)' }}>
        {filteredClaims.length > 0 ? (
          filteredClaims.map(claim => (
            <ClaimCard key={claim.id} claim={claim} onClick={handleClaimCardClick} />
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No claims match your current filters.</p>
        )}
      </div>

      <h2 style={{ fontSize: 'var(--font-size-h2)', margin: 0, marginBottom: 'var(--spacing-lg)' }}>Analytics & Trends</h2>
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 className="chart-title">Claim Volume by Type (Donut)</h3>
          <div className="chart-placeholder">Donut Chart Placeholder</div>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 className="chart-title">Claims Processing Time (Line)</h3>
          <div className="chart-placeholder">Line Chart Placeholder</div>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 className="chart-title">Approval Rates (Gauge)</h3>
          <div className="chart-placeholder">Gauge Chart Placeholder</div>
        </div>
      </div>

      <FilterModal
        show={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        currentFilters={filters}
      />
    </div>
  );

  const ClaimDetail = () => (
    <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
      <div className="breadcrumbs">
        <span className="breadcrumb-item"><a href="#" onClick={() => navigateTo('DASHBOARD')}>Dashboard</a></span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item">{currentClaim?.title}</span>
      </div>

      <div className="flex-row justify-between align-center mb-lg">
        <h2 style={{ fontSize: 'var(--font-size-h1)', margin: 0 }}>
          {currentClaim?.title}
          <span className={`status-tag ${getStatusClass(currentClaim?.status)}`} style={{ marginLeft: 'var(--spacing-md)' }}>
            {currentClaim?.status}
          </span>
        </h2>
        <div className="flex-row gap-md">
          {userPermissions?.canEditClaims && (
            <button className="btn btn-secondary">
              Edit Claim
            </button>
          )}
          {userPermissions?.canApproveClaims && (
            <button className="btn btn-primary">
              Approve Claim
            </button>
          )}
          {userPermissions?.canExportReports && (
            <button className="btn btn-secondary" onClick={() => handleExport(currentClaim ? [currentClaim] : [], `claim_report_${currentClaim?.id}.csv`)}>
              <span className="icon icon-export mr-sm" style={{ backgroundColor: 'var(--color-primary)' }}></span> Export Report
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'flex-start' }}>
        {/* Main Content Area */}
        <div className="flex-col gap-lg">
          {/* Claim Summary */}
          <div className="card p-lg">
            <h3 style={{ fontSize: 'var(--font-size-xl)', margin: 0, marginBottom: 'var(--spacing-md)' }}>Claim Summary</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Policyholder: <span className="text-charcoal text-bold">{currentClaim?.policyholder}</span></p>
            <p style={{ color: 'var(--text-secondary)' }}>Policy Number: <span className="text-charcoal text-bold">{currentClaim?.policyNumber}</span></p>
            <p style={{ color: 'var(--text-secondary)' }}>Amount Claimed: <span className="text-charcoal text-bold">${currentClaim?.amount?.toFixed(2)}</span></p>
            <p style={{ color: 'var(--text-secondary)' }}>Submission Date: <span className="text-charcoal text-bold">{currentClaim?.submissionDate}</span></p>
            <p style={{ color: 'var(--text-secondary)' }}>Assigned To: <span className="text-charcoal text-bold">{currentClaim?.assignedTo}</span></p>
            <p style={{ marginTop: 'var(--spacing-md)' }}>{currentClaim?.description}</p>
          </div>

          {/* Documents Section */}
          <div className="card p-lg">
            <h3 style={{ fontSize: 'var(--font-size-xl)', margin: 0, marginBottom: 'var(--spacing-md)' }}>Supporting Documents</h3>
            <div className="flex-col gap-sm">
              {currentClaim?.attachments?.length > 0 ? (
                currentClaim.attachments.map((doc, index) => (
                  <div key={index} className="flex-row align-center justify-between" style={{ padding: 'var(--spacing-xs) 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-main)' }}>{doc.name}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: 'var(--spacing-xxs) var(--spacing-sm)' }}>
                      Preview
                    </a>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No documents attached.</p>
              )}
            </div>
          </div>

          {/* Related Records Placeholder */}
          <div className="card p-lg">
            <h3 style={{ fontSize: 'var(--font-size-xl)', margin: 0, marginBottom: 'var(--spacing-md)' }}>Related Records</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No related records found for this claim.</p>
            {/* Future: Implement a grid here with search, filter, sort, export */}
          </div>
        </div>

        {/* Sidebar / Right Column */}
        <div className="flex-col gap-lg">
          {/* Milestone Tracker */}
          <div className="card p-lg">
            <h3 style={{ fontSize: 'var(--font-size-xl)', margin: 0, marginBottom: 'var(--spacing-md)' }}>Milestone Progress</h3>
            <div className="milestone-tracker">
              {currentMilestones?.map((milestone, index) => (
                <div key={index} className="milestone-item">
                  <div className={`milestone-icon ${milestone.status} ${milestone.slaBreach ? 'breached' : ''}`}>
                    {milestone.status === 'completed' ? '✓' : index + 1}
                  </div>
                  <div className="milestone-details">
                    <div className="milestone-stage">{milestone.stage}</div>
                    <div className="milestone-date">
                      {milestone.date ? `Completed: ${milestone.date}` : (milestone.status === 'current' ? `SLA Due: ${currentClaim?.slaDue}` : 'Pending')}
                      {milestone.slaBreach && <span style={{ color: 'var(--text-error)', marginLeft: 'var(--spacing-xs)' }}>(SLA Breached)</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* News/Audit Feed */}
          {userPermissions?.canViewAuditLogs && (
            <div className="card p-lg">
              <h3 style={{ fontSize: 'var(--font-size-xl)', margin: 0, marginBottom: 'var(--spacing-md)' }}>Audit & Activity Feed</h3>
              <div className="flex-col">
                {currentActivities?.length > 0 ? (
                  currentActivities.map((activity, index) => (
                    <div key={index} className="activity-feed-item">
                      <p style={{ margin: 0 }}>
                        <span className="text-bold">{activity.user}:</span> {activity.action}
                      </p>
                      <p className="activity-timestamp">{activity.date}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No recent activities.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {view.screen === 'DASHBOARD' && <Dashboard />}
        {view.screen === 'CLAIM_DETAIL' && <ClaimDetail />}
      </main>
    </>
  );
}

export default App;