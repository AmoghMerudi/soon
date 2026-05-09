/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ceoChatMutations from "../ceoChatMutations.js";
import type * as ceoChatQueries from "../ceoChatQueries.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
import type * as seedSkills from "../seedSkills.js";
import type * as skills from "../skills.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ceoChatMutations: typeof ceoChatMutations;
  ceoChatQueries: typeof ceoChatQueries;
  mutations: typeof mutations;
  queries: typeof queries;
  seedSkills: typeof seedSkills;
  skills: typeof skills;
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
