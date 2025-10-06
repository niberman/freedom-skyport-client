import { useAuth } from './useAuth';

export function useRoleCheck() {
  const { userRole } = useAuth();

  return {
    hasRole: (role: 'owner' | 'instructor' | 'admin') => userRole === role,
    isOwner: userRole === 'owner',
    isInstructor: userRole === 'instructor',
    isAdmin: userRole === 'admin',
    role: userRole,
  };
}
