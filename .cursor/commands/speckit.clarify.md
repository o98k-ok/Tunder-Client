---
description: Interactive clarification session to resolve ambiguities in the specification
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

This command helps resolve [NEEDS CLARIFICATION] markers in the specification through interactive Q&A.

1. **Load Specification**:
   - Find latest spec.md
   - Scan for [NEEDS CLARIFICATION: ...] markers
   - Extract context for each marker

2. **If No Clarifications Needed**:
   - Report spec is complete
   - Suggest next step: `/speckit.plan`

3. **If Clarifications Exist**:
   
   a. **Present Questions**:
      For each marker (max 3):
      ```markdown
      ## Question [N]: [Topic]
      
      **Context**: [Quote from spec]
      
      **What we need**: [Clarification question]
      
      **Options**:
      | Option | Answer | Impact |
      |--------|--------|--------|
      | A | [Option 1] | [Implications] |
      | B | [Option 2] | [Implications] |
      | C | [Option 3] | [Implications] |
      
      **Your choice**: _[Wait for input]_
      ```
   
   b. **Collect Responses**:
      - Wait for user to provide choices
      - Accept format: "Q1: A, Q2: B, Q3: Custom - [details]"
      - Validate responses
   
   c. **Update Specification**:
      - Replace each [NEEDS CLARIFICATION] with chosen answer
      - Update affected sections for consistency
      - Re-validate spec completeness
   
   d. **Update Checklist**:
      - Mark "No [NEEDS CLARIFICATION] markers" as complete
      - Verify other checklist items still pass

4. **Iteration**:
   - If new clarifications emerge from updates, repeat
   - Max 3 iteration cycles
   - If stuck, escalate to manual review

5. **Report**:
   - Summary of clarifications made
   - Updated spec file path
   - Checklist status
   - Ready for next phase: `/speckit.plan`

