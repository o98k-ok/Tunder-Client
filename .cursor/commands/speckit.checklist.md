---
description: Generate quality checklists for different aspects of the feature (UX, security, performance, testing)
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Generate comprehensive checklists to validate feature quality across multiple dimensions.

1. **Setup**: Parse FEATURE_DIR from prerequisites script

2. **Load Context**:
   - Read spec.md for requirements
   - Read plan.md for technical approach
   - Read constitution.md for compliance rules

3. **Generate Checklists**:

   **a. UX Checklist** (`checklists/ux.md`):
   - User flow completeness
   - Error handling and feedback
   - Loading states
   - Accessibility (WCAG)
   - Mobile responsiveness
   - Cross-browser compatibility

   **b. Security Checklist** (`checklists/security.md`):
   - Input validation
   - Authentication/authorization
   - Data encryption
   - SQL injection prevention
   - XSS prevention
   - CSRF protection
   - Secure dependencies

   **c. Performance Checklist** (`checklists/performance.md`):
   - Response time targets
   - Database query optimization
   - Caching strategy
   - Asset optimization
   - Memory usage
   - Concurrent user handling

   **d. Testing Checklist** (`checklists/testing.md`):
   - Unit test coverage
   - Integration test scenarios
   - E2E test critical paths
   - Edge case handling
   - Error scenario testing
   - Performance benchmarks

4. **Checklist Format**:
   ```markdown
   # [Aspect] Checklist: [Feature Name]
   
   **Purpose**: [What this validates]
   **Created**: [Date]
   **Feature**: [Link to spec.md]
   
   ## Category 1
   - [ ] Item 1
   - [ ] Item 2
   
   ## Category 2
   - [ ] Item 3
   
   ## Notes
   - Additional context
   ```

5. **Validation Rules**:
   - Each item must be:
     - Specific and measurable
     - Testable/verifiable
     - Relevant to the feature
   - Group related items
   - Include acceptance criteria
   - Note any dependencies

6. **Report**:
   - List generated checklists
   - Total items per checklist
   - Link to checklist directory
   - Remind to complete before implementation

