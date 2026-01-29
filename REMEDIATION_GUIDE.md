# Remediation Guide: Consistency Issues

**Date**: January 30, 2026  
**Source**: ANALYSIS_REPORT.md  
**Status**: Optional improvements (no blockers)

All recommended fixes below are **optional** and **non-blocking**. The project is clear to implement as-is.

---

## Issue C1: User Story Numbering (LOW - Optional)

### Current Problem
```
spec.md:
- User Story 1: "Start Live Streaming from Webcam"
- User Story 2: "Browse and Select Available Cameras"

tasks.md Phase 3:
- Phase 3.1: US1 (Browse cameras)
- Phase 3.2: US2 (Start streaming)
```

The numbering is reversed between documents.

### Fix (2 minutes)
Edit `specs/001-hls-camera-streaming/spec.md` - swap the first two user stories:

**Before**:
```markdown
### User Story 1 - Start Live Streaming from Webcam (Priority: P1)
...
### User Story 2 - Browse and Select Available Cameras (Priority: P1)
```

**After**:
```markdown
### User Story 1 - Browse and Select Available Cameras (Priority: P1)
...
### User Story 2 - Start Live Streaming from Webcam (Priority: P1)
```

### Rationale
Logical flow: Users browse cameras → select → start streaming. Browse should be US1.

---

## Issue C2: Constitution Template (MEDIUM - Optional)

### Current Problem
`.specify/memory/constitution.md` is a template placeholder with no actual content:
```markdown
# [PROJECT_NAME] Constitution
### [PRINCIPLE_1_NAME]
[PRINCIPLE_1_DESCRIPTION]
```

plan.md references "Constitution check: PASS" but there's nothing to check against.

### Fix Option A: Populate Constitution (5 minutes)

Edit `.specify/memory/constitution.md`:

```markdown
# HLS Camera Streaming Constitution

## Core Principles

### I. Simplicity First
- Start with simplest solution (file-based storage, not database)
- Avoid over-engineering (e.g., no RPC, no queueing system)
- Use proven libraries (hls.js, FFmpeg) rather than custom implementations

### II. Single Responsibility
- Camera manager: discover and reserve cameras only
- FFmpeg worker: spawn processes and handle encoding only
- Stream registry: track stream state only
- HLS manager: generate manifests only

### III. In-Memory State
- Stream state lives in memory (streamRegistry.ts)
- No persistence required for MVP
- Graceful cleanup on process exit

### IV. Process Pool Limit
- MUST NOT exceed 4 concurrent FFmpeg processes
- Additional start requests return 503 Service Unavailable
- Graceful degradation under load

## Non-Negotiables

- TypeScript strict mode mandatory
- All public functions must have error handling
- No unhandled promise rejections
- Camera reservation prevents duplicate usage

---

Version: 1.0 | Created: 2026-01-30
```

### Fix Option B: Remove Reference (1 minute)

Edit `specs/001-hls-camera-streaming/plan.md` line ~32:

**Before**:
```markdown
## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - No violations detected
```

**After**:
```markdown
## Architectural Principles

This project uses no formal constitution. Recommended principles are documented in the code (max 4 FFmpeg processes, TypeScript strict mode, in-memory state).
```

### Recommendation
**Do Fix Option A** if you want to document actual project constraints for future maintainers. **Do Fix Option B** if constitution is not needed. Either works - current state (template file exists but unused) is acceptable.

---

## Issue C3: Task Count Summary (LOW - Optional)

### Current Problem
tasks.md header says "78 tasks" but summary table shows task counts that don't add up:

**Current Summary**:
```
Phase 1: 10 tasks
Phase 2: 14 tasks
Phase 3: 28 tasks
Phase 4: 13 tasks
Phase 5: 14 tasks
Phase 6: 9 tasks
Total: 88 tasks (not 78!)
```

**Actual Count** (by task ID range):
- Phase 1: T001-T010 = 10 ✅
- Phase 2: T011-T024 = 14 ✅
- Phase 3: T025-T056 = 32 (not 28)
- Phase 4: T057-T066 = 10 (not 13)
- Phase 5: T067-T077 = 11 (not 14)
- Phase 6: T078-T091 = 14 (not 9) [Phase 6 incomplete in current file]

### Fix (3 minutes)

1. Complete Phase 6 section (add missing T079-T091 descriptions if needed)
2. Update summary table in tasks.md:

**Before**:
```
| Phase 1 | Setup | 10 | 1-2h | None |
| Phase 2 | Foundation | 14 | 2-3h | Phase 1 ✓ |
| Phase 3 | P1 Stories (MVP) | 28 | 3-4h | Phase 2 ✓ |
| Phase 4 | P2 Stories | 13 | 2-3h | Phase 3 ✓ |
| Phase 5 | Polish | 14 | 2-3h | Phase 4 ✓ |
| Phase 6 | Docs/Deploy | 9 | 1-2h | Phase 5 ✓ |
| TOTAL | Complete Feature | 78 | 80-120h | 6-8 days |
```

