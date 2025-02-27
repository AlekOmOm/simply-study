
## Revised User Requirements

1. **Initialize Session**
   * Use existing timer section for time input
   * Total time input replaces the 25:00 display when not in session
   * Convert "Start" button to "Initialize" when not in session
   * Require at least one topic before initialization is possible

2. **Topic Management**
   * Use existing topic structure
   * Allow adding/editing topics before and during a session
   * Require minimum one topic before session can start

3. **Session Tracking**
   * Use existing progress bar to show total session progress
   * No need for separate countdown of total time
   * Session consists of complete pomodoros only (no partial time)

4. **Calculations**
   * Calculate number of pomodoros based on 30-minute cycles
   * Discard any remaining time that doesn't fit a full pomodoro

## User Experience Flow

1. **Initial State** (not in session)
   * App opens showing empty notebook with ability to add topics
   * Timer area shows a time input field instead of the countdown
   * "Initialize" button appears instead of Start/Pause and Reset
   * Progress bar is empty/hidden

2. **Setup Phase**
   * User adds topics and subtopics using existing interface
   * User sets total study time in hours
   * "Initialize" button becomes active once at least one topic exists

3. **Session Start**
   * User clicks "Initialize"
   * App calculates number of pomodoros
   * Timer switches to standard 25:00 display
   * "Initialize" button changes to "Start" and "Reset" buttons
   * Progress bar appears to track overall session progress

4. **During Session**
   * Normal pomodoro timer functionality
   * Users can still manage topics (add/complete)
   * Progress updates after each completed pomodoro
   * Session ends after completing all pomodoros

## Implementation Approach

minimalist solution:

1. **Reuses Existing UI Elements**
   * Repurposes timer display for time input
   * Uses same buttons with changed text
   * Maintains the notebook interface for topics

2. **Simple State Management**
   * Single boolean flag (`isInSession`) controls most changes
   * Minimal new variables needed (total time, expected pomodoros)

3. **Focused Functionality**
   * No additional screens or modals
   * No complex session stats or reports
   * Just the essentials to plan and execute a study session

