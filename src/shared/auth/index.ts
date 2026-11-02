export { buildAccountRedirectUrl } from './accountUrl.ts';
export {
  deleteMyAccount,
  getCurrentSession,
  onAuthStateChange,
  signIn,
  signOut,
  signUp,
} from './authClient.ts';
export { AuthProvider } from './authContextState.tsx';
export { useAuth } from './useAuth.ts';
export type { AuthContextValue } from './authContextState.tsx';
export type {
  AuthFailure,
  AuthResult,
  AuthStateCallback,
  AuthStateSubscription,
  AuthSuccess,
  SessionResult,
} from './types.ts';
