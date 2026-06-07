import { usePage } from '@inertiajs/react';
import type { User } from '@/types';

export type PermissionUser =
    | Pick<User, 'roles' | 'permissions'>
    | null
    | undefined;

export function hasPermission(
    user: PermissionUser,
    permission?: string,
): boolean {
    if (!permission) {
        return true;
    }

    return user?.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(
    user: PermissionUser,
    permissions: string[] = [],
): boolean {
    if (permissions.length === 0) {
        return true;
    }

    return permissions.some((permission) => hasPermission(user, permission));
}

export function hasRole(user: PermissionUser, role?: string): boolean {
    if (!role) {
        return true;
    }

    return user?.roles?.includes(role) ?? false;
}

export function hasAnyRole(
    user: PermissionUser,
    roles: string[] = [],
): boolean {
    if (roles.length === 0) {
        return true;
    }

    return roles.some((role) => hasRole(user, role));
}

export function usePermission() {
    const { auth } = usePage().props;
    const user = auth.user;

    return {
        user,
        hasPermission: (permission?: string) => hasPermission(user, permission),
        hasAnyPermission: (permissions: string[] = []) =>
            hasAnyPermission(user, permissions),
        hasRole: (role?: string) => hasRole(user, role),
        hasAnyRole: (roles: string[] = []) => hasAnyRole(user, roles),
    };
}

export function useCan(permission?: string): boolean {
    return usePermission().hasPermission(permission);
}

export function useRole(role?: string): boolean {
    return usePermission().hasRole(role);
}
