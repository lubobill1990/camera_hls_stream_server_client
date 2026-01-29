# Task Execution Guide: HLS Camera Streaming

**Date**: January 30, 2026  
**Target**: Development team starting implementation  
**Duration**: 6-8 days (80-120 hours) or 3-4 days for MVP

---

## Overview

This guide explains how to use the tasks.md checklist and execute the HLS streaming feature implementation effectively.

---

## Understanding the Task Organization

### Task ID Format

Each task has a unique ID for tracking: `T001`, `T002`, ... `T078`

- **Sequential by phase**: Phase 1 = T001-T010, Phase 2 = T011-T024, Phase 3 = T025-T056, etc.
- **File references**: All tasks include exact file paths for clarity
- **Dependencies explicit**: Tasks list what they depend on

### Task Metadata Explained

```
- [ ] T026 Create API route app/api/cameras/route.ts

         ↑     ↑    ↑                                    ↑
         |     |    |                                    |
      Checkbox ID  Description                    File path
```

Extended format with parallelization and story:

```
- [ ] T033 [P] [US2] Create app/lib/stream/streamManager.ts

              ↑        ↑
              |        |
          [P] = Can run    [US2] = User Story 2
              in parallel      (spec.md priority)
```

---

## Execution Strategy

### Phase-by-Phase Approach (Recommended)

Complete phases **sequentially**, but parallelize **within** each phase:

#### Phase 1 Setup (1-2 hours)
```
Monday 9:00-11:00
- All tasks run mostly sequentially (dependency: T001 → T002)
- T002-T010 can run in parallel after T001
- **Gate**: By end of phase, `npm run dev` works
```

#### Phase 2 Foundation (2-3 hours)  
```
Monday 11:00-14:00
- Assign subteams: Camera (T011-T013), FFmpeg (T014-T017), Registry (T018-T019), HLS (T020-T021)
- All subteams work in parallel on different modules
- Each subteam writes unit tests (T022-T024)
- **Gate**: Core services available for user story implementation
```

#### Phase 3 MVP (3-4 hours)
```
Monday 14:00-18:00 + Tuesday 9:00-13:00
- Assign developers: US1 (1 dev) + US2 (1 dev) + US3 (1 dev) + US4 (1 dev) + US5 (1 dev)
- All stories run in parallel, meeting dependencies
- **Gate**: MVP complete - all P1 user stories delivered
```

#### Phase 4+ Enhancement (2-3 hours per phase)
```
Tuesday 13:00+
- Features less critical; can defer or parallelize with Phase 5
```

---

## Checklist Management

### Marking Progress

As you complete each task:

```markdown
Before:  - [ ] T001 Create project structure per implementation plan
After:   - [x] T001 Create project structure per implementation plan
                  ^
              Mark complete
```

**Best Practice**: Commit after completing each phase

```bash
git add specs/001-hls-camera-streaming/tasks.md
git commit -m "progress: Phase 1 setup complete (T001-T010 done)"
```

### Tracking by Phase

To see phase progress:

```bash
# Count completed tasks in Phase 1
grep "^- \[x\].*T00[0-9]" tasks.md | wc -l  # Should be 10
# Count completed in Phase 2
grep "^- \[x\].*T0[12][0-9]" tasks.md | wc -l  # Should be 14
```

### Dependency Verification

Before starting a task, verify prerequisites are done:

```markdown
Task T033 (Start Stream):
  - [ ] T011 Create TypeScript interfaces ← must be done first
  - [ ] T012 [P] Create cameraManager.ts ← must be done first
  - [ ] T018 Create streamRegistry.ts ← must be done first
  
Status: ✅ All prerequisites complete → safe to start T033
```

---

## Parallel Execution Plan

### Phase 2: Example Parallelization

With 2-3 developers, divide work:

**Developer 1: Camera & HLS**
- T011-T013: Camera interfaces and manager
- T020-T021: HLS utilities
- T022: Camera unit tests
- Estimated: 1.5 hours

**Developer 2: FFmpeg**
- T014-T017: FFmpeg worker and config
- T023: FFmpeg unit tests
- Estimated: 1.5 hours

**Developer 3: Registry**
- T018-T019: Stream registry and reservation
- T024: Stream registry unit tests
- Estimated: 1 hour

**Timeline**:
- 9:00-10:00: Each developer works independently
- 10:00-10:30: Sync and review interfaces (T011)
- 10:30-11:00: Resolve any type mismatches
- 11:00-12:30: Continue implementation and testing
- **Total**: 1.5 hours actual work (vs 3 hours sequential)

### Phase 3: Example Parallelization (5 concurrent stories)

With 5 developers (or 2-3 developers working sequentially through stories):

**Best Setup**: Each developer takes one full user story (T025-T030 = US1, etc.)

