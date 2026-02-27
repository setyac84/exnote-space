

## Plan

### 1. Change date format to "18 March" (day first)
- Update `src/lib/formatDate.ts`: change format from `'MMMM d'` to `'d MMMM'`

### 2. Improve dropdown styling in TaskModal
- Replace native `<select>` elements in `TaskModal.tsx` with custom styled dropdowns matching the `InlineStatusDropdown` pattern used on the task list page (rounded, dark popover with border, hover states)
- Apply to: Project, Assignee, Priority, Status selects

### 3. Show company name alongside project in TaskModal
- In view mode, display "Project Name · Company Name" instead of just project name
- Look up company from the selected project's `company_id`

### 4. Sort tasks by due date (newest first)
- In `TaskListPage.tsx`, add `.sort()` to `filteredTasks` by `due_date` descending
- In `Dashboard.tsx`, sort `highPriorityTasks` the same way

### 5. Wrap task title text (remove truncate)
- `TaskListPage.tsx` list view: remove `truncate` from task title, allow text wrapping
- `TaskListPage.tsx` card view: allow title to wrap

### 6. Wrap project · company text
- `TaskListPage.tsx` list view: remove `truncate` from project/company column, allow wrapping
- Dashboard high priority section: add project · company column with wrapping

### Files to modify:
- `src/lib/formatDate.ts`
- `src/components/TaskModal.tsx`
- `src/pages/TaskListPage.tsx`
- `src/pages/Dashboard.tsx`

