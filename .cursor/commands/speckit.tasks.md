---
description: Generate a detailed task breakdown from the implementation plan
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

This command generates a comprehensive task list from the implementation plan, breaking down high-level phases into concrete, actionable tasks.

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.

2. **Load Context**:
   - Read IMPL_PLAN for phases, milestones, and technical approach
   - Read FEATURE_SPEC for functional requirements
   - Read constitution.md for compliance requirements
   - If exists: Read research.md for technical constraints
   - If exists: Read data-model.md for entities and relationships

3. **Task Generation Strategy**:
   
   **Phase 0: Setup & Preparation**
   - Environment setup
   - Dependency installation
   - Configuration files
   - Documentation setup
   
   **Phase 1: Core Development**
   - Data models / entities
   - Core business logic
   - Database schema
   - API endpoints / interfaces
   
   **Phase 2: Integration**
   - External service integrations
   - Authentication / authorization
   - Error handling
   - Logging and monitoring
   
   **Phase 3: Testing**
   - Unit tests
   - Integration tests
   - End-to-end tests
   - Performance tests
   
   **Phase 4: Polish & Documentation**
   - Code review and refactoring
   - Documentation updates
   - Deployment preparation
   - Final validation

4. **Task Structure**:
   Each task must include:
   - **ID**: Unique identifier (e.g., P1.1, P2.3)
   - **Description**: Clear, actionable description
   - **Files**: List of files to create/modify
   - **Dependencies**: Prerequisites (other task IDs)
   - **Estimated Time**: Realistic time estimate
   - **Parallel**: Mark [P] if can run in parallel
   - **Checklist**: [ ] checkbox for tracking

5. **Dependency Rules**:
   - Setup tasks must complete before development
   - Core models before services that use them
   - Services before endpoints that call them
   - Implementation before tests
   - Tests before deployment
   - Mark independent tasks as [P] for parallel execution

6. **Write tasks.md**:
   ```markdown
   # [Feature Name] Task Breakdown
   
   ## Overview
   - Total Estimated Time: [X] days
   - Total Tasks: [N]
   - Parallelizable: [M] tasks
   
   ## Phase 0: Setup ([X] hours)
   ### P0.1: Task Name
   - [ ] Subtask
   - **Files**: list
   - **Time**: Xh
   - **Dependencies**: None
   
   [Continue for all phases...]
   
   ## Task Dependency Graph
   [Visualize critical path]
   
   ## Execution Notes
   - Parallel execution rules
   - Critical path
   - Risk areas
   ```

7. **Validation**:
   - All functional requirements covered
   - Constitution compliance checks included
   - Dependencies form valid DAG (no cycles)
   - Time estimates sum to realistic total
   - Each task is atomic and testable

8. **Report**:
   - Tasks file path
   - Total task count
   - Estimated timeline
   - Critical path
   - Ready for `/speckit.implement`