```
Developer 1:  T025-T030 (US1: Camera Browse) → 2 hours
Developer 2:  T031-T040 (US2: Start Stream) → 3 hours  
Developer 3:  T041-T044 (US3: Stop Stream)  → 1.5 hours
Developer 4:  T045-T048 (US4: Stream List)  → 1.5 hours
Developer 5:  T049-T056 (US5: Player)       → 2 hours
              ↓
          All parallel    → 3 hours total (vs 10 sequential)
```

**Dependency Note**: US5 (T049) depends on US2 (T033) being complete first
- Solution: Developer 5 starts with T050-T051 (API routes) first
- Once T033-T035 done, Developer 5 continues with T052-T056 (React components)

---

## Common Pitfalls & Solutions

### Pitfall 1: Starting tasks in wrong order

❌ **Wrong**: Start T032 (integration tests) before T033 (API implementation)
- Tests will fail with "route not found" - confusing

✅ **Right**: Complete T033 first, then T032
- Tests now have something to test

**Solution**: Respect the task order, especially for tests
- In Phase 3, tests are OPTIONAL - skip them if falling behind schedule

### Pitfall 2: Skipping Phase 2

❌ **Wrong**: Jump straight to Phase 3 (user story work)
- Components need camera manager, stream registry, HLS utilities
- "Cannot find module" errors everywhere
- Have to backtrack and build Phase 2 anyway

✅ **Right**: Complete Phase 2 fully
- All utilities ready for Phase 3
- Phase 3 implementation becomes smooth

### Pitfall 3: FFmpeg path issues

❌ **Wrong**: Assume FFmpeg is in PATH on all systems
- Works on dev machine, fails in CI/Docker
- Tests mysteriously fail on other machines

✅ **Right**: Create `.env` with FFmpeg path
- Make FFmpeg spawning configurable
- Use absolute path or validate at startup (T010 health check)

### Pitfall 4: Ignoring error handling

❌ **Wrong**: Skip T067-T070 (error handling) to "save time"
- Application crashes when camera disconnects
- Confusing error messages for users
- Requires rework anyway

✅ **Right**: Build error handling incrementally
- Handle "camera in use" during T033-T035
- Add other error handling in Phase 5
- Better user experience throughout

---

## Development Workflow Per Task

For each task, follow this checklist:

### 1. Understand the Task
```
Read the task description and file path
Identify dependencies: what must be done first?
Check if marked [P] (can run in parallel)
Look for [Story] tag (what user story)
```

### 2. Prepare Environment
```
Create necessary directories if needed
Open required files in editor
Have tests/contract open if writing tests first (optional)
```

### 3. Implement
```
Write code following the task description
Reference spec.md for detailed requirements
Reference data-model.md for entity structures
Reference quickstart.md for code patterns
```

### 4. Test (Optional, but recommended)
```
Unit test: Run jest for your component
Integration test: Run full flow if applicable
Manual test: Use browser/API client
```

### 5. Commit
```
git add [modified files]
git commit -m "feat: [Task] - [brief description]"
Example: "feat: T026 - create camera enumeration API route"
```

### 6. Mark Complete
```
Update tasks.md: - [ ] → - [x]
Commit task progress
Move to next task
```

---

## Code Quality Standards

### TypeScript

All code must follow TypeScript strict mode (configured in tsconfig.json):

```typescript
// ✅ Good
interface Camera {
  id: string;
  name: string;
  status: CameraStatus;
}

const cameras: Camera[] = await discoverCameras();

// ❌ Bad
const cameras: any = await discoverCameras();
```

### Error Handling

All async functions must handle errors:

```typescript
// ✅ Good
try {
  const stream = await startStream(cameraId);
  return { stream };
} catch (error) {
  console.error('Failed to start stream:', error);
  return { error: 'Camera already in use' };
}

// ❌ Bad
const stream = await startStream(cameraId);
return { stream };  // What if it throws?
```

### File Paths

Keep files organized per structure in plan.md:

```
✅ app/lib/camera/cameraManager.ts
✅ app/components/CameraSelector.tsx
✅ app/api/cameras/route.ts

❌ app/camera.ts (wrong location)
❌ app/CameraManager.tsx (wrong type)
```

---

## Testing Strategy

### Unit Tests (Optional, but valuable)

Write tests for pure functions and logic:

```typescript
// tests/unit/camera.test.ts
describe('cameraManager', () => {
  test('parseFFmpegDeviceList returns cameras', () => {
    const output = `dshow ... Camera 1 ...\n... Camera 2 ...`;
    const cameras = parseFFmpegDeviceList(output);
    expect(cameras).toHaveLength(2);
  });
});
```

**When to write**:
- Complex logic (manifest generation, FFmpeg args)
- Utility functions
- State management (registry)

**When to skip** (for time):
- UI components (test manually or with E2E)
- Simple pass-through functions
- API routes (test with E2E or API client)

