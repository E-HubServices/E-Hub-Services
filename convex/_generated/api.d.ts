/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as debug from "../debug.js";
import type * as esign from "../esign.js";
import type * as esign_actions from "../esign_actions.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as payments from "../payments.js";
import type * as requests from "../requests.js";
import type * as seed from "../seed.js";
import type * as services from "../services.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_pdf from "../utils/pdf.js";
import type * as utils_razorpay from "../utils/razorpay.js";
import type * as utils_rbac from "../utils/rbac.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  debug: typeof debug;
  esign: typeof esign;
  esign_actions: typeof esign_actions;
  files: typeof files;
  http: typeof http;
  messages: typeof messages;
  payments: typeof payments;
  requests: typeof requests;
  seed: typeof seed;
  services: typeof services;
  users: typeof users;
  "utils/auth": typeof utils_auth;
  "utils/pdf": typeof utils_pdf;
  "utils/razorpay": typeof utils_razorpay;
  "utils/rbac": typeof utils_rbac;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
