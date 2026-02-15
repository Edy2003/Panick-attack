"use client";

import { db } from "@/lib/db";

export function useAuth() {
  const { isLoading, user, error } = db.useAuth();

  const sendMagicCode = async (email: string) => {
    await db.auth.sendMagicCode({ email });
  };

  const signInWithMagicCode = async (email: string, code: string) => {
    await db.auth.signInWithMagicCode({ email, code });
  };

  const signOut = () => {
    db.auth.signOut();
  };

  return {
    isLoading,
    user,
    error,
    isAuthenticated: !!user,
    sendMagicCode,
    signInWithMagicCode,
    signOut,
  };
}
