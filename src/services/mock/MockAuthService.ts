import { IAuthService } from '../types';
import { User, ApiResponse, Role } from '../../types';
import { usersData } from '../../data/mock';
import { getUserUuid } from '../../utils';
import { recordAuditLog } from '../supabase/auditLog.service';

const USERS_KEY = 'smart_campus_rit_users_v3';
const CURRENT_USER_KEY = 'smart_campus_auth_user';

function getStoredUsers(): User[] {
  const defaultAnyaUser: User = {
    id: '10000000-0000-0000-0000-000002553018',
    name: 'Anya Bandgar',
    email: 'anyabandgar458@gmail.com',
    role: 'student',
    department: 'Computer Science & Engineering',
    profile: { phone: '+91 98765 43210' },
    createdAt: '2026-10-01T00:00:00.000Z',
  };

  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        parsed.forEach((u: User) => {
          const properId = getUserUuid(u);
          if (u.id !== properId) {
            u.id = properId;
            modified = true;
          }
          if (/^\d{7}@ritindia\.edu$/i.test(u.email) && u.role !== 'student') {
            u.role = 'student';
            if (u.email === '2553018@ritindia.edu') {
              u.name = 'Anya Bandgar';
            }
            modified = true;
          }
        });
        if (!parsed.some((u: User) => u.email?.toLowerCase() === 'anyabandgar458@gmail.com')) {
          parsed.push(defaultAnyaUser);
          modified = true;
        }
        if (modified) {
          localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  const initialized = (usersData as any[]).map((u) => ({
    ...u,
    id: getUserUuid(u),
  }));
  if (!initialized.some((u: any) => u.email?.toLowerCase() === 'anyabandgar458@gmail.com')) {
    initialized.push(defaultAnyaUser);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(initialized));
  return initialized as User[];
}

export class MockAuthService implements IAuthService {
  async login(credentials: { email: string; password: string; role?: Role }): Promise<ApiResponse<{ token: string; user: User }>> {
    await new Promise((r) => setTimeout(r, 200));

    const trimmedEmail = credentials.email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Please provide a valid email address.',
          },
        },
      };
    }

    const isStudentEmail = /^\d{7}@ritindia\.edu$/i.test(trimmedEmail);
    const users = getStoredUsers();
    let user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    const targetRole: Role = user?.role || (isStudentEmail ? 'student' : credentials.role || 'student');

    if (user) {
      // Self-heal student integrity if corrupted
      if (isStudentEmail && user.role !== 'student') {
        user.role = 'student';
        if (user.email === '2553018@ritindia.edu' || user.email === 'anyabandgar458@gmail.com') {
          user.name = 'Anya Bandgar';
        }
        const idx = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
        if (idx !== -1) {
          users[idx] = user;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      }
    } else {
      // Dynamically provision for account
      const prefix = trimmedEmail.split('@')[0];
      const isNumeric = /^\d+$/.test(prefix);
      const capitalizedName = trimmedEmail.includes('anyabandgar')
        ? 'Anya Bandgar'
        : isNumeric
        ? `Student (${prefix})`
        : prefix
            .split(/[._-]/)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');

      user = {
        id: getUserUuid({ email: trimmedEmail, role: targetRole }),
        name: capitalizedName || 'Campus User',
        email: trimmedEmail,
        role: targetRole,
        department: 'Computer Science & Engineering',
        profile: {
          phone: '+91 98765 43210',
        },
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    const token = `mock_jwt_token_${user.id}_${Date.now()}`;
    localStorage.setItem('smart_campus_auth_token', token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    // Stream user login activity to Supabase audit_log with email
    recordAuditLog({
      action: 'USER_SIGNED_IN',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      actorEmail: user.email,
      after: {
        email: user.email,
        userEmail: user.email,
        actorEmail: user.email,
        userName: user.name,
        role: user.role,
        department: user.department,
        timestamp: new Date().toISOString(),
      },
    }).catch((e) => console.warn('[Supabase Realtime] Login audit notice:', e));

    return {
      success: true,
      message: 'Login successful',
      data: { token, user },
    };
  }

  async register(data: { name: string; email: string; password: string; role: string; department?: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    await new Promise((r) => setTimeout(r, 250));

    const trimmedEmail = data.email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Please enter a valid email address (e.g. anyabandgar458@gmail.com or 2553018@ritindia.edu).',
          },
        },
      };
    }

    if (!data.name || data.name.trim().length < 2) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Please provide your full name.',
          },
        },
      };
    }

    const users = getStoredUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
    if (existingIndex !== -1) {
      // If already registered, update name & role
      const existingUser = users[existingIndex];
      existingUser.name = data.name.trim();
      existingUser.role = (data.role as Role) || existingUser.role;
      existingUser.department = data.department || existingUser.department;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      const token = `mock_jwt_token_${existingUser.id}_${Date.now()}`;
      localStorage.setItem('smart_campus_auth_token', token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));

      recordAuditLog({
        action: 'USER_ACCOUNT_CREATED',
        actorId: existingUser.id,
        actorName: existingUser.name,
        actorRole: existingUser.role,
        actorEmail: existingUser.email,
        after: {
          email: existingUser.email,
          userEmail: existingUser.email,
          actorEmail: existingUser.email,
          userName: existingUser.name,
          role: existingUser.role,
          department: existingUser.department,
          timestamp: new Date().toISOString(),
        },
      }).catch((e) => console.warn('[Supabase Realtime] Registration audit notice:', e));

      return {
        success: true,
        message: 'Account verified and signed in successfully',
        data: { token, user: existingUser },
      };
    }

    const newUser: User = {
      id: getUserUuid({ email: trimmedEmail, role: data.role }),
      name: data.name.trim(),
      email: trimmedEmail,
      role: (data.role as Role) || 'student',
      department: data.department || 'Computer Science & Engineering',
      profile: {
        phone: '+91 98765 43210',
      },
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('smart_campus_auth_token', token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    // Stream user registration activity to Supabase audit_log with email
    recordAuditLog({
      action: 'USER_ACCOUNT_CREATED',
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: newUser.role,
      actorEmail: newUser.email,
      after: {
        email: newUser.email,
        userEmail: newUser.email,
        actorEmail: newUser.email,
        userName: newUser.name,
        role: newUser.role,
        department: newUser.department,
        timestamp: new Date().toISOString(),
      },
    }).catch((e) => console.warn('[Supabase Realtime] Registration audit notice:', e));

    return {
      success: true,
      message: 'Account created successfully',
      data: { token, user: newUser },
    };
  }

  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    localStorage.removeItem('smart_campus_auth_token');
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    await new Promise((r) => setTimeout(r, 100));
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) {
      throw {
        response: {
          status: 401,
          data: { success: false, message: 'Unauthenticated' },
        },
      };
    }
    return {
      success: true,
      message: 'User profile retrieved',
      data: JSON.parse(stored),
    };
  }
}
