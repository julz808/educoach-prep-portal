/**
 * UUID utility functions for handling UUID generation and validation
 */

/**
 * Generates a proper UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates a deterministic UUID from a string
 * This creates a consistent UUID for the same input string
 */
export function generateDeterministicUUID(input: string): string {
  // Simple hash function to create a number from the string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and create hex string
  const positiveHash = Math.abs(hash);
  const hex = positiveHash.toString(16).padStart(8, '0');
  
  // Create a valid UUID v4 format using the hash
  const uuid = `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-a${hex.substring(2, 5)}-${hex.padEnd(12, '0').substring(0, 12)}`;
  
  return uuid;
}

/**
 * Validates if a string is a proper UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Gets a valid UUID for a sub-skill, either from existing data or generates one
 */
export function getOrCreateSubSkillUUID(subSkill: string, existingUUID?: string): string {
  // If we have a valid existing UUID, use it
  if (existingUUID && existingUUID.trim() !== '' && isValidUUID(existingUUID)) {
    return existingUUID;
  }
  
  // Generate a deterministic UUID from the sub-skill name
  return generateDeterministicUUID(subSkill);
}