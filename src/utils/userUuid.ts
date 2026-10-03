/**
 * Utility to generate stable, unique, and valid UUIDs for users.
 * Ensures every student, faculty, and administrator receives a distinct row
 * in Supabase's `profiles` table instead of collapsing into only 3 shared role slots.
 */

export function generateDeterministicUuid(seed: string): string {
  const str = seed.toLowerCase().trim();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x12345678;
  let h4 = 0x87654321;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2718281829);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = ((h2 >>> 16) & 0xffff).toString(16).padStart(4, '0');
  // RFC 4122 version 4 marker
  const p3 = (((h3 >>> 16) & 0x0fff) | 0x4000).toString(16).padStart(4, '0');
  // RFC 4122 variant marker (10xx)
  const p4 = (((h4 >>> 16) & 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const p5 = ((h2 >>> 0).toString(16).padStart(8, '0') + ((h3 >>> 0) & 0xffff).toString(16).padStart(4, '0')).slice(0, 12);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export function getUserUuid(user: { id?: string; email?: string; role?: string } | null | undefined): string {
  if (!user) {
    return '10000000-0000-0000-0000-000000000001';
  }

  // If already a valid 36-character UUID format, return directly
  if (user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
    return user.id.toLowerCase();
  }

  const email = (user.email || '').toLowerCase().trim();

  // Known seeds for historical records and bookings in Supabase
  if (email === '2553018@ritindia.edu') {
    return '10000000-0000-0000-0000-000000000001';
  }
  if (email === 'vp@ritindia.edu') {
    return '10000000-0000-0000-0000-000000000002';
  }
  if (email === 'faculty@ritindia.edu') {
    return '10000000-0000-0000-0000-000000000003';
  }
  if (email === 'vipasb@ritindia.edu') {
    return '10000000-0000-0000-0000-000000000004';
  }
  if (email === 'admin@ritindia.edu') {
    return '10000000-0000-0000-0000-000000000005';
  }

  // Institutional student PRN (7 digits, e.g., 2553019)
  const prnMatch = email.match(/^(\d{7})@ritindia\.edu$/);
  if (prnMatch) {
    return `10000000-0000-0000-0000-00000${prnMatch[1]}`;
  }

  // For any other email or registered user ID, produce a stable deterministic UUID
  const seed = email || user.id || `${user.role || 'user'}`;
  return generateDeterministicUuid(seed);
}
