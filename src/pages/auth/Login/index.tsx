import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertTriangle, GraduationCap, BookOpen, Shield } from 'lucide-react';
import { Button, Input, ErrorMessage } from '../../../components/common';
import { useAuth, useTheme } from '../../../hooks';
import { Role } from '../../../types';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const { isGoldPink, isEmeraldMint } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;
  const isSessionExpired =
    (location.state as any)?.sessionExpired ||
    new URLSearchParams(location.search).get('expired') === 'true';

  // Automatically redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && role && !isSessionExpired) {
      if (from && !from.includes('/login') && !from.includes('/unauthorized')) {
        navigate(from, { replace: true });
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'faculty') {
        navigate('/faculty/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, role, isSessionExpired, from, navigate]);

  // Handle Role selection without overwriting user's input
  const handleRoleSelect = (newRole: Role) => {
    setSelectedRole(newRole);
    setError(null);
  };

  // Handle typing with smart auto-role synchronization
  const handleEmailChange = (val: string) => {
    setEmailOrUsername(val);
    setError(null);
    const clean = val.trim().toLowerCase();
    if (!clean) return;

    const prefix = clean.includes('@') ? clean.split('@')[0] : clean;

    if (prefix.startsWith('admin')) {
      setSelectedRole('admin');
    } else if (/^\d+$/.test(prefix)) {
      // 7-digit PRN numbers -> student
      setSelectedRole('student');
    } else if (clean.includes('@ritindia.edu') || clean.includes('@') || prefix.length >= 3) {
      // Non-numeric email like asb@ritindia.edu -> strictly Faculty
      setSelectedRole('faculty');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedInput = emailOrUsername.trim().toLowerCase();

    if (!trimmedInput || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    // Auto-append @ritindia.edu if user entered only their 7-digit PRN
    if (!trimmedInput.includes('@') && /^\d{7}$/.test(trimmedInput)) {
      trimmedInput = `${trimmedInput}@ritindia.edu`;
      setEmailOrUsername(trimmedInput);
    }

    // STRICT CHECK: ONLY institutional accounts ending with @ritindia.edu are authorized
    if (!trimmedInput.endsWith('@ritindia.edu')) {
      setError('Access Denied: Only official campus accounts ending with @ritindia.edu are authorized to sign in.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Determine the user's TRUE role strictly as per the email provided:
    // - Student: strictly 7-digit PRN @ritindia.edu (e.g. 2553018@ritindia.edu)
    // - Admin: starts with admin (e.g. admin.office@ritindia.edu)
    // - Faculty: any name / initials email (e.g. asb@ritindia.edu, faculty.patil@ritindia.edu)
    const usernamePart = trimmedInput.split('@')[0];
    const isStudentEmail = /^\d{7}$/.test(usernamePart);
    const isAdminEmail = /^admin(\.[a-z0-9._-]+)?$/.test(usernamePart);

    let effectiveRole: Role = 'faculty';
    if (isStudentEmail) {
      effectiveRole = 'student';
    } else if (isAdminEmail) {
      effectiveRole = 'admin';
    } else {
      effectiveRole = 'faculty';
    }

    // If student tab was selected but user entered asb@ritindia.edu, switch tab to faculty immediately!
    if (selectedRole !== effectiveRole) {
      setSelectedRole(effectiveRole);
    }

    setError(null);
    setIsLoading(true);

    try {
      const authenticatedUser = await login({
        email: trimmedInput,
        password,
        role: effectiveRole,
      });
      const targetRole = authenticatedUser?.role || effectiveRole;

      if (from && !from.includes('/login') && !from.includes('/unauthorized')) {
        navigate(from, { replace: true });
      } else if (targetRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (targetRole === 'faculty') {
        navigate('/faculty/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication error. Please verify and retry.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2
          className={`text-xl font-bold tracking-tight transition-colors ${
            isGoldPink ? 'text-slate-900' : 'text-white'
          }`}
        >
          Sign In to Campus Portal
        </h2>
        <p
          className={`text-xs mt-1 transition-colors ${
            isGoldPink ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Access laboratories, book resources, and track status
        </p>
      </div>

      {isSessionExpired && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2.5 text-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Your session has expired. Please sign in again with your credentials.</span>
        </div>
      )}

      {error && (
        <ErrorMessage
          title="Authentication Failed"
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 1. Email Input */}
        <div>
          <Input
            label={
              selectedRole === 'faculty'
                ? 'Faculty Email Address'
                : selectedRole === 'admin'
                ? 'Administrator Email Address'
                : 'Student Email / Campus PRN'
            }
            type="text"
            placeholder={
              selectedRole === 'faculty'
                ? 'faculty.name@ritindia.edu'
                : selectedRole === 'admin'
                ? 'admin.office@ritindia.edu'
                : 'eg., 7-digit PRN @ritindia.edu'
            }
            value={emailOrUsername}
            onChange={(e) => handleEmailChange(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
          />
        </div>

        {/* 2. Password Input */}
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`transition-colors focus:outline-none ${
                isGoldPink
                  ? 'text-slate-400 hover:text-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="current-password"
          required
        />

        {/* 3. Role Selector (After Password) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isGoldPink ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Sign In As Role
            </label>
            <span
              className={`text-[10px] font-medium capitalize ${
                isGoldPink ? 'text-pink-600' : 'text-indigo-400'
              }`}
            >
              Active: {selectedRole}
            </span>
          </div>

          <div
            className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border transition-colors ${
              isGoldPink
                ? 'bg-rose-50/60 border-pink-200/80'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            {[
              { id: 'student' as Role, label: 'Student', icon: GraduationCap },
              { id: 'faculty' as Role, label: 'Faculty', icon: BookOpen },
              { id: 'admin' as Role, label: 'Admin', icon: Shield },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? isGoldPink
                        ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-sm shadow-pink-500/30'
                        : isEmeraldMint
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : isGoldPink
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-pink-100/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Submit Button */}
        <Button
          type="submit"
          className={`w-full mt-2 transition-all ${
            isGoldPink
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white shadow-md shadow-pink-500/25 border-transparent'
              : ''
          }`}
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </Button>
      </form>

      <div
        className={`pt-2 text-center border-t transition-colors ${
          isGoldPink ? 'border-pink-100/90 text-slate-500' : 'border-slate-800/80 text-slate-500'
        }`}
      >
        <p className="text-[11px]">
          Smart Campus Resource Management System
        </p>
        <p
          className={`text-[10px] font-mono font-bold tracking-wider uppercase mt-1 ${
            isGoldPink ? 'text-pink-600' : 'text-slate-400'
          }`}
        >
          MADE BY 458TM
        </p>
      </div>
    </div>
  );
};

