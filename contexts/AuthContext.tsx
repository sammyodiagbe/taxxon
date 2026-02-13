'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, AuthState, LoginCredentials, SignupCredentials, StoredUser } from '@/types/auth';
import {
  getStoredUsers,
  saveStoredUsers,
  getCurrentUserId,
  setCurrentUserId,
  hashPassword,
  verifyPassword,
} from '@/lib/storage';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      const users = getStoredUsers();
      const user = users.find((u) => u.id === userId);
      if (user) {
        const { passwordHash: _, ...safeUser } = user;
        dispatch({ type: 'SET_USER', payload: safeUser });
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    } else {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!user) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Invalid email or password' };
    }

    const isValid = await verifyPassword(credentials.password, user.passwordHash);
    if (!isValid) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Invalid email or password' };
    }

    setCurrentUserId(user.id);
    const { passwordHash: _, ...safeUser } = user;
    dispatch({ type: 'SET_USER', payload: safeUser });

    return { success: true };
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const users = getStoredUsers();
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (existingUser) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'An account with this email already exists' };
    }

    const passwordHash = await hashPassword(credentials.password);
    const newUser: StoredUser = {
      id: uuidv4(),
      email: credentials.email,
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);
    setCurrentUserId(newUser.id);

    const { passwordHash: _, ...safeUser } = newUser;
    dispatch({ type: 'SET_USER', payload: safeUser });

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    dispatch({ type: 'SET_USER', payload: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