### Integration Tests (Optional)

Test full workflows after Phase 3:

```typescript
// tests/integration/stream-start.test.ts
test('can start stream and generate manifest', async () => {
  const stream = await startStream('camera-001');
  expect(stream.status).toBe('starting');
  
  await waitFor(() => stream.status === 'active', 5000);
  expect(stream.hlsUrl).toBeDefined();
  
  const manifest = await fetch(stream.hlsUrl);
  expect(manifest.ok).toBe(true);
});
```

### E2E Tests (Optional)

Test full user flows in browser:

```typescript
// tests/e2e/streaming.spec.ts
test('user can start stream and watch video', async () => {
  page.goto('http://localhost:3000');
  page.selectOption('[data-testid=camera-select]', 'camera-001');
  page.click('[data-testid=start-btn]');
  
  await page.waitForSelector('[data-testid=player]');
  expect(page.locator('video')).toBeVisible();
});
```

---

## Debugging Guide

### Common Issues

#### "Camera not found" error

**Check**:
1. Is FFmpeg installed? `ffmpeg -version`
2. Is camera connected? Check Device Manager (Windows) or System Report (Mac)
3. Is camera in use by another app? (Zoom, browser, etc.)

**Solution**:
- Disconnect other apps
- Restart camera service
- Test with FFmpeg directly: `ffmpeg -f dshow -list_devices true -i dummy`

#### "Cannot find module" errors

**Check**:
1. Did you run `npm install`?
2. Are imports using correct paths?
3. Do you have TS path aliases set up?

**Solution**:
```bash
npm install                          # Install dependencies
npm run dev                          # Check TypeScript errors
# Check tsconfig.json for path aliases
```

#### "Manifest not found" errors

**Check**:
1. Did stream reach 'active' status?
2. Are .ts files being created in `public/hls/<streamId>/`?
3. Is manifest generation function creating m3u8?

**Solution**:
```bash
# Check stream directory exists
ls -la public/hls/<streamId>/
# Should see: segment_0000.ts, segment_0001.ts, etc.

# Check manifest exists
cat public/hls/<streamId>/manifest.m3u8
```

#### Video player shows black screen

**Check**:
1. Is manifest loading? (Check browser Network tab)
2. Are segments returning 200? (Check each segment in Network tab)
3. Is hls.js attached to video element?

**Solution**:
```typescript
// Add debug logging
const hls = new Hls({ debug: true });
hls.on(Hls.Events.ERROR, (event, data) => {
  console.error('HLS error:', data);
});
```

---

## Time Tracking Template

Track actual time spent per phase for future planning:

```markdown
## Time Log

### Phase 1: Setup (Planned: 1-2h)
- T001-T010: 1h 45m ✅

### Phase 2: Foundation (Planned: 2-3h)
- T011-T013 (Camera): 1h 15m
- T014-T017 (FFmpeg): 1h 30m
- T018-T019 (Registry): 45m
- T020-T021 (HLS): 45m
- T022-T024 (Tests): 30m
**Total**: 5h (vs planned 2-3h) → Underestimated complexity

### Phase 3: MVP (Planned: 3-4h)
- US1 (Camera): 1h
- US2 (Start): 1.5h
- US3 (Stop): 45m
- US4 (List): 45m
- US5 (Player): 1.5h
**Total**: 5.75h (parallel, vs 10h sequential)
```

Use this to refine estimates for future features.

---

## Completion Checklist

### MVP Complete (Phases 1-3)

When all Phase 3 tasks are marked ✅:

```bash
# Verify you can:
npm run dev                          # App runs
curl http://localhost:3000           # Frontend loads
curl http://localhost:3000/api/cameras  # API works
# Open browser → see camera list
# Select camera → click Start → see HLS URL
# Click Play → see video in player
# Click Stop → stream stops
```

### Full Feature Complete (All Phases)

When all Phase 6 tasks are marked ✅:

```bash
# Verify you can:
npm run build                        # Production build works
npm test                             # All tests pass
docker build -t hlscamera .          # Docker image builds
# Review documentation/README.md
# Deploy to staging environment
```

---

## Next Steps

1. **Print or bookmark** this guide and tasks.md
2. **Estimate capacity**: How many developers? How many hours available?
3. **Plan sprint**: Assign Phase 1 to first developer
4. **Execute**: Start with T001, work through phases systematically
5. **Track progress**: Mark tasks complete, commit regularly
6. **Iterate**: After Phase 3 (MVP), gather feedback before Phase 4+

---

## Questions?

Refer back to:
- **What does task X mean?** → Read task.md task description
- **How do I implement X?** → Read quickstart.md for code examples
- **Why this architecture?** → Read research.md and plan.md
- **What should the API return?** → Read contracts/api.md
- **What are the data structures?** → Read data-model.md

All answers are in the specification documents! 📚

