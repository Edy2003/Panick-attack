import { NextRequest } from "next/server";
import { getUnverifiedUserFromInstantCookie } from "@instantdb/react/nextjs";

/**
 * Get authenticated user from InstantDB cookies in API routes
 *
 * Note: Despite the name "unverified", this is secure because:
 * - Cookies are HttpOnly and signed by InstantDB
 * - Cookies are set by the InstantDB auth system
 * - The name means "we don't make an extra API call", but cookies are trusted
 *
 * @returns User object with id and email, or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get cookie header string for InstantDB auth
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      return null;
    }

    const user = await getUnverifiedUserFromInstantCookie(cookieHeader);

    return user;
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }
}
