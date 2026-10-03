import { IAuthService } from '../types';
import { User, ApiResponse, Role } from '../../types';
import { usersData } from '../../data/mock';

const USERS_KEY = 'smart_campus_rit_users_v3';
const CURRENT_USER_KEY = 'smart_campus_auth_user';

function getStoredUsers(): User[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].email?.endsWith('@ritindia.edu')) {
        let modified = false;
        parsed.forEach((u: User) => {
          if (/^\d{7}@ritindia\.edu$/i.test(u.email) && u.role !== 'student') {
            u.role = 'student';
            if (u.email === '2553018@ritindia.edu') {
              u.name = 'Anya Bandgar';
            }
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
  localStorage.setItem(USERS_KEY, JSON.stringify(usersData));
  return usersData as User[];
}

export class MockAuthService implements IAuthService {
  async login(credentials: { email: string; password: string; role?: Role }): Promise<ApiResponse<{ token: string; user: User }>> {
    await new Promise((r) => setTimeout(r, 250));

    const trimmedEmail = credentials.email.trim().toLowerCase();

    // Strict validation: must end with @ritindia.edu
    if (!trimmedEmail.endsWith('@ritindia.edu')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Access restricted: Only institutional emails ending with @ritindia.edu are authorized.',
          },
        },
      };
    }

    const isStudentEmail = /^\d{7}@ritindia\.edu$/i.test(trimmedEmail);

    // Enforce role consistency between selected role and email format
    if (credentials.role) {
      if (credentials.role === 'student' && !isStudentEmail) {
        throw {
          response: {
            data: {
              success: false,
              message: 'Role Mismatch: Student sign-in requires an institutional 7-digit PRN email ending with @ritindia.edu.',
            },
          },
        };
      }
      if (credentials.role !== 'student' && isStudentEmail) {
        throw {
          response: {
            data: {
              success: false,
              message: 'Role Mismatch: This email belongs to a Student account. Please select the "Student" role to sign in.',
            },
          },
        };
      }
    }

    const targetRole: Role = isStudentEmail
      ? 'student'
      : credentials.role || (trimmedEmail.includes('admin') ? 'admin' : 'faculty');

    // Rule 1: Student must have exactly 7 numbers followed by @ritindia.edu
    if (targetRole === 'student') {
      if (!isStudentEmail) {
        throw {
          response: {
            data: {
              success: false,
              message: 'Student email must be exactly 7 digits (PRN/Roll No.) followed by @ritindia.edu.',
            },
          },
        };
      }
    } else {
      // Rule 2: Faculty and Admin: letters and numbers allowed before @ritindia.edu
      const staffRegex = /^[a-zA-Z0-9._%+-]+@ritindia\.edu$/i;
      if (!staffRegex.test(trimmedEmail)) {
        throw {
          response: {
            data: {
              success: false,
              message: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} email must contain valid letters/numbers ending with @ritindia.edu.`,
            },
          },
        };
      }
    }

    const users = getStoredUsers();
    let user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (user) {
      // Self-heal student integrity if corrupted
      if (isStudentEmail && user.role !== 'student') {
        user.role = 'student';
        if (user.email === '2553018@ritindia.edu') {
          user.name = 'Anya Bandgar';
        }
        const idx = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
        if (idx !== -1) {
          users[idx] = user;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      }

      // Check registered role against requested credentials.role
      if (credentials.role && user.role !== credentials.role) {
        throw {
          response: {
            data: {
              success: false,
              message: `Role Mismatch: This account is registered as ${user.role.toUpperCase()}. Please select the "${user.role.charAt(0).toUpperCase() + user.role.slice(1)}" role to sign in.`,
            },
          },
        };
      }
    } else {
      // Dynamically provision for new @ritindia.edu accounts
      const prefix = trimmedEmail.split('@')[0];
      const isNumeric = /^\d+$/.test(prefix);
      const capitalizedName = isNumeric
        ? `Student (${prefix})`
        : prefix
            .split(/[._-]/)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');

      user = {
        id: `usr_${Date.now()}`,
        name: capitalizedName || 'RIT Member',
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

    return {
      success: true,
      message: 'Login successful',
      data: { token, user },
    };
  }

  async register(data: { name: string; email: string; password: string; role: string; department?: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    await new Promise((r) => setTimeout(r, 300));

    const trimmedEmail = data.email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@ritindia.edu')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Registration restricted: Only institutional emails ending with @ritindia.edu are accepted.',
          },
        },
      };
    }

    if (data.role === 'student') {
      const studentRegex = /^\d{7}@ritindia\.edu$/i;
      if (!studentRegex.test(trimmedEmail)) {
        throw {
          response: {
            data: {
              success: false,
              message: 'Student registration requires exactly 7 numbers followed by @ritindia.edu (e.g. 2553018@ritindia.edu).',
            },
          },
        };
      }
    } else {
      const staffRegex = /^[a-zA-Z0-9._%+-]+@ritindia\.edu$/i;
      if (!staffRegex.test(trimmedEmail)) {
        throw {
          response: {
            data: {
              success: false,
              message: `${data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'Staff'} email must contain valid letters or numbers ending with @ritindia.edu.`,
            },
          },
        };
      }
    }

    const users = getStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw {
        response: {
          data: {
            success: false,
            message: 'User with this @ritindia.edu email already exists',
          },
        },
      };
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: trimmedEmail,
      role: data.role as any,
      department: data.department || 'Computer Science & Engineering',
      profile: {},
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('smart_campus_auth_token', token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return {
      success: true,
      message: 'Account registered successfully',
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
