---
description: Analyze the current codebase and generate insights about architecture, dependencies, and potential improvements
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Analyze the existing codebase to understand structure, patterns, and areas for improvement.

1. **Codebase Scanning**:
   - Identify main entry points
   - Map directory structure
   - List key files and their purposes
   - Detect technology stack
   - Find configuration files

2. **Architecture Analysis**:
   - Identify architectural patterns
   - Map component relationships
   - Find circular dependencies
   - Detect code organization patterns
   - Identify design patterns in use

3. **Dependency Analysis**:
   - Parse package.json / requirements.txt / etc
   - Identify direct dependencies
   - Check for outdated packages
   - Find unused dependencies
   - Security vulnerability check

4. **Code Quality Metrics**:
   - File size distribution
   - Function complexity estimates
   - Code duplication detection
   - Comment density
   - Test coverage (if available)

5. **Generate Analysis Report**:
   ```markdown
   # Codebase Analysis Report
   
   **Generated**: [Date]
   **Project**: [Name]
   **Tech Stack**: [List]
   
   ## Architecture Overview
   - Pattern: [e.g., MVC, Microservices]
   - Entry Points: [List]
   - Key Components: [List]
   
   ## Dependencies
   - Total: [N]
   - Outdated: [M]
   - Security Issues: [K]
   
   ## Code Quality
   - Total Files: [N]
   - Total Lines: [L]
   - Largest Files: [Top 5]
   - Duplication: [Percentage]
   
   ## Recommendations
   1. [Suggestion]
   2. [Suggestion]
   
   ## Next Steps
   - [Action item]
   ```

6. **Output**:
   - Save report to `.specify/analysis/codebase-report.md`
   - Highlight critical issues
   - Suggest improvement areas

