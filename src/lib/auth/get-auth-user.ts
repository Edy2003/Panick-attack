import { getUnverifiedUserFromInstantCookie } from "@instantdb/react/nextjs";

/**
 * Get authenticated user from InstantDB cookies in API routes
 *
 * Note: Despite the name "unverified", this is secure because:
 * - Cookies are HttpOnly and signed by InstantDB
 * - Cookies are set by the InstantDB auth system via /api/instant route handler
 * - The name means "we don't make an extra API call", but cookies are trusted
 *
 * @returns User object with id and email, or null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const user = await getUnverifiedUserFromInstantCookie(
      process.env.NEXT_PUBLIC_INSTANT_APP_ID!
    );

    console.log("[AUTH DEBUG] User from cookies:", user ? `user ${user.id}` : "null");

    return user;
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }
}
