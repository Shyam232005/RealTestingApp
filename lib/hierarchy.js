/**
 * lib/hierarchy.js
 * Pure client-safe hierarchy utilities and rank mappings.
 * Strictly free of Mongoose, MongoDB, or Node.js native server modules.
 */

export const HIERARCHY_RANK_MAP = {
  CHIEF_OFFICER: 7,
  DIRECTOR: 6,
  MANAGER: 5,
  SUPERVISOR: 4,
  ANALYST: 3,
  COORDINATOR: 2,
  ASSISTANT: 1,
  OTHER: 0,
};

export const POST_HIERARCHY_LEVELS = [
  "CHIEF_OFFICER",
  "DIRECTOR",
  "MANAGER",
  "SUPERVISOR",
  "ANALYST",
  "COORDINATOR",
  "ASSISTANT",
  "OTHER",
];

/**
 * Returns numeric rank for a post level (0 to 7). Defaults to 1 (Assistant).
 */
export function getHierarchyRank(postLevel) {
  const norm = (postLevel || "").trim().toUpperCase();
  return HIERARCHY_RANK_MAP[norm] !== undefined ? HIERARCHY_RANK_MAP[norm] : 1;
}

/**
 * Upper roles are Coordinator (2), Analyst (3), Supervisor (4), Manager (5), Director (6), Chief Officer (7).
 * Lower-most roles are Assistant (1) and Other (0).
 */
export function isUpperRole(postLevel) {
  return getHierarchyRank(postLevel) >= 2;
}
