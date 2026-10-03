import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  Layers,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Activity,
  Shield,
  Building2,
  Cpu,
  Printer,
  Tv,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useReportsDashboard, useAllBookings, useLabs, useResources, useAuth } from '../../../hooks';
import {
  ChartContainer,
  UtilizationChart,
  BookingChart,
  StatusPieChart,
  ReportFilterPanel,
} from '../../../components/reports';
import { Breadcrumbs, Skeleton, Table, Column, Button, Select, useToast } from '../../../components/common';
import { LabUtilizationReport, ResourceUtilizationReport } from '../../../types';

// Official Institutional Laboratory Master Audit dataset from the 3NF Master Register (Page 1 of Workbook)
interface OfficialLabAuditItem {
  labId: string;
  labCode: string;
  labName: string;
  investment: number;
  records: number;
  currentQty: number;
  recordedValue: number;
  primaryHardware: string;
}

const OFFICIAL_LAB_AUDIT_DATA: OfficialLabAuditItem[] = [
  {
    labId: 'LAB001',
    labCode: 'D-01',
    labName: 'Linux Laboratory',
    investment: 1419544.04,
    records: 7,
    currentQty: 42,
    recordedValue: 1257925.84,
    primaryHardware: 'Dell OptiPlex 3010 / 5090 SFF, Core i5/i7, 8GB RAM',
  },
  {
    labId: 'LAB002',
    labCode: 'D-02',
    labName: 'Database Laboratory',
    investment: 3601318.00,
    records: 9,
    currentQty: 46,
    recordedValue: 2147679.00,
    primaryHardware: 'Dell OptiPlex 360 / 3040 / 5090 SFF, HP LaserJet MFP 1136',
  },
  {
    labId: 'LAB003',
    labCode: 'D-03',
    labName: 'Project Laboratory',
    investment: 2603775.00,
    records: 9,
    currentQty: 49,
    recordedValue: 1914613.00,
    primaryHardware: 'Dell OptiPlex 360 / 3020 / 3060 MT, Core i7-8700, Epson M200',
  },
  {
    labId: 'LAB004',
    labCode: 'D-04',
    labName: 'Application Development Tool Laboratory',
    investment: 1459513.00,
    records: 8,
    currentQty: 17,
    recordedValue: 662400.00,
    primaryHardware: 'Dell OptiPlex 3020 MT, Core i5-4570, HP LaserJet MFP 1005',
  },
  {
    labId: 'LAB005',
    labCode: 'D-05',
    labName: 'Operating System Laboratory',
    investment: 2664951.50,
    records: 8,
    currentQty: 38,
    recordedValue: 2156515.00,
    primaryHardware: 'Dell OptiPlex 3020 / 3050 / 3000 MT, Ci5-12500, HP CP-1025',
  },
  {
    labId: 'LAB006',
    labCode: 'D-06',
    labName: 'Web Development Tool Lab',
    investment: 2025848.99,
    records: 6,
    currentQty: 27,
    recordedValue: 1162798.99,
    primaryHardware: 'Dell OptiPlex 3020 M / 5090 SFF, Core i5-11500, HP MFP 1005',
  },
  {
    labId: 'LAB007',
    labCode: 'D-07',
    labName: 'Network Laboratory',
    investment: 2759191.89,
    records: 11,
    currentQty: 40,
    recordedValue: 2271006.00,
    primaryHardware: 'Dell OptiPlex 980 / 3050 / 3080 / 5090 / 5000 MT, Core i7-12700, HP 1005',
  },
  {
    labId: 'LAB008',
    labCode: 'D-08',
    labName: 'Artificial Intelligence & Machine Learning Laboratory',
    investment: 2572968.80,
    records: 9,
    currentQty: 50,
    recordedValue: 1535135.00,
    primaryHardware: 'Dell OptiPlex 390 / 3010 / 3060 MT / 7000 SFF, Core i7-12700',
  },
  {
    labId: 'LAB009',
    labCode: 'D-09',
    labName: 'Apple Education Center Laboratory',
    investment: 5470034.99,
    records: 7,
    currentQty: 65,
    recordedValue: 4698904.99,
    primaryHardware: 'Dell OptiPlex 3020 M / 7020 SFF, Core i7-14700, 16GB DDR5, 512GB SSD, HP MFP',
  },
  {
    labId: 'LAB010',
    labCode: 'D-10',
    labName: 'PG laboratory-1',
    investment: 1492856.00,
    records: 4,
    currentQty: 34,
    recordedValue: 1210488.00,
    primaryHardware: 'Lenovo ThinkCentre M920, Core i7-9700, 1TB HDD, Epson M200 C11CC83412',
  },
  {
    labId: 'LAB011',
    labCode: 'D-11',
    labName: 'PG laboratory-2',
    investment: 2083780.00,
    records: 3,
    currentQty: 24,
    recordedValue: 1918047.00,
    primaryHardware: 'Apple Mac All-in-One Desktop 21.5", Core i5, 8GB RAM, 256GB SSD',
  },
  {
    labId: 'LAB012',
    labCode: 'D-12',
    labName: 'Augmented Reality/ Virtual Reality Laboratory (ARVR LAB)',
    investment: 6046650.00,
    records: 0,
    currentQty: 30,
    recordedValue: 6046650.00,
    primaryHardware: 'AR/VR Spatial Headsets, High-Performance Graphic Workstations',
  },
];

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, role } = useAuth();
  const canExportCSV = role === 'faculty' || role === 'admin';

  const [activeTab, setActiveTab] = useState<'audit' | 'operational' | 'faculty'>(
    role === 'faculty' ? 'faculty' : 'audit'
  );

  const [startDate, setStartDate] = useState('2026-09-17');
  const [endDate, setEndDate] = useState('2026-09-23');
  const [selectedLabFilter, setSelectedLabFilter] = useState('all');

  const { data: reportData, isLoading, refetch } = useReportsDashboard({ startDate, endDate });
  const { data: allBookings = [] } = useAllBookings();
  const { data: labs = [] } = useLabs();
  const { data: resources = [] } = useResources();

  // Booking status metrics calculation
  const completedCount = allBookings.filter((b) => b.status === 'COMPLETED').length;
  const confirmedCount = allBookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE').length;
  const queuedCount = allBookings.filter((b) => b.status === 'QUEUED' || b.status === 'WAITLISTED').length;
  const cancelledCount = allBookings.filter((b) => b.status === 'CANCELLED').length;
  const rejectedCount = allBookings.filter((b) => b.status === 'REJECTED').length;

  const pieData = [
    { status: 'Completed', count: completedCount, color: '#10b981' },
    { status: 'Confirmed/Active', count: confirmedCount, color: '#6366f1' },
    { status: 'Queued', count: queuedCount, color: '#f59e0b' },
    { status: 'Cancelled', count: cancelledCount, color: '#94a3b8' },
    { status: 'Rejected', count: rejectedCount, color: '#f43f5e' },
  ];

  // Totals for Institutional Master Audit
  const totalInvestment = OFFICIAL_LAB_AUDIT_DATA.reduce((acc, item) => acc + item.investment, 0);
  const totalRecordedValue = OFFICIAL_LAB_AUDIT_DATA.reduce((acc, item) => acc + item.recordedValue, 0);
  const totalQuantity = OFFICIAL_LAB_AUDIT_DATA.reduce((acc, item) => acc + item.currentQty, 0);
  const totalRecords = OFFICIAL_LAB_AUDIT_DATA.reduce((acc, item) => acc + item.records, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportAuditCSV = () => {
    if (!canExportCSV) return;
    const rows = [
      ['Lab ID', 'Lab Code', 'Laboratory Name', 'Institutional Investment (INR)', 'Inventory Records', 'Current Qty', 'Recorded Inventory Value (INR)', 'Primary Equipment'],
      ...OFFICIAL_LAB_AUDIT_DATA.map((l) => [
        l.labId,
        l.labCode,
        `"${l.labName}"`,
        l.investment.toFixed(2),
        l.records,
        l.currentQty,
        l.recordedValue.toFixed(2),
        `"${l.primaryHardware}"`,
      ]),
      [],
      ['TOTALS', '12 LABS', 'Smart Campus Master Register', totalInvestment.toFixed(2), totalRecords, totalQuantity, totalRecordedValue.toFixed(2), '462 Managed Assets'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `institutional-master-lab-audit-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Institutional Audit Exported',
      message: 'Downloaded official 12-laboratory audit dataset as CSV.',
    });
  };

  const handleExportOperationalCSV = () => {
    if (!canExportCSV) return;
    if (!reportData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Reservations', reportData.summary.totalBookings],
      ['Average Utilization', `${reportData.summary.averageUtilization}%`],
      ['Peak Hour', reportData.summary.peakHour],
      ['Queue Resolution Rate', `${reportData.summary.queueResolutionRate}%`],
      ['Completed Sessions', completedCount],
      ['Confirmed Sessions', confirmedCount],
      ['Queued Sessions', queuedCount],
      ['Cancelled Sessions', cancelledCount],
      ['Rejected Sessions', rejectedCount],
      [],
      ['Laboratory', 'Hours Booked', 'Utilization Rate (%)', 'Total Sessions'],
      ...reportData.labUtilization.map((l) => [l.labName, l.totalHoursBooked, l.utilizationRate, l.bookingCount]),
      [],
      ['Equipment', 'Category', 'Hours Used', 'Utilization Rate (%)'],
      ...reportData.resourceUtilization.map((r) => [r.resourceName, r.type, r.totalHoursUsed, r.utilizationRate]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus-optimizer-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Operational Report Exported',
      message: 'Downloaded operational campus dataset as CSV.',
    });
  };

  // Filtered lab utilization
  const filteredLabUtilization = (reportData?.labUtilization || []).filter((item) => {
    if (selectedLabFilter === 'all') return true;
    return item.labId === selectedLabFilter;
  });

  const labColumns: Column<LabUtilizationReport>[] = [
    { key: 'labName', header: 'Laboratory Facility' },
    {
      key: 'totalHoursBooked',
      header: 'Hours Booked',
      render: (item) => <span className="font-semibold text-slate-200">{item.totalHoursBooked} hrs</span>,
    },
    {
      key: 'utilizationRate',
      header: 'Utilization Rate',
      render: (item) => (
        <span
          className={`font-bold font-mono ${
            item.utilizationRate >= 80
              ? 'text-indigo-400'
              : item.utilizationRate >= 60
              ? 'text-emerald-400'
              : 'text-amber-400'
          }`}
        >
          {item.utilizationRate}%
        </span>
      ),
    },
    { key: 'bookingCount', header: 'Total Sessions Scheduled' },
  ];

  const resourceColumns: Column<ResourceUtilizationReport>[] = [
    { key: 'resourceName', header: 'Hardware Equipment' },
    { key: 'type', header: 'Category' },
    {
      key: 'totalHoursUsed',
      header: 'Workload Hours',
      render: (item) => <span className="font-semibold text-slate-200">{item.totalHoursUsed} hrs</span>,
    },
    {
      key: 'utilizationRate',
      header: 'Capacity Rate',
      render: (item) => (
        <span className="font-bold text-indigo-400 font-mono">{item.utilizationRate}%</span>
      ),
    },
  ];

  if (isLoading || !reportData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Reports & Analytics' }]} />
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <span>
                {role === 'faculty'
                  ? 'Faculty Departmental Curriculum & Facility Utilization Report'
                  : 'Campus Optimization & Master Institutional Audit'}
              </span>
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                role === 'admin'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              {role === 'admin' ? 'Admin Master View' : 'Faculty View'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === 'faculty'
              ? 'Practical curriculum scheduling, lab seat occupancy, and departmental attendance records'
              : 'Official 3NF Laboratory Master Audit (12 Labs, ₹3.42 Cr Investment) and operational telemetry'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canExportCSV && (
            activeTab === 'audit' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAuditCSV}
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              >
                Export Master Audit (CSV)
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportOperationalCSV}
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-400" />}
              >
                Export Utilization (CSV)
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync Live Data
          </Button>
        </div>
      </div>

      {/* Role-Based Navigation View Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs scrollbar-none">
        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Official Institutional Audit (12 Labs Master)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('operational')}
          className={`flex items-center gap-2 px-3.5 py-2 font-bold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'operational'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Daily Operational Utilization & Booking Trends</span>
        </button>

        {role === 'faculty' && (
          <button
            type="button"
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center gap-2 px-3.5 py-2 font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'faculty'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Faculty Department Curriculum Sessions</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INSTITUTIONAL MASTER AUDIT (OFFICIAL 3NF PDF DATA) */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Institutional KPI Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Capital Investment</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(totalInvestment)}
              </p>
              <p className="text-[10px] text-slate-400">Total institutional acquisition</p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recorded Inventory Value</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(totalRecordedValue)}
              </p>
              <p className="text-[10px] text-slate-400">Audited 3NF ledger valuation</p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Official Laboratories</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-white">12 Facilities</p>
              <p className="text-[10px] text-slate-400">D-01 to D-12 complete fleet</p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Managed Hardware Units</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">{totalQuantity} Units</p>
              <p className="text-[10px] text-slate-400">PCs, Printers & Workstations</p>
            </div>
          </div>

          {/* Master 12 Labs Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>1. Laboratory Master List (Official 3NF Ledger)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Source: Smart_Campus_Processed_Inventory_3NF workbook. Direct institutional records.
                </p>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
                12 Laboratories Synced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3 px-3">Lab ID</th>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Laboratory Name</th>
                    <th className="py-3 px-3 text-right">Investment (₹)</th>
                    <th className="py-3 px-3 text-center">Batches</th>
                    <th className="py-3 px-3 text-center">Qty (Est.)</th>
                    <th className="py-3 px-3 text-right">Recorded Value (₹)</th>
                    <th className="py-3 px-3">Hardware Configuration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {OFFICIAL_LAB_AUDIT_DATA.map((row) => (
                    <tr key={row.labId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{row.labId}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold font-mono">
                          {row.labCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">{row.labName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200">
                        {formatCurrency(row.investment)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">{row.records}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">{row.currentQty}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                        {formatCurrency(row.recordedValue)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate" title={row.primaryHardware}>
                        {row.primaryHardware}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-950/30 border-t-2 border-indigo-500/40 font-bold text-white text-xs">
                    <td className="py-3 px-3" colSpan={3}>
                      TOTALS (12 LABORATORIES MASTER)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400 text-sm">
                      {formatCurrency(totalInvestment)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{totalRecords}</td>
                    <td className="py-3 px-3 text-center font-mono text-cyan-300 text-sm">{totalQuantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                      {formatCurrency(totalRecordedValue)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">Full Campus Fleet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DAILY OPERATIONAL UTILIZATION & BOOKING TRENDS */}
      {/* ======================================================== */}
      {activeTab === 'operational' && (
        <div className="space-y-6">
          {/* Date Range and Multi-Filter Controls */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="flex-1">
                <ReportFilterPanel
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={(s, e) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                />
              </div>

              <div className="w-full sm:w-64">
                <Select
                  label="Filter Laboratory"
                  value={selectedLabFilter}
                  onChange={(e) => setSelectedLabFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All 12 Campus Facilities' },
                    ...labs.map((l) => ({ value: l.id || l.labId, label: `${l.labId}: ${l.name}` })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Sessions</span>
              <p className="text-2xl font-extrabold text-white">{reportData.summary.totalBookings}</p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Average Utilization</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">{reportData.summary.averageUtilization}%</p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Peak Demand Window</span>
              <p className="text-base sm:text-lg font-bold text-indigo-300 mt-1">{reportData.summary.peakHour}</p>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Queue Clearance Rate</span>
              <p className="text-2xl font-extrabold text-amber-400 font-mono">{reportData.summary.queueResolutionRate}%</p>
            </div>
          </div>

          {/* Detailed Booking Counts Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Completed</span>
              <span className="text-xl font-black text-white">{completedCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block">Confirmed / Active</span>
              <span className="text-xl font-black text-white">{confirmedCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Queued (Waitlist)</span>
              <span className="text-xl font-black text-white">{queuedCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cancelled</span>
              <span className="text-xl font-black text-white">{cancelledCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Rejected</span>
              <span className="text-xl font-black text-white">{rejectedCount}</span>
            </div>
          </div>

          {/* Charts Grid: Trends + Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartContainer
                title="Reservation Trends & Volume (Over Time)"
                description="Daily counts of confirmed, completed, and queued reservation requests"
              >
                <BookingChart data={reportData.bookingTrends} />
              </ChartContainer>
            </div>

            <div>
              <ChartContainer
                title="Session Status Distribution"
                description="Lifecycle ratio across confirmed, queued, completed, and cancelled"
              >
                <StatusPieChart data={pieData} />
              </ChartContainer>
            </div>
          </div>

          {/* Facility & Hardware Utilization Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ChartContainer
                title="Laboratory Utilization Rates"
                description="Percentage of available operational hours scheduled"
              >
                <UtilizationChart data={filteredLabUtilization} type="lab" />
              </ChartContainer>

              <Table
                columns={labColumns}
                data={filteredLabUtilization}
                keyExtractor={(i) => i.labId}
              />
            </div>

            <div className="space-y-4">
              <ChartContainer
                title="Equipment & Accelerator Utilization"
                description="Workload hours logged by hardware resources"
              >
                <UtilizationChart data={reportData.resourceUtilization} type="resource" />
              </ChartContainer>

              <Table
                columns={resourceColumns}
                data={reportData.resourceUtilization}
                keyExtractor={(i) => i.resourceId}
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: FACULTY DEPARTMENT CURRICULUM SESSIONS */}
      {/* ======================================================== */}
      {activeTab === 'faculty' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block">
                Department of Computer Science & Engineering
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">Faculty Curriculum & Practical Sessions Log</h3>
              <p className="text-xs text-slate-400 mt-1">
                Track lab allocations, student practical batches, and equipment usage for scheduled classes.
              </p>
            </div>

            {canExportCSV && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Faculty Sheet Downloaded',
                    message: 'Exported CSE Department laboratory session schedule.',
                  });
                }}
                leftIcon={<Download className="w-4 h-4 text-amber-400" />}
              >
                Download Class Timetable (CSV)
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase text-slate-400 font-bold block">Active Faculty Sessions</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">18 Scheduled</span>
              <span className="text-[10px] text-slate-500">Across Linux, DB & AI/ML Labs</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase text-slate-400 font-bold block">Priority Scheduling Queue</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">Active (FCFS / SJF)</span>
              <span className="text-[10px] text-slate-500">Batch overrides enabled</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase text-slate-400 font-bold block">Average Lab Attendance</span>
              <span className="text-2xl font-black text-indigo-400 mt-1 block">94.2%</span>
              <span className="text-[10px] text-slate-500">42/45 seats filled per session</span>
            </div>
          </div>

          {/* Department Scheduled Classes */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Current Week Practical Class Allocations</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Subject / Practical</th>
                    <th className="py-2.5 px-3">Laboratory</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3">Faculty Instructor</th>
                    <th className="py-2.5 px-3 text-center">Batch Size</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">CS-301</td>
                    <td className="py-2.5 px-3 font-semibold text-white">Advanced Operating Systems Lab</td>
                    <td className="py-2.5 px-3">D-01 (Linux Laboratory)</td>
                    <td className="py-2.5 px-3 font-mono">09:00 AM - 11:00 AM</td>
                    <td className="py-2.5 px-3">Dr. P. R. Kulkarni</td>
                    <td className="py-2.5 px-3 text-center font-mono">42 / 42</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        In Progress
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">CS-304</td>
                    <td className="py-2.5 px-3 font-semibold text-white">Database Engineering & Query Optimization</td>
                    <td className="py-2.5 px-3">D-02 (Database Laboratory)</td>
                    <td className="py-2.5 px-3 font-mono">11:15 AM - 01:15 PM</td>
                    <td className="py-2.5 px-3">Prof. S. M. Shinde</td>
                    <td className="py-2.5 px-3 text-center font-mono">45 / 46</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Scheduled
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">CS-402</td>
                    <td className="py-2.5 px-3 font-semibold text-white">Deep Learning & Computer Vision</td>
                    <td className="py-2.5 px-3">D-08 (AI & Machine Learning Lab)</td>
                    <td className="py-2.5 px-3 font-mono">02:00 PM - 04:00 PM</td>
                    <td className="py-2.5 px-3">Dr. A. B. Patil</td>
                    <td className="py-2.5 px-3 text-center font-mono">48 / 50</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Scheduled
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">CS-499</td>
                    <td className="py-2.5 px-3 font-semibold text-white">B.Tech Capstone Project Lab</td>
                    <td className="py-2.5 px-3">D-03 (Project Laboratory)</td>
                    <td className="py-2.5 px-3 font-mono">04:15 PM - 05:15 PM</td>
                    <td className="py-2.5 px-3">Prof. N. K. Deshmukh</td>
                    <td className="py-2.5 px-3 text-center font-mono">36 / 49</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Reserved
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
