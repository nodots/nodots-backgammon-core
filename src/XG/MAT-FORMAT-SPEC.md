# MAT/XG Mobile Text Format Specification

This document describes the text-based backgammon match format used by XG Mobile and compatible with JellyFish MAT format. This specification was reverse-engineered from exported files since no official documentation exists.

**Note**: The JellyFish MAT format is "not formally defined" (per GNU Backgammon documentation), and implementations vary. This specification documents the format as exported by XG Mobile.

## File Structure

A MAT file is a plain text file with the following sections:

1. **Header** - Metadata about the match (optional in some exports)
2. **Match Length** - Declares match length
3. **Games** - One or more game records

### Character Encoding

Files use ASCII or UTF-8 encoding with Unix-style line endings (`\n`) or Windows-style (`\r\n`).

## Header Section

Headers use a semicolon-bracket format:

```
; [Key "Value"]
```

### Standard Header Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Site | Yes | Application or site name | `"XG Mobile"` |
| Match ID | No | Unique identifier | `"491989142"` |
| Player 1 | Yes | Name of player 1 (moves first on odd-numbered lines) | `"Ken"` |
| Player 2 | Yes | Name of player 2 | `"XG-Intermediate"` |
| Player 1 Elo | No | Rating/experience (format: rating/experience) | `"1522.94/244"` |
| Player 2 Elo | No | Rating/experience | `"1829.00/0"` |
| TimeControl | No | Time control setting | `"*0"` |
| EventDate | Yes | Date in YYYY.MM.DD format | `"2022.12.24"` |
| EventTime | No | Time in HH.MM format | `"21.23"` |
| Variation | Yes | Game variant | `"Backgammon"` |
| Jacoby | No | Jacoby rule (On/Off) | `"On"` |
| Beaver | No | Beaver rule (On/Off) | `"Off"` |
| Unrated | No | Unrated match (On/Off) | `"Off"` |
| CubeLimit | No | Maximum cube value | `"1024"` |

### Example Header

```
; [Site "XG Mobile"]
; [Match ID "491989142"]
; [Player 1 "Ken"]
; [Player 2 "XG-Intermediate"]
; [Player 1 Elo "1522.94/244"]
; [Player 2 Elo "1829.00/0"]
; [TimeControl "*0"]
; [EventDate "2022.12.24"]
; [EventTime "21.23"]
; [Variation "Backgammon"]
; [Jacoby "On"]
; [Beaver "Off"]
; [Unrated "Off"]
; [CubeLimit "1024"]
```

## Match Length Declaration

After the header, declare match length:

```
N point match
```

Where `N` is the number of points to win. Use `0` for money games:

```
0 point match
```

**Note**: There is a space before "point" to accommodate 2-digit numbers.

## Game Records

Each game begins with a game header followed by move records.

### Game Header

```
Game N
PlayerName1 : Score1                              PlayerName2 : Score2
```

- `N` is the game number (1-indexed)
- Scores are cumulative match scores before this game
- Column separation uses variable whitespace (typically aligned to ~40 characters)

### Move Records

Each move record represents one round (both players' actions):

```
 N) Player1Content                    Player2Content
```

#### Format Details

- **Move Number**: 1-2 digits followed by `)` and space
- **Column Separation**: Variable whitespace (2+ spaces minimum)
- **Player 1**: Left column (moves clockwise by convention)
- **Player 2**: Right column (moves counterclockwise by convention)

Either column may be empty if that player has no action for that round.

### Move Content Types

#### Dice Moves

Format: `DD: move1 move2 ...`

- `DD` is two digits representing dice (e.g., `64` for rolling 6 and 4)
- Doubles: `33` (rolled double 3s)
- Moves follow after colon and space

#### Move Notation

Format: `from/to`

| Position | Meaning |
|----------|---------|
| 1-24 | Board points (from player's perspective) |
| 25 | Bar (entering from bar) |
| 0 | Off (bearing off) |

**Examples**:
- `24/18` - Move from point 24 to point 18
- `25/21` - Enter from bar to point 21
- `6/0` - Bear off from point 6
- `13/10 8/7` - Two moves: 13 to 10, and 8 to 7

#### Cube Actions

| Action | Format | Description |
|--------|--------|-------------|
| Double | `Doubles => N` | Player doubles to N |
| Take | `Takes` | Player accepts double |
| Drop | `Drops` | Player declines double |

#### Game End

Format: `Wins N point` (singular even for multiple points)

### Complete Example

```
Game 1
Ken : 0                              XG-Intermediate : 0
 1)                                  15: 24/23 23/18
 2) 21: 13/11 8/7                    64: 25/21 24/18
 3) 41: 25/24 11/7                   51: 25/20 21/20
 4)  Doubles => 2                     Takes
 5) 42: 13/9 9/7                     65: 13/8 13/7
 6)  Wins 1 point
```

#### Line-by-Line Breakdown

1. **Line 1**: Player 1 (Ken) has no opening roll; Player 2 rolls 15 and plays 24/23 23/18
2. **Line 2**: Both players roll and move normally
3. **Line 3**: Both players roll and move
4. **Line 4**: Player 1 doubles to 2; Player 2 takes
5. **Line 5**: Both players roll and move
6. **Line 6**: Player 1 wins 1 point (game ends)

## Parsing Considerations

### Column Detection

The spacing between columns is **variable** (not fixed-width). Parsers should:

1. Look for content patterns rather than fixed column positions
2. Detect player 2's content by finding:
   - Dice notation: `\d{1,2}:`
   - Cube actions: `Takes`, `Drops`, `Doubles`
   - Game end: `Wins`
3. Require at least 2 spaces before player 2's content

### Empty Columns

- Player 1 empty: Line starts with significant whitespace
- Player 2 empty: No second content pattern found
- Both can be empty in some edge cases

### Edge Cases

1. **Bar entries**: Position 25 represents the bar
2. **Bear offs**: Position 0 represents off
3. **Passed turns**: Some implementations show empty dice notation
4. **Crawford game**: Not explicitly marked in basic format

## Compatibility Notes

This format is read by:
- eXtreme Gammon (XG)
- GNU Backgammon
- Snowie
- BGBlitz
- JellyFish

Minor variations exist between implementations. GNU Backgammon notes: "Jellyfish Match is not formally defined and software exporting matches to this format often produce minor discrepancies."

## References

- XG Mobile: http://xg-mobile.com/
- GNU Backgammon Manual: https://www.gnu.org/software/gnubg/manual/
- Nodots Backgammon Parser: `/packages/core/src/XG/parser.ts`

---

*This specification is published by Nodots Backgammon. Contributions and corrections welcome.*
