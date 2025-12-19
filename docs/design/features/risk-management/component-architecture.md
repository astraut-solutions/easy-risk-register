# Component Architecture - Risk Management Features

## Overview

This document details the component architecture for the risk management features in Easy Risk Register, showing how components interact and the data flow between them.

## Component Hierarchy

```mermaid
graph TD
    A[App] --> B[DashboardLayout]
    B --> C[Header]
    B --> D[Sidebar]
    B --> E[MainContent]
    
    E --> F[Dashboard]
    E --> G[RiskList]
    E --> H[RiskMatrix]
    E --> I[RiskFormModal]
    
    F --> J[RiskSummaryCards]
    F --> K[RiskChart]
    
    G --> L[RiskCardList]
    L --> M[RiskCard]
    
    H --> N[RiskMatrixGrid]
    N --> O[RiskMatrixCell]
    
    I --> P[RiskForm]
    P --> Q[InputComponents]
    P --> R[SelectComponents]
    P --> S[ButtonComponents]
    
    M --> T[StatusBadge]
    M --> U[CategoryTag]
    M --> V[ActionButtons]
    
    classDef layout fill:#f9f
    classDef feature fill:#9f9
    classDef ui fill:#9ff
    classDef form fill:#ff9
    
    class B,C,D layout
    class F,G,H feature
    class M,N,Q,R,S,T,U,V ui
    class I,P form
```

## Risk Card Component Architecture

```mermaid
flowchart LR
  subgraph RiskCard["RiskCard Component"]
    subgraph Props["Props Interface"]
      RiskObj[Risk object]
      OnEdit[OnEdit handler]
      OnDelete[OnDelete handler]
      OnSelect[OnSelect handler]
    end

    subgraph State["Internal State"]
      Hover[Hover state]
      Anim[Animation state]
      Selection[Selection state]
    end

    subgraph Children["Child Components"]
      Title[Title display]
      Desc[Description preview]
      Score[Risk score display]
      Status[Status indicator]
      Category[Category tag]
      Actions[Action buttons]
    end

    subgraph Handlers["Event Handlers"]
      EditClick[onEditClick]
      DeleteClick[onDeleteClick]
      SelectClick[onSelectClick]
      MouseEnter[onMouseEnter]
      MouseLeave[onMouseLeave]
    end
  end

  Props -->|Receives| State
  State -->|Controls| Children
  Children -->|Triggers| Handlers
  Handlers -->|Calls| Props
```

## Risk Form Architecture

```mermaid
flowchart LR
    A[RiskForm Component] --> B[Form State Management]
    A --> C[Validation Logic]
    A --> D[Submission Handler]
    
    B --> E[Zustand Form Integration]
    C --> F[React Hook Form Validation]
    D --> G[Risk Creation/Update Logic]
    
    E --> H[Form Fields]
    F --> H
    G --> I[Store Update]
    
    H --> J[Input Components]
    H --> K[Select Components] 
    H --> L[TextArea Components]
    
    I --> M[UI Update]
    M --> N[Success/Error Feedback]

    style A fill:#e1f5fe
    style H fill:#f3e5f5
    style M fill:#e8f5e8
```

## Data Flow Architecture

### Risk Creation Flow

```mermaid
sequenceDiagram
  participant Form as RiskForm Component
  participant RHF as React Hook Form
  participant Store as Zustand Store
  participant Storage as Local Storage
  participant UI as UI Components

  Form->>RHF: Submit form data
  RHF->>Form: Validate data

  alt Validation passes
    Form->>Store: addRisk(data)
    Store->>Store: calculateRiskScore()
    Store->>Store: updateState()
    Store->>Storage: persistData()
    Store->>UI: notifyRiskAdded()
    UI->>Form: Reset form
  else Validation fails
    RHF->>Form: showErrors()
    Form->>Form: Highlight errors
  end

  Note right of Store: riskScore = probability × impact
```

## Component State Management

### Zustand Store Pattern

