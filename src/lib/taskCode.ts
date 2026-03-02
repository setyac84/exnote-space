/**
 * Shared task code generation logic.
 * Format: [CompanyPrefix][MonthLetter][MonthNum]-[3-digit Counter]
 * Example: SM03-001, S1M03-002
 */

const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/**
 * Get the unique prefix for a company.
 * First company with a given initial gets just the letter (e.g. "S"),
 * subsequent companies with the same initial get letter + index (e.g. "S1", "S2").
 * Sorted by created_at for stable ordering.
 */
export function getCompanyPrefix(
  companyId: string,
  companies: { id: string; name: string; created_at: string }[]
): string {
  const company = companies.find(c => c.id === companyId);
  if (!company) return '';
  const initial = company.name.charAt(0).toUpperCase();
  const sameInitial = companies
    .filter(c => c.name.charAt(0).toUpperCase() === initial)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const idx = sameInitial.findIndex(c => c.id === companyId);
  return idx <= 0 ? initial : `${initial}${idx}`;
}

/**
 * Generate a unique task code for a project.
 * Uses max existing counter (not count) to avoid gaps/duplicates when tasks are deleted.
 */
export function generateTaskCode(
  projectId: string,
  projects: { id: string; company_id: string }[],
  companies: { id: string; name: string; created_at: string }[],
  tasks: { code: string | null; project_id: string }[]
): string {
  const project = projects.find(p => p.id === projectId);
  if (!project) return '';
  const companyPrefix = getCompanyPrefix(project.company_id, companies);
  if (!companyPrefix) return '';

  const now = new Date();
  const monthLetter = monthLetters[now.getMonth()];
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${companyPrefix}${monthLetter}${monthNum}`;

  // Find all tasks in the same company with the same prefix
  const companyProjectIds = projects
    .filter(p => p.company_id === project.company_id)
    .map(p => p.id);

  // Find the maximum existing counter number (not just count)
  let maxNum = 0;
  for (const t of tasks) {
    if (t.code && companyProjectIds.includes(t.project_id) && t.code.startsWith(prefix + '-')) {
      const numPart = t.code.slice(prefix.length + 1);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}
