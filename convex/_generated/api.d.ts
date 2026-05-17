/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentSteps from "../agentSteps.js";
import type * as ceoChatMutations from "../ceoChatMutations.js";
import type * as ceoChatQueries from "../ceoChatQueries.js";
import type * as collabhub from "../collabhub.js";
import type * as crons from "../crons.js";
import type * as dispatch from "../dispatch.js";
import type * as escalation from "../escalation.js";
import type * as migrations_addProjectScope from "../migrations/addProjectScope.js";
import type * as mutations from "../mutations.js";
import type * as projects from "../projects.js";
import type * as queries from "../queries.js";
import type * as seedAgentConfig from "../seedAgentConfig.js";
import type * as seedSkills from "../seedSkills.js";
import type * as skills from "../skills.js";
import type * as stripe from "../stripe.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentSteps: typeof agentSteps;
  ceoChatMutations: typeof ceoChatMutations;
  ceoChatQueries: typeof ceoChatQueries;
  collabhub: typeof collabhub;
  crons: typeof crons;
  dispatch: typeof dispatch;
  escalation: typeof escalation;
  "migrations/addProjectScope": typeof migrations_addProjectScope;
  mutations: typeof mutations;
  projects: typeof projects;
  queries: typeof queries;
  seedAgentConfig: typeof seedAgentConfig;
  seedSkills: typeof seedSkills;
  skills: typeof skills;
  stripe: typeof stripe;
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
