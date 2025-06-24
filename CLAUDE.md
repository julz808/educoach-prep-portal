# CLAUDE.md

## IMPORTANT CODING STANDARDS AND PRINCIPLES

### Professional Development Practices
- **NO SHORTCUTS**: Always implement solutions properly and completely. No quick hacks or temporary fixes.
- **BEST PRACTICES**: Follow industry-standard coding practices, patterns, and conventions.
- **COMPLETE SOLUTIONS**: Implement features end-to-end with proper error handling, edge cases, and testing considerations.
- **CODE QUALITY**: Write clean, maintainable, well-documented code that other developers can understand.

### Honest Technical Partnership
- **CHALLENGE INCORRECT ASSUMPTIONS**: If something seems wrong or suboptimal, speak up immediately and explain why.
- **PROVIDE ALTERNATIVES**: Don't just point out problems - suggest better solutions with clear reasoning.
- **TECHNICAL HONESTY**: Be direct about technical limitations, potential issues, and better approaches.
- **QUESTION UNCLEAR REQUIREMENTS**: Ask for clarification rather than making assumptions.
- **PUSH BACK WHEN NECESSARY**: If a request could harm the codebase or create technical debt, explain why and propose alternatives.

### Implementation Philosophy
- **THINK BEFORE CODING**: Always plan the implementation thoroughly before writing code.
- **CONSIDER IMPLICATIONS**: Think about how changes affect other parts of the system.
- **MAINTAIN CONSISTENCY**: Follow existing patterns and conventions in the codebase.
- **DOCUMENT DECISIONS**: Explain why certain approaches were chosen, especially for non-obvious solutions.

## Project Overview
EduCourse is an Australian test preparation platform for Year 5–10 students, offering diagnostic tests, skill drills, and practice tests for selective entry, NAPLAN, and scholarship exams.

## Current Status
- ✅ Database schema, migrations, and RLS policies complete
- ✅ Authentication system implemented (Supabase Auth)
- ✅ User profile and product management in place
- ✅ Real-time session management system implemented
- ✅ Test taking system complete (all modes: diagnostic, practice, drill)
- ✅ Progress tracking and persistence complete
- ✅ Dashboard backend integration complete
- ✅ Performance analytics and insights complete

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

## Completed Tasks
- [x] Connect frontend to backend for test sessions, drills, and progress
- [x] Implement test session creation, save/resume, and completion
- [x] Integrate question loading and answer submission
- [x] Real-time answer submission and persistence
- [x] Auto-save functionality with window exit handlers
- [x] Session state restoration (answers, flags, timer)
- [x] Dashboard metrics with real backend data
- [x] Cross-device session synchronization
- [x] Offline support with sync queue
- [x] Advanced performance analytics and insights system
- [x] Comprehensive drill analytics with difficulty levels
- [x] Practice test insights with proper denominators
- [x] Dynamic practice test detection and "Finish All" functionality

## Remaining Tasks (Next Phase Priorities)
### Phase 1: Question Generation Engine Improvements
- [ ] **Schema Compatibility Check**: Verify generation engine populates all current database fields (e.g., max_points column)
- [ ] Update generation scripts to match current questions table structure
- [ ] Implement multi-step validation pipeline for generated questions
- [ ] Add automated quality validation step to catch mathematical errors
- [ ] Create auto-regeneration logic for failed validations
- [ ] Add logging and pattern analysis for hallucination detection
- [ ] Test and tune validation parameters for efficiency

### Phase 2: Generate Questions for All 6 Products
- [ ] Run generation scripts for NSW Selective Entry
- [ ] Run generation scripts for Year 5 NAPLAN
- [ ] Run generation scripts for Year 7 NAPLAN
- [ ] Run generation scripts for EduTest Scholarship
- [ ] Run generation scripts for ACER Scholarship
- [ ] Validate question coverage across all products

### Phase 3: Cross-Product Testing & Validation
- [ ] Create automated test suite for all products
- [ ] Test user flows across all 6 products
- [ ] Validate analytics work correctly for all products
- [ ] Test product switching and edge cases
- [ ] Ensure frontend/backend logic works universally

### Phase 4: Stripe Integration & Paywall
- [ ] Integrate Lovable's Stripe functionality
- [ ] Implement product access control and paywalls
- [ ] Create subscription tiers and pricing structure
- [ ] Add billing management interface
- [ ] Test payment flows and subscription management

### Future Tasks
- [ ] Add comprehensive error handling and edge cases
- [ ] Refactor for best practices and code clarity
- [ ] Add and improve unit/integration tests
- [ ] Production deployment preparation
- [ ] Performance optimization and monitoring

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

## Critical Constants

