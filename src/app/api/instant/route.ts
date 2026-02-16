import { createInstantRouteHandler } from "@instantdb/react/nextjs";

/**
 * InstantDB route handler for cookie synchronization
 * This endpoint is required for InstantDB to sync auth cookies
 * that can be read by server-side API routes
 */
const handlers = createInstantRouteHandler({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
});

export const POST = handlers.POST;
