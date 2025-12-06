// Authentication utilities
export type UserRole = 'admin' | 'owner' | 'manager';

export interface AuthUser {
    id: number;
    username: string;
    role: UserRole;
}

// Simple password hashing (for demonstration - in production use bcrypt)
export function hashPassword(password: string): string {
    // Using a simple base64 encoding for now
    // In production, use bcrypt or similar
    return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

// Session management
export function setAuth(user: AuthUser) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(user));
    }
}

export function getAuth(): AuthUser | null {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem('auth_user');
        return data ? JSON.parse(data) : null;
    }
    return null;
}

export function clearAuth() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
    }
}

export function isAuthenticated(): boolean {
    return getAuth() !== null;
}

// Permission checks
export function canDelete(role: UserRole): boolean {
    return role === 'admin';
}

export function canEdit(role: UserRole): boolean {
    return role === 'admin' || role === 'owner';
}

export function canAdd(role: UserRole): boolean {
    return true; // All roles can add
}

export function canManageUsers(role: UserRole): boolean {
    return role === 'admin';
}
