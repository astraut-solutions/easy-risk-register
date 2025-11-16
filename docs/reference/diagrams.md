# Easy Risk Register - System Diagrams

This document contains Mermaid diagrams that visualize the architecture, data flow, and component relationships of the Easy Risk Register application.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Easy Risk Register Application"
        direction TB
        
        subgraph "Components Layer"
            A1[Dashboard Sidebar]
            A2[Risk Summary Cards]
            A3[Risk Form]
            A4[Risk List]
            A5[Risk Matrix]
            A6[Risk Table]
            A7[Risk Filters]
        end
        
        subgraph "Services Layer"
            B1[Risk Management Service]
        end
        
        subgraph "State Management Layer"
            C1[Risk Store with Zustand]
        end
        
        subgraph "Data Layer"
            D1[Local Storage]
            D2[IndexedDB - Optional]
        end
        
        subgraph "Utilities & Types"
            E1[Type Definitions]
            E2[Calculation Utilities]
            E3[Export Utilities]
        end
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B1
    A6 --> B1
    A7 --> B1
    B1 --> C1
    C1 --> D1
    C1 --> D2
    C1 --> E2
    C1 --> E3
    E1 -.-> A1
    E1 -.-> A2
    E1 -.-> A3
    E1 -.-> A4
    E1 -.-> A5
    E1 -.-> A6
    E1 -.-> A7
```

## Component Flow Diagram

```mermaid
graph LR
    A[App.tsx] --> B[DashboardSidebar]
    A --> C[RiskSummaryCards]
    A --> D[RiskFiltersBar]
    A --> E[RiskMatrix]
    A --> F[RiskList / RiskTable]
    A --> G[Modal with RiskForm]
    
    B --> A
    C --> A
    D --> A
    E --> A
    F --> A
    G --> A
    
    A -.-> H[useRiskManagement Hook]
    H --> I[Risk Store]
    I --> J[Local Storage]
    
    style A fill:#4e7aa7,stroke:#333,stroke-width:4px
    style I fill:#f8c767,stroke:#333,stroke-width:2px
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant C as Components
    participant S as Store
    participant L as Local Storage

    U->>C: Interact with UI
    C->>S: Call store actions
    S->>L: Persist data
    S->>C: Update state
    C->>U: Update UI
    
    Note over L,S: Data persists in browser
```

## Zustand Store Structure

```mermaid
classDiagram
    class RiskStore {
        +Array~Risk~ risks
        +Array~Risk~ filteredRisks
        +Array~string~ categories
        +RiskFilters filters
        +Stats stats
        +addRisk(input: RiskInput): Risk
        +updateRisk(id: string, updates: Partial~RiskInput~): Risk
        +deleteRisk(id: string): void
        +setFilters(updates: Partial~RiskFilters~): void
        +exportToCSV(): string
        +importFromCSV(csv: string): number
    }
    
    class Risk {
        +string id
        +string title
        +string description
        +number probability (1-5)
        +number impact (1-5)
        +number riskScore (probability * impact)
        +string category
        +RiskStatus status
        +string mitigationPlan
        +string creationDate
        +string lastModified
    }
    
    RiskStore --> Risk : contains
```

## Component Hierarchy

```mermaid
graph TD
    A[App] --> B[DashboardSidebar]
    A --> C[SectionHeader]
    A --> D[RiskSummaryCards]
    A --> E[RiskFiltersBar]
    A --> F[Conditional View]
    
    F --> G[Risk Matrix View]
    F --> H[Risk Table View]
    
    G --> I[RiskMatrix]
    G --> J[RiskList]
    
    H --> K[RiskTable]
    
    A --> L[Modal]
    L --> M[RiskForm]
    
    I --> N[Risk Cards]
    J --> N
    K --> N
    
    style A fill:#4e7aa7,stroke:#333,stroke-width:4px
    style L fill:#f8c767,stroke:#333,stroke-width:2px
```

## State Management Flow

```mermaid
graph LR
    A[User Action] --> B[Component Event Handler]
    B --> C[Zustand Action]
    C --> D[State Update]
    D --> E[Re-render Components]
    E --> F[Local Storage Update]
    
    C -.-> G[Calculate New Values]
    G -.-> D
    G -.-> E
    
    style D fill:#c5e0b4,stroke:#333,stroke-width:2px
    style F fill:#e7e6e6,stroke:#333,stroke-width:2px
```