```mermaid
graph TD
    A[Risk Store] --> B[Risk State]
    A --> C[Category State] 
    A --> D[Settings State]
    
    B --> E[Risk Array]
    B --> F[Loading State]
    B --> G[Error State]
    
    C --> H[Category List]
    D --> I[Theme Setting]
    D --> J[Display Preferences]
    
    E --> K[addRisk Action]
    E --> L[updateRisk Action]
    E --> M[deleteRisk Action]
    E --> N[calculateRiskScore Action]
    
    K --> O[RiskForm]
    L --> P[RiskCard]
    M --> Q[RiskList]
    N --> R[RiskMatrix]

    classDef store fill:#e1f5fe
    classDef state fill:#f3e5f5
    classDef actions fill:#e8f5e8
    classDef components fill:#fff3e0
    
    class A store
    class B,C,D,E,F,G,H,I,J state
    class K,L,M,N actions
    class O,P,Q,R components
```

## Responsive Component Architecture

### Layout Components Structure

```mermaid
flowchart TB
  subgraph Layout["DashboardLayout"]
    subgraph Header["Header Component"]
      Title[App title]
      Nav[Navigation]
      Controls[User controls]
    end

    subgraph Sidebar["Sidebar Component"]
      Menu[Navigation menu]
      Filters[Filter controls]
      Export[Export options]
    end

    subgraph Main["Main Content"]
      Dashboard[Dashboard view]
      RiskList[Risk list view]
      RiskMatrix[Risk matrix view]
    end

    subgraph Breakpoints["Responsive Breakpoints"]
      Desktop[Desktop: full layout]
      Tablet[Tablet: collapsible sidebar]
      Mobile[Mobile: header only]
    end
  end

  Breakpoints -->|Controls visibility| Layout
```

## Form Validation Architecture

### Input Validation Flow

```mermaid
flowchart TD
    A[User Enters Data] --> B[Real-time Validation]
    B --> C{Field Valid?}
    C -->|Yes| D[Enable Submit Button]
    C -->|No| E[Show Error Message]
    D --> F[Accumulate Valid Fields]
    E --> A
    F --> G[Form Submit Enabled]
    G --> H[Final Validation]
    H --> I{All Fields Valid?}
    I -->|Yes| J[Submit Form]
    I -->|No| K[Scroll to First Error]
    J --> L[Process Data]
    K --> E

    style A fill:#e1f5fe
    style J fill:#e8f5e8
    style E fill:#ffebee
```

## Risk Matrix Visualization Architecture

```mermaid
flowchart LR
  subgraph RiskMatrix["RiskMatrix Component"]
    subgraph Input["Data Input"]
      Risks[Risk data]
      FilterCriteria[Filter criteria]
      Settings[Display settings]
    end

    subgraph Calc["Calculation Layer"]
      Position[Position calculator]
      Severity[Severity classifier]
      Grouping[Category grouping]
    end

    subgraph Viz["Visualization Layer"]
      Grid[Grid renderer]
      Markers[Risk marker renderer]
      Labels[Label renderer]
      Interaction[Interaction handler]
    end

    subgraph Output["Output"]
      Matrix[Interactive matrix]
      Details[Risk details panel]
      Feedback[Selection feedback]
    end
  end

  Input -->|Provides data| Calc
  Calc -->|Provides coordinates| Viz
  Viz -->|Renders| Output
  Output -->|Updates filters| Input
```

## Accessibility Architecture

### ARIA Implementation

```mermaid
graph LR
    A[Component] --> B[ARIA Labels]
    A --> C[ARIA Roles]
    A --> D[ARIA States]
    A --> E[Focus Management]
    
    B --> F[Screen Reader Support]
    C --> F
    D --> G[Keyboard Navigation]
    E --> G
    
    F --> H[Assistive Technology]
    G --> H
    
    style A fill:#e1f5fe
    style H fill:#e8f5e8
```

## Performance Optimization Architecture

### Optimized Component Rendering

```mermaid
flowchart LR
  subgraph Performance["Performance Components"]
    subgraph Memo["Memoized Components"]
      Card[RiskCard]
      Cell[RiskMatrixCell]
      Filter[FilterComponent]
    end

    subgraph Virtual["Virtual Scrolling"]
      List[RiskList]
      Loader[InfiniteLoader]
    end

    subgraph Lazy["Lazy Loading"]
      Modal[ModalContents]
      Tabs[TabContents]
    end

    subgraph Debounced["Debounced Operations"]
      Search[SearchFilter]
      MatrixUpdate[RiskMatrixUpdate]
    end
  end

  Memo -->|Reduces render operations| Virtual
  Virtual -->|Optimizes initial load| Lazy
  Lazy -->|Prevents excessive updates| Debounced
```

This component architecture documentation provides a detailed view of how the risk management features are structured, showing the relationships between components and the flow of data through the application.
