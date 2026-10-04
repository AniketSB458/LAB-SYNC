import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth, useTheme } from '../../hooks';
import { useNotifications } from '../../hooks';
import { Role } from '../../types';
import { ThemeToggle, RITLogo, AuthDetailsModal } from '../common';
import { ServicesLauncher } from './ServicesLauncher';
import { ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, role, logout } = useAuth();
  const { isGoldPink, isEmeraldMint } = useTheme();
  const { data: notifications = [], markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userDisplayName = user?.name
    ? user.role === 'faculty' && user.name.startsWith('Student (')
      ? user.name.replace(/^Student \(/, 'Prof. (')
      : user.role === 'admin' && user.name.startsWith('Student (')
      ? user.name.replace(/^Student \(/, 'Admin (')
      : user.name
    : 'Guest';

  const unreadCount = notifications.filter((n) => !n.read).length;

  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifMenu(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    if (showNotifMenu || showUserMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showNotifMenu, showUserMenu]);

  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/dashboard')) return 'Dashboard Overview';
    if (pathname.includes('/labs/')) return 'Facility Details & Hardware';
    if (pathname.includes('/labs')) return role === 'admin' ? 'Laboratory Facility Directory' : 'Facility Discovery & Availability';
    if (pathname.includes('/bookings/create')) return 'Reserve Workstation';
    if (pathname.includes('/bookings/')) return 'Reservation Details & Queue Tracker';
    if (pathname.includes('/bookings')) return role === 'admin' ? 'Campus Bookings Registry' : 'My Scheduled Reservations';
    if (pathname.includes('/resources/create')) return 'Register New Hardware';
    if (pathname.includes('/resources/')) return 'Hardware Specifications & Status';
    if (pathname.includes('/resources')) return 'Hardware Resource Inventory';
    if (pathname.includes('/maintenance')) return 'Preventative Maintenance Console';
    if (pathname.includes('/monitoring')) return 'Live Operational Telemetry';
    if (pathname.includes('/reports')) return 'Campus Utilization & Analytics';
    if (pathname.includes('/route')) return 'Campus Wayfinding Navigation';
    if (pathname.includes('/profile')) return 'Account & Identity Profile';
    return '';
  };

  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="app-titlebar titlebar sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 max-w-full">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial overflow-hidden mr-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Toggle navigation"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group min-w-0 shrink">
            <RITLogo
              className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-105 transition-transform shrink-0"
              variant="mark"
              rounded="xl"
            />
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                  RIT LabSync
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hidden xs:inline-block shrink-0">
                  RIT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">Rajarambapu Institute of Technology</p>
            </div>
          </Link>

          {/* Desktop Dynamic Page Title */}
          {pageTitle && (
            <div className="hidden xl:flex items-center gap-2 pl-4 ml-2 border-l border-slate-800">
              <span className="text-xs font-semibold text-slate-300 tracking-tight">{pageTitle}</span>
            </div>
          )}
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Services Quick Launcher */}
          <ServicesLauncher />

          {/* Theme Switcher Icon */}
          <ThemeToggle />

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs sm:hidden"
                  onClick={() => setShowNotifMenu(false)}
                />
                <div
                  className={`fixed sm:absolute inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:top-full mt-1.5 w-auto sm:w-96 max-w-sm rounded-2xl border shadow-2xl p-3.5 sm:p-4 z-50 animate-in fade-in slide-in-from-top-2 ${
                    isGoldPink
                      ? 'bg-white border-pink-200 text-slate-800'
                      : isEmeraldMint
                      ? 'bg-slate-950 border-emerald-500/50 shadow-emerald-950/95 text-slate-100'
                      : 'bg-slate-950 border-indigo-500/50 shadow-slate-950/95 text-slate-100'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between pb-3 border-b ${
                      isGoldPink ? 'border-pink-100' : isEmeraldMint ? 'border-emerald-900/60' : 'border-slate-800'
                    }`}
                  >
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isGoldPink ? 'text-slate-800' : isEmeraldMint ? 'text-emerald-300' : 'text-slate-200'
                      }`}
                    >
                      System Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isGoldPink
                            ? 'bg-pink-100 text-pink-700'
                            : isEmeraldMint
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead.mutate()}
                      className={`text-[11px] font-medium transition-colors ${
                        isGoldPink ? 'text-pink-600 hover:text-pink-700' : isEmeraldMint ? 'text-emerald-400 hover:text-emerald-300' : 'text-indigo-400 hover:text-indigo-300'
                      }`}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="py-2 divide-y divide-slate-800/60 max-h-72 sm:max-h-80 overflow-y-auto space-y-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No recent notifications</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) {
                            markAsRead.mutate(n.id);
                          }
                        }}
                        className={`py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl transition-all cursor-pointer ${
                          !n.read
                            ? isGoldPink
                              ? 'bg-pink-50 border border-pink-200 hover:bg-pink-100 text-slate-800'
                              : isEmeraldMint
                              ? 'bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900 text-slate-100 shadow-sm'
                              : 'bg-indigo-950 border border-indigo-500/50 hover:bg-indigo-900 text-slate-100 shadow-sm'
                            : isGoldPink
                            ? 'hover:bg-slate-100 text-slate-700'
                            : isEmeraldMint
                            ? 'bg-slate-900/90 border border-slate-800/80 hover:bg-emerald-950/70 text-slate-300'
                            : 'bg-slate-900/90 border border-slate-800/80 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!n.read && (
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isGoldPink ? 'bg-pink-500' : isEmeraldMint ? 'bg-emerald-400' : 'bg-indigo-400'
                                }`}
                              />
                            )}
                            <span
                              className={`text-xs font-bold truncate ${
                                isGoldPink ? 'text-slate-800' : 'text-slate-100'
                              }`}
                            >
                              {n.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-snug break-words ${isGoldPink ? 'text-slate-600' : 'text-slate-300'}`}>
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span
                            className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded ${
                              isGoldPink ? 'bg-slate-200 text-slate-700' : isEmeraldMint ? 'bg-emerald-900/80 text-emerald-300' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {n.type || 'info'}
                          </span>
                          {!n.read && (
                            <span
                              className={`text-[10px] hover:underline ${
                                isGoldPink ? 'text-pink-600' : isEmeraldMint ? 'text-emerald-400' : 'text-indigo-400'
                              }`}
                            >
                              Mark read
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pl-2 rounded-xl border transition-all text-left ${
                isGoldPink
                  ? 'bg-white border-pink-200 hover:border-pink-300 text-slate-800 shadow-sm'
                  : isEmeraldMint
                  ? 'bg-emerald-950 border-emerald-500/50 hover:border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-950/60 font-medium'
                  : 'bg-slate-900 border-indigo-500/50 hover:border-indigo-400 text-slate-100 shadow-lg shadow-slate-950/60 font-medium'
              }`}
              aria-label="User Profile"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  isGoldPink
                    ? 'bg-pink-100 border-pink-200 text-pink-700'
                    : isEmeraldMint
                    ? 'bg-emerald-900 border-emerald-400/50 text-emerald-300'
                    : 'bg-indigo-950 border-indigo-400/50 text-indigo-300'
                }`}
              >
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold leading-tight">{userDisplayName}</p>
                <p className={`text-[10px] capitalize ${isGoldPink ? 'text-slate-500' : 'text-slate-400'}`}>{role || 'User'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs sm:hidden"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className={`fixed sm:absolute inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:top-full mt-1.5 w-auto sm:w-64 max-w-sm rounded-xl border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 ${
                    isGoldPink
                      ? 'bg-white border-pink-200 text-slate-800'
                      : isEmeraldMint
                      ? 'bg-slate-950 border-emerald-500/50 shadow-emerald-950/95 text-slate-100'
                      : 'bg-slate-950 border-indigo-500/50 shadow-slate-950/95 text-slate-100'
                  }`}
                >
                  <div
                    className={`px-3 py-2 border-b ${
                      isGoldPink ? 'border-pink-100' : isEmeraldMint ? 'border-emerald-900/60' : 'border-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold">{userDisplayName}</p>
                    <p className={`text-[11px] truncate ${isGoldPink ? 'text-slate-500' : 'text-slate-400'}`}>{user?.email}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        isGoldPink
                          ? 'bg-pink-100 text-pink-700 border-pink-200'
                          : isEmeraldMint
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      Role: {role}
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAuthModal(true);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors text-left font-medium ${
                        isEmeraldMint
                          ? 'text-emerald-300 hover:bg-emerald-950'
                          : 'text-indigo-300 hover:bg-indigo-950'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Live Auth & Session Details</span>
                    </button>

                    <Link
                      to={`/${role || 'student'}/profile`}
                      onClick={() => setShowUserMenu(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                        isEmeraldMint
                          ? 'text-slate-200 hover:text-white hover:bg-emerald-950'
                          : 'text-slate-200 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>My Profile & Auth</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthDetailsModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};


