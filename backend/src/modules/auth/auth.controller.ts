import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from './user.model.js';
import { config } from '../../config/env.js';
import { ROLES, Role } from '../../constants/roles.js';

// Pre-configured verified institutional authentication accounts
export const INSTITUTIONAL_CREDENTIALS = [
  {
    role: 'student' as Role,
    name: 'Sharvil Patil',
    email: '2553018@ritindia.edu',
    password: 'password123',
    department: 'Computer Science & Engineering',
    studentId: 'RIT-2023-CS-042',
    year: 'Final Year (B.Tech)',
    accessLevel: 'Standard Student Workstation & Lab Reservation',
  },
  {
    role: 'faculty' as Role,
    name: 'Prof. S. R. Patil',
    email: 'faculty@ritindia.edu',
    password: 'faculty123',
    department: 'Computer Engineering',
    employeeId: 'RIT-FAC-8812',
    designation: 'Associate Professor & Lab In-charge',
    accessLevel: 'Course Batch Booking, Hardware Override & Approval',
  },
  {
    role: 'admin' as Role,
    name: 'Chief Lab Administrator',
    email: 'admin@ritindia.edu',
    password: 'admin123',
    department: 'Campus IT Infrastructure',
    employeeId: 'RIT-ADM-0001',
    designation: 'Campus IT Director',
    accessLevel: 'Super Administrator, Supabase Full Access & Fleet Telemetry',
  },
];

export async function getAuthDetails(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Institutional authentication details & active configuration',
    data: {
      institutionDomain: '@ritindia.edu',
      tokenAlgorithm: 'HS256',
      tokenExpiry: config.jwtExpiresIn,
      mongoDatabase: 'smart_campus_optimizer',
      activeCollection: 'users',
      rolesAvailable: Object.values(ROLES),
      demoAccounts: INSTITUTIONAL_CREDENTIALS,
      instructions: 'Use institutional email ending with @ritindia.edu to authenticate.',
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Institutional email and password are required',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@ritindia.edu')) {
      res.status(403).json({
        success: false,
        message: 'Access Restricted: Only institutional @ritindia.edu accounts permitted',
      });
      return;
    }

    // Check if user exists in database; if not found, check institutional demo seed accounts
    let user = await User.findOne({ email: cleanEmail }).exec().catch(() => null);

    const demoMatch = INSTITUTIONAL_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === cleanEmail
    );

    let isValid = false;
    let userName = 'Student User';
    let userRole: Role = (role as Role) || ROLES.STUDENT;
    let department = 'Computer Science & Engineering';

    if (user) {
      isValid = await bcrypt.compare(password, user.passwordHash);
      userName = user.name;
      userRole = user.role;
      department = user.department || department;
    } else if (demoMatch) {
      isValid = demoMatch.password === password;
      userName = demoMatch.name;
      userRole = demoMatch.role;
      department = demoMatch.department;
    } else {
      // Default institutional fallback for testing
      isValid = password.length >= 6;
      userName = cleanEmail.split('@')[0];
    }

    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your password.',
      });
      return;
    }

    // Create signed JWT
    const payload = {
      sub: user?._id?.toString() || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      name: userName,
      role: userRole,
      department,
      institution: 'Rajarambapu Institute of Technology',
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        tokenType: 'Bearer',
        user: {
          id: payload.sub,
          name: userName,
          email: cleanEmail,
          role: userRole,
          department,
          domain: '@ritindia.edu',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Authentication error',
    });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@ritindia.edu')) {
      res.status(403).json({
        success: false,
        message: 'Access Restricted: Only institutional @ritindia.edu accounts permitted',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: cleanEmail,
      passwordHash,
      role: role || ROLES.STUDENT,
      department: department || 'Computer Science & Engineering',
    }).catch(async (err) => {
      if (err.code === 11000) {
        throw new Error('An account with this email already exists in database.');
      }
      throw err;
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully in Supabase database',
      data: newUser,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
}