### Product Types (EXACT - Case Sensitive!)
```typescript
export const PRODUCTS = [
  'VIC Selective Entry (Year 9 Entry)',
  'NSW Selective Entry (Year 7 Entry)',
  'Year 5 NAPLAN',
  'Year 7 NAPLAN',
  'EduTest Scholarship (Year 7 Entry)',
  'ACER Scholarship (Year 7 Entry)'
] as const;

Diagnostic: 'diagnostic'
Practice: 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'
Drill: 'drill'
```

## Current Implementation Priority

1. ✅ ~~Connect frontend and backend for test sessions and drills~~
2. ✅ ~~Implement answer submission and progress tracking~~
3. ✅ ~~Build dashboard and analytics~~
4. ✅ ~~Advanced performance insights and analytics~~
5. ⏳ **Phase 1: Question Generation Engine Improvements** (Current Focus)
6. ⏳ **Phase 2: Generate Questions for All 6 Products**
7. ⏳ **Phase 3: Cross-Product Testing & Validation**
8. ⏳ **Phase 4: Stripe Integration & Paywall**
9. ⏳ Error handling, testing, and production readiness

## Development Guidelines

### UI/Frontend Changes
- **Preserve existing look and feel** - only modify backend integration logic
- **No major UI redesigns** unless specifically requested
- **Focus on functionality**, not visual changes
- **Maintain current user experience** while enhancing backend connectivity

### Backend/Database Changes
- **Supabase schema should remain stable** - avoid table structure changes
- **Add database functions as needed** for new functionality
- **Update database-schema.sql only when necessary**
- **Focus on enhancing existing tables** rather than creating new ones

## Recently Completed (Latest)

### Advanced Performance Analytics System
- ✅ Complete insights implementation for all test modes
- ✅ Fixed Score vs Accuracy denominators (total available vs attempted)
- ✅ Comprehensive drill analytics with difficulty level breakdown
- ✅ Dynamic practice test detection and proper "Finish All" functionality
- ✅ Accurate overall score calculations using test-specific totals
- ✅ Added Average Score cards matching diagnostic layout
- ✅ Structured drill insights with section filtering
- ✅ Sub-skill performance tracking with proper denominators
- ✅ Created getTotalQuestionsAvailable() function for accurate analytics

### Real-time Session Management System
- ✅ Immediate backend persistence for all user actions
- ✅ Perfect session resume functionality
- ✅ Real-time flag and timer synchronization
- ✅ Complete elimination of localStorage dependency
- ✅ Multi-table coordinated updates
- ✅ Enhanced UI status indicators
- ✅ Cross-platform state synchronization

## Current Focus Issues

### Phase 1 Priority Issues
- Question generation hallucination in Mathematics/Quantitative questions
- Need validation pipeline to catch impossible/incorrect questions
- Auto-regeneration needed for failed validations
- Example issue: UUID 03fdec17-26e8-4852-ac24-e2d5031f8015 (overly complex solution)

### Upcoming Issues
- Only VIC Selective Entry has generated questions (need other 5 products)
- Cross-product testing needed once all content is generated
- Payment integration required before production launch
- Comprehensive error handling coverage incomplete
- Unit test coverage needs expansion

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

## Useful Claude Commands

```bash
# Analyze current state
claude "Show me which components are using mock data instead of real database queries"

# Connect specific feature
claude "Connect the insights analytics to the user_sub_skill_performance table following the existing query patterns"

# Debug issues
claude "The performance analytics are loading slowly. Help optimize the database queries"

# Best practices
claude "Review the session management flow and suggest improvements following React/TypeScript best practices"

# Data analysis  
claude "Create performance insights queries that analyze user progress across all test modes"

# Question generation improvements
claude "Implement validation pipeline for question generation to catch mathematical errors and impossible questions"

# Multi-product question generation
claude "Run question generation scripts for all 6 products using existing curriculumData.ts configurations"

# Cross-product testing
claude "Test that all frontend/backend logic works consistently across all 6 products"
```

## Implementation Files

- `README.md` - Detailed schema and implementation flows
- `implementation-plan.md` - Phased task breakdown and current status
- `REALTIME_SESSION_IMPLEMENTATION.md` - Complete technical documentation for session system
- `supabase-realtime-functions.sql` - Database functions for real-time operations
- `test-realtime-session.md` - Testing guide for session functionality

## Architecture Notes

- **Real-time persistence**: All user actions save to backend immediately
- **Backend-driven state**: No localStorage dependency, database is single source of truth
- **Multi-table coordination**: Updates across user_test_sessions, test_section_states, question_attempt_history
- **Cross-platform sync**: Session state synchronized across all devices and tabs
- **Offline resilience**: Answer queuing with automatic sync on reconnection

## Use Claude Code for:
- Question generation validation pipeline implementation (Phase 1 priority)
- Multi-product question generation execution (Phase 2)
- Cross-product testing and validation (Phase 3)
- Stripe integration with Lovable (Phase 4)
- Error handling and comprehensive testing (Future phases) 