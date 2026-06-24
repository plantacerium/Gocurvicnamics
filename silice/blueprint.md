# Blueprint — Gocurvicnamics Architecture

> Silice Protocol V4 · Updated: Phase 0-1 Complete

---

## Game State Machine

```mermaid
stateDiagram-v2
    [*] --> CONFIG : App Launch
    CONFIG --> GAME : Start Game
    GAME --> BINDU_PAUSE : Player presses PAUSE/END
    BINDU_PAUSE --> GAME : Resume
    BINDU_PAUSE --> INTEGRATION : Both players agree to end
    INTEGRATION --> REPLAYER : View past game
    INTEGRATION --> CONFIG : New game
    REPLAYER --> CONFIG : Back
```

---

## Turn State Machine

```mermaid
stateDiagram-v2
    [*] --> SELECT_PIECE : Turn Start
    SELECT_PIECE --> DRAW_TRACE : Piece selected
    DRAW_TRACE --> SELECT_PIECE : Cancel (Escape)
    DRAW_TRACE --> ANIMATING : Trace confirmed (Enter/DblClick)
    ANIMATING --> PHYSICS_RESOLVE : Collision detected
    ANIMATING --> END_TURN : No collision, curve completed
    PHYSICS_RESOLVE --> END_TURN : Physics settled
    END_TURN --> SELECT_PIECE : Next player's turn
```

---

## Module Architecture

```mermaid
graph TD
    main["main.js (Screen Router)"]
    
    subgraph UI ["UI Layer (src/ui/)"]
        CS[ConfigScreen.js]
        HUD[HUD.js]
        IR[IntegrationRoom.js]
    end
    
    subgraph Engine ["Engine Layer (src/engine/)"]
        Board[Board.js]
        Physics[Physics.js]
        Piece[Piece.js]
        Trace[TraceInput.js]
        TM[TurnManager.js]
        Renderer[Renderer.js]
    end
    
    subgraph DB ["Data Layer (src/db/)"]
        RDB[ReplayerDB.js]
    end
    
    subgraph Config ["Config (src/config/)"]
        Defaults[defaults.js]
    end
    
    main --> CS
    main --> HUD
    main --> IR
    main --> TM
    CS --> Defaults
    TM --> Board
    TM --> Physics
    TM --> Trace
    TM --> Renderer
    TM --> RDB
    Renderer --> Board
    Renderer --> Piece
    Physics --> Piece
    Board --> Defaults
    Piece --> Defaults
```

---

## Board Topology

```mermaid
graph LR
    subgraph BoardLayout ["Board (1400×800)"]
        subgraph P1Left ["Player 1 Zones (Left)"]
            AZ1["Anchor Zone 1\n5×5 grid\ncellSize=60px"]
            AZ2["Anchor Zone 2\n5×5 grid\ncellSize=60px"]
        end
        VOID1["VOID EXPANSE\n(pure transit space)\nPhysics unrestricted\n≥ 3× anchor zone size"]
        subgraph P2Right ["Player 2 Zones (Right)"]
            AZ3["Anchor Zone 3\n5×5 grid\ncellSize=60px"]
            AZ4["Anchor Zone 4\n5×5 grid\ncellSize=60px"]
        end
    end
    AZ1 <--> VOID1
    AZ2 <--> VOID1
    VOID1 <--> AZ3
    VOID1 <--> AZ4
```

---

## Piece Type System

```mermaid
classDiagram
    class Piece {
        +String id
        +String type
        +Number playerId
        +Number mass
        +Number hp
        +Number maxHp
        +Number radius
        +Vector2 position
        +Vector2 velocity
        +Boolean destroyed
        +takeDamage(amount)
        +onCollision(other, relVel)
    }
    
    class BASE {
        mass: 1.0
        hp: 3
        behavior: "1:1 inertia transfer"
    }
    
    class DAMPENER {
        mass: 1.5
        hp: 8
        behavior: "Absorbs kinetic energy, blocks chain collisions"
    }
    
    class AMPLIFIER {
        mass: 0.5
        hp: 1
        behavior: "Generates curved shockwave on impact, radius 120px"
    }
    
    class SLINGSHOT {
        mass: 0.8
        hp: 2
        behavior: "Curve length → damage multiplier"
    }
    
    Piece <|-- BASE
    Piece <|-- DAMPENER
    Piece <|-- AMPLIFIER
    Piece <|-- SLINGSHOT
```

---

## Data Schema (ReplayerDB)

```mermaid
erDiagram
    GAME {
        string id PK
        datetime createdAt
        string[] tags
        json boardConfig
        json boardSnapshot
        string winnerId
        string status
    }
    
    MOVE {
        string id PK
        string gameId FK
        number turnNumber
        number playerId
        string pieceId
        json bezierPoints
        number curveLength
        json collisions
        json boardSnapshotAfter
        datetime timestamp
    }
    
    REFLECTION {
        string id PK
        string gameId FK
        number playerId
        string text
        string ollamaAnalysis
        datetime timestamp
    }
    
    GAME ||--o{ MOVE : "has"
    GAME ||--o{ REFLECTION : "has"
```

---

## Bezier Trace Input Flow

```mermaid
sequenceDiagram
    actor Player
    participant TraceInput
    participant Renderer
    participant TurnManager
    
    Player->>TraceInput: Click on piece (SELECT)
    TraceInput->>Renderer: Highlight selected piece
    Player->>TraceInput: Click (place Control Point 1)
    TraceInput->>Renderer: Draw CP1 handle
    Player->>TraceInput: Click (place Control Point 2)
    TraceInput->>Renderer: Draw CP2 handle
    Player->>TraceInput: Click (place End Point)
    TraceInput->>Renderer: Draw full Bezier preview
    Player->>TraceInput: Enter / Double-click (CONFIRM)
    TraceInput->>TurnManager: {startPt, cp1, cp2, endPt, curveLength}
    TurnManager->>TurnManager: Begin ANIMATING state
```
