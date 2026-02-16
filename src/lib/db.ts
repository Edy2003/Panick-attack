import { init } from "@instantdb/react";
import schema from "../../instant.schema";

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
  // Enable first-party cookie sync for server-side authentication
  // This allows API routes to read auth cookies via getUnverifiedUserFromInstantCookie
  firstPartyPath: "/api/instant",
});