**After** (if using actual counts):
```
| Phase 1 | Setup | 10 | 1-2h | None |
| Phase 2 | Foundation | 14 | 2-3h | Phase 1 ✓ |
| Phase 3 | P1 Stories (MVP) | 32 | 4-5h | Phase 2 ✓ |
| Phase 4 | P2 Stories | 10 | 2-2h | Phase 3 ✓ |
| Phase 5 | Polish | 11 | 2-3h | Phase 4 ✓ |
| Phase 6 | Docs/Deploy | 14 | 2-3h | Phase 5 ✓ |
| TOTAL | Complete Feature | 91 | 90-130h | 7-8 days |
```

### Rationale
Ensure timeline estimates match actual task counts for better project planning.

---

## Issue A1: "Phase" Terminology (MEDIUM - Optional)

### Current Problem
"Phase" is ambiguous:
- plan.md talks about "Phase 0 research", "Phase 1 design" (speckit workflow)
- tasks.md talks about "Phase 1 setup", "Phase 2 foundation" (implementation)

Developers might confuse these.

### Fix (2 minutes)

Add clarification to both files:

**In plan.md** (after first paragraph):

```markdown
**Note**: "Phase 0", "Phase 1", etc. in this document refer to speckit workflow phases (research, design, planning). Implementation phases are numbered separately in tasks.md (Phase 1-6).
```

**In tasks.md** (after "Format & Organization" section):

```markdown
---

**Important**: These "Phases" (1-6) refer to implementation work, not speckit workflow phases. Speckit workflow consisted of: research (plan.md), design (this file creation), planning (specification). Implementation phases now run sequentially as Phase 1-6 below.

---
```

### Rationale
Clear terminology prevents confusion in team communication about project timeline vs. workflow stages.

---

## Issue A2: Vague Performance Metrics (LOW - Optional)

### Current Problem
Success criteria use subjective terms without thresholds:
- "UI remains responsive" ← responsive = <200ms? <500ms?
- "maintain HLS quality" ← quality = what bitrate? frame drop limit?
- "<5 second initial playback delay" ← from what moment? buffer pre-fill time?

### Fix (5 minutes)

Edit `specs/001-hls-camera-streaming/spec.md` in Success Criteria section:

**Before**:
```markdown
- **SC-006**: The web UI remains responsive even while streaming multiple cameras (no freezing or lag)
- **SC-007**: Streaming can continue for at least 1 hour without crashes or errors
```

**After**:
```markdown
- **SC-006**: The web UI responds to clicks within 200ms even while streaming multiple cameras (no freezing or lag on click handler)
- **SC-007**: Streaming can continue for at least 1 hour without crashes, frame drops, or unhandled errors
```

Also update in plan.md:

**Before**:
```markdown
**Performance Goals**: 
  - Capture and encode to HLS within 2 seconds of stream start
  - Support at least 2 concurrent streams with <500ms latency
  - HLS segments generated every ~2 seconds
  - Maintain 60 fps capture if camera supports, with reasonable bitrate (2-5 Mbps adaptive)
```

**After**:
```markdown
**Performance Goals**: 
  - Capture and encode to HLS within 2 seconds of stream start (from POST /api/streams to stream status = 'active')
  - Support at least 2 concurrent streams with <500ms manifest latency (from segment generation to m3u8 update)
  - HLS segments generated every ~2 seconds (2000ms target, tolerance +/-300ms)
  - Maintain 60 fps input (if camera supports) with output bitrate 2500 kbps ±500 kbps
  - Allow <1 frame drop per minute during normal operation
```

### Rationale
Explicit thresholds make testing and QA verification unambiguous.

---

## How to Apply These Fixes

### Option 1: Apply All (15 minutes total)
1. Run the fixes for C1, A1, A2 (documentation/clarity)
2. Skip C2 and C3 (optional infrastructure)
3. Commit: `git commit -m "docs: address minor consistency issues from analysis"`

### Option 2: Apply High-Impact Only (5 minutes)
1. Do C1 (user story reordering) + A1 (phase terminology) + A2 (metrics)
2. Defer C2 and C3
3. Commit separately as you work

### Option 3: Defer All (Proceed as-is)
- All issues are non-blocking
- Proceed with Phase 1 immediately
- Fix documentation issues during Phase 5 (polish phase)

---

## Verification Checklist

After applying any fixes:

```bash
# Verify spec.md user stories are in correct order
grep -n "^### User Story" specs/001-hls-camera-streaming/spec.md
# Should show: US1 = Browse, US2 = Start (not reversed)

# Verify task counts
grep "^- \[ \] T[0-9]" specs/001-hls-camera-streaming/tasks.md | wc -l
# Should match the Phase count (currently ~77-91 depending on completeness)

# Verify no git conflicts
git status
# Should show clean (no merge conflicts)
```

---

## Recommendation

**Best Path Forward**:
1. ✅ **Proceed with Phase 1 immediately** (no blockers)
2. ⏸️ **During Phase 5 (polish)**: Apply fixes A2 (metrics clarity)
3. 📋 **After MVP (Phase 4)**: Apply C1 (user story order) for documentation consistency
4. 🔧 **Optional**: Apply C2/C3 if you want tighter project governance

---

## Questions?

Refer to ANALYSIS_REPORT.md for detailed findings and rationale for each issue.

**Remember**: All 5 issues are LOW-MEDIUM severity and non-blocking. The project is **✅ CLEAR TO IMPLEMENT** as-is.

