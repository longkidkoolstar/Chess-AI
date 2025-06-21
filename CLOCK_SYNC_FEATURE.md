# Clock Synchronization Feature

## Overview
The Clock Synchronization feature has been successfully added to the Chess AI userscript. This feature makes the AI's move timing appear more human-like by analyzing both players' remaining time and adjusting move delays accordingly.

## How It Works

### Clock Detection
- **Opponent Clock Selector**: `#board-layout-player-top > div.player-component.player-top > div.clock-component.clock-top.clock-black.clock-player-turn` (and variants)
- **Player Clock Selector**: `#board-layout-player-bottom > div.player-component.player-bottom > div.clock-component.clock-bottom.clock-white` (and variants)
- Supports multiple time formats: MM:SS, H:MM:SS, M:SS, etc.
- Robust parsing that handles various chess.com clock display formats

### Timing Logic

#### Standard Range Mode (Default)
1. **Opponent has more time**: Execute moves quickly with minimal delay (0.5s default)
2. **Player has more time**: Add artificial delay to match opponent's pace (up to 10s default)
3. **Equal time**: Use moderate delay between min and max values

#### Exact Match Mode
1. **Opponent has equal/more time**: Use minimal random delay (0.1-0.5s) to avoid going below opponent's time
2. **Player has more time**: Calculate precise delay so both players have approximately equal time after the move
3. **Formula**: `delay = (playerTime - opponentTime) - calculationTime`
4. **Fallback**: Cap delays at 30 seconds maximum for very large time differences

#### Time Pressure Override (New)
1. **Emergency Detection**: Monitors both player clocks every move
2. **Threshold Trigger**: When either player has ≤ threshold seconds (default: 20s)
3. **Override Behavior**: Immediately switches to minimum delay (0.1-0.5s random)
4. **Mode Independence**: Works with both Standard Range and Exact Match modes
5. **Auto Recovery**: Returns to normal timing when both players have > threshold time

### Delay Calculation
- **Standard Mode**: Uses minimum delay when opponent has more time, scaled delay based on time difference (normalized to 1 minute), bounded by user-defined min/max
- **Exact Match Mode**: Precisely calculates delay to achieve time equality, accounting for move calculation and execution time (~0.2s)

## User Interface

### Location
The Clock Sync controls are located in the **Automation** tab, nested under the **Auto Move** section as a sub-feature.

### Controls
1. **Clock Sync Toggle**: Enable/disable the feature
2. **Exact Match Toggle**: Enable precise time matching mode
3. **Time Pressure Toggle**: Enable emergency timing override (default: On)
4. **Time Pressure Threshold**: Configurable threshold in seconds (5-120s, default: 20s)
5. **Min Delay**: Minimum delay in seconds (0.1-30s, default: 0.5s) - Hidden in exact match mode
6. **Max Delay**: Maximum delay in seconds (0.5-60s, default: 10s) - Hidden in exact match mode
7. **Status Indicators**: Show "On"/"Off" for main feature, exact match mode, and time pressure

### Visual Design
- Compact sub-section with smaller controls
- Clear labeling and helpful tooltips
- Validation to ensure min ≤ max delays
- Integrated with existing settings save/load system

## Technical Implementation

### Key Functions Added
1. `myFunctions.parseTimeString()` - Parses various time formats
2. `myFunctions.getClockTimes()` - Detects and extracts clock times
3. `myFunctions.calculateClockSyncDelay()` - Calculates appropriate delay

### Integration Points
- **Auto Move Execution**: Modified `myFunctions.color()` to apply clock sync delays
- **Settings System**: Added to save/load functionality
- **Main Loop**: Syncs UI values with internal variables
- **Event Handlers**: Added for all clock sync controls

### Error Handling
- Graceful fallback when clocks aren't detected
- Default to minimum delay if parsing fails
- Console logging for debugging
- Bounds checking for delay values

## Usage Instructions

### Prerequisites
- Auto Move must be enabled for Clock Sync to function
- Works only on chess.com with visible clocks
- Requires active game with time controls

### Setup
1. Enable **Auto Move** in the Automation tab
2. Expand the **Clock Sync** sub-section
3. Toggle **Clock Sync** to "On"
4. **Configure time pressure** (recommended to keep enabled):
   - **Time Pressure**: Toggle to enable emergency timing override
   - **Threshold**: Set the time limit for emergency mode (default: 20s)
5. **Choose timing mode**:
   - **Standard Mode**: Adjust **Min Delay** and **Max Delay** as desired
   - **Exact Match Mode**: Toggle **Exact Match** to "On" (delay controls will be hidden)
6. Save settings for future use

### Behavior
- When it's your turn and auto move executes:

#### Standard Mode
  - If opponent has more time: Quick move (min delay)
  - If you have more time: Delayed move (scaled between min/max)
  - If times are equal: Moderate delay

#### Exact Match Mode
  - If opponent has equal/more time: Minimal random delay (0.1-0.5s)
  - If you have more time: Precise delay to equalize remaining times
  - Accounts for calculation and execution time

#### Time Pressure Override (All Modes)
  - When either player ≤ threshold: Emergency timing (0.1-0.5s)
  - Overrides all other timing calculations
  - Provides realistic competitive behavior in time trouble

## Edge Cases Handled

### Different Time Controls
- **Blitz**: Works with short time formats
- **Rapid**: Handles MM:SS and H:MM:SS formats
- **Classical**: Supports longer time displays
- **Increment/Delay**: Functions regardless of time control type

### Clock Visibility Issues
- **Missing clocks**: Falls back to minimum delay
- **Parsing errors**: Uses minimum delay with error logging
- **Game modes without clocks**: Graceful degradation

### Game State Changes
- **Game end**: Feature automatically disables
- **Pause/Resume**: Continues working when game resumes
- **Board flip**: Handles both orientations

## Benefits

### Human-like Behavior
- Mimics natural time management patterns
- Reduces suspicion of automated play
- Adapts to opponent's playing style

### Customization
- User-controlled delay ranges
- Easy enable/disable toggle
- Persistent settings across sessions

### Integration
- Seamless with existing auto move feature
- No interference with other AI functions
- Maintains all existing functionality

## Console Output
The feature provides detailed logging:
- Clock detection status
- Parsed time values
- Calculated delays
- Timing decisions
- Exact match calculations

Example output (Standard Mode):
```
Clock sync: Opponent time: 180s, Player time: 240s
Clock sync: Player has 60s more time, adding 3.2s delay
Auto move: Applying clock sync delay of 3200ms
```

Example output (Exact Match Mode):
```
Clock Sync: Using Exact Match mode
Clock Sync: Time difference: 60s (player - opponent)
Clock Sync: Calculated exact delay: 59.8s
Clock Sync: Projected times after move - Player: 180.0s, Opponent: 180.0s
Clock Sync: Final delay: 59.80s (59800ms)
```

Example output (Time Pressure Mode):
```
Clock Sync: Time pressure check - Threshold: 20s
Clock Sync: Opponent in time pressure: true (18s)
Clock Sync: Player in time pressure: false (45s)
🚨 Clock Sync: TIME PRESSURE MODE ACTIVATED - Switching to minimum delay
Clock Sync: ⚡ TIME PRESSURE OVERRIDE - Using emergency delay: 0.23s
```

## Future Enhancements
- Support for other chess sites
- Advanced timing patterns
- Learning from opponent behavior
- Integration with ELO-based timing
