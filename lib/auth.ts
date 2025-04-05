"use client"

import { UserRole } from '@/models/User';
import { UserJwtPayload } from './types';

export function isAuthenticated(user: UserJwtPayload | null) {
  return user !== null;
}

export function isAdmin(user: UserJwtPayload | null) {
  return user?.role === UserRole.ADMIN;
}

export function isTutor(user: UserJwtPayload | null) {
  return user?.role === UserRole.TUTOR;
}

export function isStudent(user: UserJwtPayload | null) {
  return user?.role === UserRole.STUDENT;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
} 