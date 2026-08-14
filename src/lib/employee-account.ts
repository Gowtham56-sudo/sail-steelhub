/**
 * Employees sign in with an employee number only — never an email address.
 * Internally each roster entry maps to a deterministic, non-deliverable
 * address so the auth system (which requires an email) has something stable
 * to key on. This helper is shared by the browser and the server so both
 * sides always derive the exact same address.
 */
export function normalizeEmployeeNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function employeeNumberToAuthEmail(employeeNumber: string): string {
  return `${normalizeEmployeeNumber(employeeNumber).toLowerCase()}@ssp.sail.local`;
}

export const MIN_PASSWORD_LENGTH = 8;
