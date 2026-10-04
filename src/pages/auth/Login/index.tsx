import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertTriangle, GraduationCap, BookOpen, Shield, UserPlus, User } from 'lucide-react';
import { Button, Input, ErrorMessage } from '../../../components/common';
import { useAuth, useTheme } from '../../../hooks';
import { Role } from '../../../types';

export const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated, role } = useAuth();
  const { isGoldPink, isEmeraldMint } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [fullName, setFullName] = useState('Anya Bandgar');
  const [emailOrUsername, setEmailOrUsername] = useState('anyabandgar458@gmail.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedInput = emailOrUsername.trim().toLowerCase();

    if (!trimmedInput || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    // Auto-append @ritindia.edu if user only typed their 7-digit PRN
    if (!trimmedInput.includes('@') && /^\d{7}$/.test(trimmedInput)) {
      trimmedInput = `${trimmedInput}@ritindia.edu`;
    }

    if (!trimmedInput.includes('@') || !trimmedInput.includes('.')) {
      setError('Please enter a valid email address (e.g. anyabandgar458@gmail.com or 2553018@ritindia.edu).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setError(null);
    setIsLoading(true);

    try {
      let authenticatedUser;
      if (authMode === 'register') {
        authenticatedUser = await register({
          name: fullName.trim(),
          email: trimmedInput,
          password,
          role: selectedRole,
          department: 'Computer Science & Engineering',
        });
      } else {
        authenticatedUser = await login({
          email: trimmedInput,
          password,
          role: selectedRole,
        });
      }
      const targetRole = authenticatedUser?.role || selectedRole;

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
          {authMode === 'login' ? 'Sign In to Campus Portal' : 'Create Campus Account'}
        </h2>
        <p
          className={`text-xs mt-1 transition-colors ${
            isGoldPink ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          {authMode === 'login'
            ? 'Access laboratories, book resources, and track status'
            : 'Register your email to reserve lab facilities and track audit logs'}
        </p>
      </div>

      {/* Auth Mode Toggle Tabs (Sign In vs Create Account) */}
      <div
        className={`flex rounded-xl p-1 border transition-colors ${
          isGoldPink
            ? 'bg-rose-50/70 border-pink-200'
            : isEmeraldMint
            ? 'bg-slate-900 border-emerald-500/30'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode('login');
            setError(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            authMode === 'login'
              ? isGoldPink
                ? 'bg-white text-pink-700 shadow-sm'
                : isEmeraldMint
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40 shadow-sm'
                : 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('register');
            setError(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            authMode === 'register'
              ? isGoldPink
                ? 'bg-white text-pink-700 shadow-sm'
                : isEmeraldMint
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40 shadow-sm'
                : 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Account</span>
        </button>
      </div>

      {isSessionExpired && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2.5 text-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Your session has expired. Please sign in again with your credentials.</span>
        </div>
      )}

      {error && (
        <ErrorMessage
          title={authMode === 'login' ? 'Authentication Failed' : 'Registration Notice'}
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Role Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isGoldPink ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {authMode === 'login' ? 'Sign In As Role' : 'Account Role'}
            </label>
            <span
              className={`text-[10px] font-medium capitalize ${
                isGoldPink ? 'text-pink-600' : 'text-indigo-400'
              }`}
            >
              Selected: {selectedRole}
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
                  onClick={() => {
                    setSelectedRole(r.id);
                    setError(null);
                  }}
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

        {/* Full Name Input for Registration */}
        {authMode === 'register' && (
          <div>
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Anya Bandgar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />
          </div>
        )}

        {/* Email Input */}
        <div>
          <Input
            label={authMode === 'login' ? 'Email Address / Student PRN' : 'Email Address'}
            type="email"
            placeholder="anyabandgar458@gmail.com or PRN@ritindia.edu"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
          />
        </div>

        {/* Password Input */}
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
          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
          required
        />

        {/* Confirm Password for Register */}
        {authMode === 'register' && (
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required
          />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className={`w-full mt-2 transition-all ${
            isGoldPink
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white shadow-md shadow-pink-500/25 border-transparent'
              : ''
          }`}
          isLoading={isLoading}
          leftIcon={authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        >
          {authMode === 'login'
            ? `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
            : `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`}
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

