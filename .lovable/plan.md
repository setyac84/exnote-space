

## Plan: Add Developer Brief Fields (What To Do, Done If, Notes) to Task Modal

### Context
The Developer Details section in TaskModal currently only has: Repository Link, Environment, and Bug Severity. You want to add three new rich-text fields above the Repository Link:
- **What To Do** - checklist-style task instructions
- **Done If** - acceptance criteria
- **Notes** - additional developer notes

These fields don't exist in the database yet, so we need both a migration and code changes.

### Database Changes
Add 3 new columns to the `tasks` table:
- `what_to_do` (text, nullable) 
- `done_if` (text, nullable)
- `dev_notes` (text, nullable)

### Code Changes

**`src/components/TaskModal.tsx`**
In the Developer Details section (line 584-619), add 3 new `RichTextArea` / `RichTextDisplay` fields **above** the Repository Link input:

1. **🧠 What To Do** - uses `form.what_to_do`, RichTextArea in edit mode, RichTextDisplay in view mode
2. **✅ Done If** - uses `form.done_if`, same pattern
3. **🚨 Notes** - uses `form.dev_notes`, same pattern

Then the existing Repository Link, Environment, Bug Severity fields follow below.

Also update `handleSave` to include `what_to_do`, `done_if`, `dev_notes` in the create/update payloads.

### No Breaking Changes
- New columns are nullable with no constraints, so existing data is unaffected
- The fields only render when `divisionName === 'developer'`
- Existing flow for Creative division and other features stays the same

