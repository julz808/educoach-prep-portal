# CLAUDE.md

## Project Overview
EduCourse is an Australian test preparation platform for Year 5–10 students, offering diagnostic tests, skill drills, and practice tests for selective entry, NAPLAN, and scholarship exams.

## Current Status
- ✅ Database schema, migrations, and RLS policies complete
- ✅ Authentication system implemented (Supabase Auth)
- ✅ User profile and product management in place
- ❌ Frontend/backend integration in progress
- ❌ Test taking, progress tracking, and analytics pending

## Tech Stack
- **Frontend:** React (Vite, TypeScript, shadcn/ui, TailwindCSS, React Router, TanStack Query)
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Functions)
- **APIs/Integrations:** Anthropic Claude (for question generation), Supabase JS SDK
- **Other:** Node.js scripts, dotenv, ESLint, tsx, ts-node

## Critical Database Info
- **Provider:** Supabase (PostgreSQL)
- **Key Tables:** `user_profiles`, `user_progress`, `user_test_sessions`, `test_section_states`, `drill_sessions`, `question_attempt_history`, `user_sub_skill_performance`
- **RLS:** All user data is protected by row-level security; users can only access their own data.
- **Triggers:** Progress fields are auto-updated by triggers—never update manually.

## Database Schema Summary
- See `README.md` and `database-schema.sql` for full details.
- **user_profiles:** Student/parent info, year level, timezone
- **user_progress:** Per-product progress, accuracy, study time
- **user_test_sessions:** Test session state, scores, section states
- **test_section_states:** Section-level progress, answers, timer
- **drill_sessions:** Drill attempts, sub-skill, difficulty, answers
- **question_attempt_history:** All question attempts, correctness, time spent

## Key Tasks Needed
- [ ] Connect frontend to backend for test sessions, drills, and progress
- [ ] Implement test session creation, save/resume, and completion
- [ ] Integrate question loading and answer submission
- [ ] Build dashboard metrics and analytics
- [ ] Add error handling and edge case management
- [ ] Refactor for best practices and code clarity
- [ ] Add and improve unit/integration tests

## Common Commands

### Development
- `npm run dev` — Start local dev server
- `npm run build` — Build for production
- `npm run lint` — Lint codebase
- `npm run preview` — Preview production build

### Scripts (see `package.json`)
- `npm run generate-practice-test` — Generate practice test data
- `npm run generate-visual-images` — Generate visual images for questions
- `npm run test:edutest-diagnostic` — Run diagnostic test script
- `npm run validate-env` — Validate environment variables

### Database
- Supabase migrations: use Supabase CLI or dashboard

## Project Structure

```
/src
  /components      # Reusable UI components
  /context         # React context providers
  /hooks           # Custom React hooks
  /integrations    # Supabase and other service clients
  /lib             # Utility libraries (e.g., supabase.ts)
  /pages           # Main app pages (Dashboard, Auth, TestTaking, etc.)
  /services        # Service logic (e.g., error logging)
  /types           # TypeScript types
  /utils           # Utility functions
  /assets          # Static assets
  /tests           # Test files
/public            # Static files
/supabase          # Database schema, migrations, functions
/scripts           # Node.js/TS scripts for data generation, validation
/docs              # Additional documentation
```

## Environment Variables

- `VITE_CLAUDE_API_KEY` — Anthropic Claude API key (for question generation)
- `CLAUDE_API_KEY` — Non-Vite version for Node.js scripts
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

> **Note:** Never commit secrets to version control.

## Implementation Priority

1. Connect frontend and backend for test sessions and drills
2. Implement answer submission and progress tracking
3. Build dashboard and analytics
4. Add error handling and edge case management
5. Refactor for best practices and maintainability
6. Expand and improve test coverage

## Known Issues

- Frontend/backend integration incomplete
- Test session save/resume logic needs implementation
- Dashboard metrics not yet connected to backend
- Error handling and edge case coverage incomplete

## Testing Approach

- Use `npm run lint` and `npm run test:*` scripts for validation
- Manual testing via local dev server (`npm run dev`)
- Add unit and integration tests for all new features
- Test edge cases (network failures, concurrent access, data validation)

## Workflow Tips

- Keep this file up to date as the project evolves
- Use feature branches for new work
- Run lint and typecheck before committing
- Review all code changes before merging
- Document any non-obvious decisions or workarounds

## Other Notes

- See `README.md` for detailed schema and implementation flows
- See `implementation-plan.md` for phased task breakdown
- Use Claude Code for code review, refactoring, and connecting frontend/backend logic 