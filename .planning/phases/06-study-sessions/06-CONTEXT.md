# Phase 6: Study Sessions - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

LLM-powered study aids from pasted notes for exam and reading tasks. User pastes content, system generates summary, key terms, and practice questions. Must work in mock mode without LLM. No graded assignment answers or essay content generation.

</domain>

<decisions>
## Implementation Decisions

### Study Session Flow
- "Start Study Session" button on exam and reading task cards (in task list or daily view)
- Route: `/study?task_id={id}` or `/study/{taskId}`
- User pastes notes or chapter headings into a textarea
- Click "Generate" to produce study aids
- Three output sections: Summary (bullets), Key Terms (term + definition pairs), Practice Questions (8-12 mixed recall + conceptual)
- User can regenerate with same or different input
- No persistence of study session content to database (ephemeral)

### LLM Integration
- Feature-flagged on `OPENAI_API_KEY` environment variable (same pattern as syllabus LLM parser)
- When LLM available: send notes to AI with structured output prompt
- Use AI SDK `generateObject` / `Output.object` pattern (same as parser-llm.ts)
- System prompt explicitly instructs: no answers to graded assignments, no essay content, study aids only

### Mock Mode
- When no `OPENAI_API_KEY` is configured, return deterministic mock output
- Mock output: generic study summary, sample key terms, sample practice questions
- Mock output should be clearly labeled as "Mock mode — configure OpenAI API key for real study aids"
- Mock mode allows the full UI to be tested without API costs

### Safety Guardrails
- Only available for exam and reading task types (not assignment or other)
- System prompt includes ethical boundary: "Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework."
- If user tries to start study session for an assignment task, show message explaining it's only for exam/reading prep

### Claude's Discretion
- Exact UI layout for study session page
- LLM prompt engineering for quality output
- Mock mode content (realistic but clearly labeled)
- Whether to stream LLM output or wait for complete response
- Practice question format (multiple choice, short answer, mix)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-study-sessions*
*Context gathered: 2026-03-02*
