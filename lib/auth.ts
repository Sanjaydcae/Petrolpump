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

// ===== ROLE-BASED PERMISSION CHECKS =====
// Admin: Can do everything
// Owner: Can save, edit, approve (no master reset, no create/delete users)
// Manager: Can only save data (no edit, delete, approve)

// Check if user can save/add new data
export function canSave(role: UserRole): boolean {
    return true; // All roles can save new data
}

// Check if user can edit existing data
export function canEdit(role: UserRole): boolean {
    return role === 'admin' || role === 'owner';
}

// Check if user can delete data
export function canDelete(role: UserRole): boolean {
    return role === 'admin'; // Only admin can delete
}

// Check if user can approve sheets
export function canApprove(role: UserRole): boolean {
    return role === 'admin' || role === 'owner';
}

// Check if user can manage users (create/delete users)
export function canManageUsers(role: UserRole): boolean {
    return role === 'admin'; // Only admin
}

// Check if user can do master reset
export function canMasterReset(role: UserRole): boolean {
    return role === 'admin'; // Only admin
}

// Check if user can access settings
export function canAccessSettings(role: UserRole): boolean {
    return role === 'admin' || role === 'owner';
}

// Check if user can edit tank readings
export function canEditTank(role: UserRole): boolean {
    return role === 'admin' || role === 'owner';
}

// Check if user can delete tank readings
export function canDeleteTank(role: UserRole): boolean {
    return role === 'admin';
}
