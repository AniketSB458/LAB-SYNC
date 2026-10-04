import { IAuthService } from '../types';
import { User, ApiResponse, Role } from '../../types';
import { usersData } from '../../data/mock';
import { getUserUuid } from '../../utils';
import { recordAuditLog } from '../supabase/auditLog.service';

const USERS_KEY = 'smart_campus_rit_users_v6';
const CURRENT_USER_KEY = 'smart_campus_auth_user';

function getStoredUsers(): User[] {
  const defaultStandardUsers: User[] = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Anya Bandgar',
      email: '2553018@ritindia.edu',
      role: 'student',
      department: 'Computer Science & Engineering',
      profile: { phone: '+91 98765 43210' },
      createdAt: '2026-01-15T08:00:00.000Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Prof. Rajesh Patil',
      email: 'faculty.name@ritindia.edu',
      role: 'faculty',
      department: 'Computer Science & Engineering',
      profile: { phone: '+91 98220 12345' },
      createdAt: '2025-08-20T08:00:00.000Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      name: 'Dr. Vikramaditya Admin',
      email: 'admin.office@ritindia.edu',
      role: 'admin',
      department: 'Campus Resource Administration',
      profile: { phone: '+91 94220 98765' },
      createdAt: '2025-01-10T08:00:00.000Z',
    },
  ];

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
            modified = true;
          }
          if (/^faculty(\.[a-z0-9._-]+)?@ritindia\.edu$/i.test(u.email) && u.role !== 'faculty') {
            u.role = 'faculty';
            modified = true;
          }
          if (/^admin(\.[a-z0-9._-]+)?@ritindia\.edu$/i.test(u.email) && u.role !== 'admin') {
            u.role = 'admin';
            modified = true;
          }
        });

        defaultStandardUsers.forEach((def) => {
          if (!parsed.some((u: User) => u.email?.toLowerCase() === def.email.toLowerCase())) {
            parsed.push(def);
            modified = true;
          }
        });

        if (modified) {
          localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  const initialized: User[] = (usersData as any[]).map((u) => ({
    ...u,
    id: getUserUuid(u),
  }));

  defaultStandardUsers.forEach((def) => {
    if (!initialized.some((u) => u.email?.toLowerCase() === def.email.toLowerCase())) {
      initialized.push(def);
    }
  });

  localStorage.setItem(USERS_KEY, JSON.stringify(initialized));
  return initialized;
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

    if (!trimmedEmail.endsWith('@ritindia.edu')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Unauthorized domain. Only official campus accounts ending with @ritindia.edu are authorized.',
          },
        },
      };
    }

    const usernamePart = trimmedEmail.split('@')[0];
    const isStudentEmail = /^\d{7}$/.test(usernamePart);
    const isAdminEmail = /^admin(\.[a-z0-9._-]+)?$/.test(usernamePart);

    const targetRole: Role = isStudentEmail
      ? 'student'
      : isAdminEmail
      ? 'admin'
      : 'faculty';

    const users = getStoredUsers();
    let user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (user) {
      if (user.role !== targetRole) {
        user.role = targetRole;
        const idx = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
        if (idx !== -1) {
          users[idx] = user;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      }
    } else {
      // Dynamically provision account
      const prefix = usernamePart;
      const isNumeric = /^\d+$/.test(prefix);
      const capitalizedName = isNumeric
        ? `Student (${prefix})`
        : prefix === 'asb'
        ? 'Prof. A. S. Bandgar'
        : prefix
            .split(/[._-]/)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');

      user = {
        id: getUserUuid({ email: trimmedEmail, role: targetRole }),
        name: capitalizedName || 'Campus User',
        email: trimmedEmail,
        role: targetRole,
        department: targetRole === 'admin' ? 'Campus Resource Administration' : 'Computer Science & Engineering',
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
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.endsWith('@ritindia.edu')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Registration is restricted to official campus accounts ending with @ritindia.edu.',
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
