import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Search,
  RefreshCw,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Clock,
  Radio,
  User as UserIcon,
  Copy,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAllUsers, useAllBookings, useAuth } from '../../hooks';
import { User, Role } from '../../types';

export const SignedInUsersDirectory: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, refetch, isRefetching } = useAllUsers();
  const { data: allBookings = [] } = useAllBookings();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'active_booking'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Active bookings indexed by user email or name
  const activeBookingsByUser = useMemo(() => {
    const map = new Map<string, any>();
    allBookings
      .filter((b) => b.status === 'ACTIVE' || b.status === 'CONFIRMED')
      .forEach((b) => {
        const userName =
          typeof b.user === 'object' && b.user !== null ? (b.user as any).name : String(b.user || '');
        const userEmail =
          typeof b.user === 'object' && b.user !== null ? (b.user as any).email : '';
        if (userEmail) map.set(userEmail.toLowerCase(), b);
        if (userName) map.set(userName.toLowerCase(), b);
      });
    return map;
  }, [allBookings]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Metrics
  const totalCount = users.length;
  const studentCount = users.filter((u) => u.role === 'student').length;
  const facultyCount = users.filter((u) => u.role === 'faculty').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeSessionsCount = users.filter((u) => {
    const isCurrent = currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase();
    const hasBooking = activeBookingsByUser.has((u.email || '').toLowerCase()) || activeBookingsByUser.has((u.name || '').toLowerCase());
    return isCurrent || hasBooking;
  }).length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const isCurrent = currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase();
      const hasBooking =
        activeBookingsByUser.has((u.email || '').toLowerCase()) ||
        activeBookingsByUser.has((u.name || '').toLowerCase());

      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));

      // Role Filter
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      // Status Filter
      let matchesStatus = true;
      if (statusFilter === 'online') {
        matchesStatus = Boolean(isCurrent);
      } else if (statusFilter === 'active_booking') {
        matchesStatus = Boolean(hasBooking);
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter, currentUser, activeBookingsByUser]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Registered in RIT LabSync</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Today</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeSessionsCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Online or active lab booking</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
            <Laptop className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">{studentCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Institutional PRN logins</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{facultyCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Professors & Instructors</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Administrators</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">{adminCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Full System Controller</p>
        </div>
      </div>

      {/* Supabase Cloud Live Sync Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Live Supabase Authentication Sync</h4>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ksecnwtqykmqfidspuzt
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              User identity, role mappings, and authentication sessions are synchronized between local session stores and Supabase PostgreSQL <code className="text-indigo-300">public.profiles</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh accounts directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync Live</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/ksecnwtqykmqfidspuzt/auth/users"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
          >
            <span>Supabase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Directory Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, @ritindia.edu email, or PRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-500 px-2 font-semibold">Role:</span>
            {(['all', 'student', 'faculty', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-500 px-2 font-semibold">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                statusFilter === 'online'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Now</span>
            </button>
            <button
              onClick={() => setStatusFilter('active_booking')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'active_booking'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-indigo-400'
              }`}
            >
              In Lab
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">User & Institutional Identity</th>
                <th className="py-3 px-4 font-semibold">Campus Role</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Live Session Status</th>
                <th className="py-3 px-4 font-semibold">Workstation / Lab Lease</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
                    <span>Loading registered users from Supabase...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No registered user accounts match your search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent =
                    currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase();
                  const booking =
                    activeBookingsByUser.get((u.email || '').toLowerCase()) ||
                    activeBookingsByUser.get((u.name || '').toLowerCase());

                  return (
                    <tr
                      key={u.id || u.email}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                              u.role === 'admin'
                                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                                : u.role === 'faculty'
                                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{u.name || 'Campus Member'}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{u.email}</span>
                              <button
                                onClick={() => handleCopyEmail(u.email)}
                                title="Copy Email"
                                className="text-slate-500 hover:text-slate-300 ml-0.5"
                              >
                                {copiedEmail === u.email ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : u.role === 'faculty'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : u.role === 'faculty' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <UserIcon className="w-3 h-3" />
                          )}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-medium">
                          {u.department || 'Computer Science & Engineering'}
                        </span>
                      </td>

                      {/* Live Session Status */}
                      <td className="py-3 px-4">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Online Now
                          </span>
                        ) : booking ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            <Laptop className="w-3 h-3" />
                            Active in Lab
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Clock className="w-3 h-3" />
                            Registered Account
                          </span>
                        )}
                      </td>

                      {/* Workstation / Lab Lease */}
                      <td className="py-3 px-4">
                        {booking ? (
                          <div>
                            <span className="font-semibold text-slate-200">
                              {typeof booking.lab === 'object' && booking.lab !== null
                                ? (booking.lab as any).name
                                : booking.lab}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {booking.startTime} - {booking.endTime} &bull; ID: {booking.bookingId}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">No active workstation lease</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active Member'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
