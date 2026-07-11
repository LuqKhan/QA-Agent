# Andon

**An independent QA agent inside your dev loop.** Your coding agent writes; Andon checks.
Named for the [andon cord](https://en.wikipedia.org/wiki/Andon_(manufacturing)) — pull it and
the line stops until the defect is fixed.

`/qa <ticket>` spawns a fresh-context verification agent that reads the ticket's intent,
drives your **running app** through the real UI and public API, and hands back a
machine-consumable checklist: what works, what's broken (with repro steps), **what was never
built**, and what can't be tested from the outside. Your coding session reads the checklist
and fixes. Change → qa → change.

## Why a separate agent
A coding agent grading its own work shares its own misreadings of the spec — the same reason
developers don't QA their own code. Andon's verifier starts cold: it gets the ticket and an
entry URL, never the diff, never the coding conversation. It derives what "complete" means
before it looks at anything, so silent omissions ("built 80%, said done") land as `missing`
instead of going unnoticed.

## What it deliberately is NOT
- **Not white-box.** The verifier tests from the user's chair: UI + public API only. No DB
  queries, no scheduler internals, no log access. What a user can't observe is reported as
  `untestable` — honestly — rather than guessed.
- **Not a release gate or dashboard.** It's built for the tight loop: minutes per run,
  results as JSON your coding agent consumes directly.
- **Not deterministic.** The protocol pins down what must be repeatable (preflight checks,
  measurement recipes, the output schema); judgment calls (deriving requirements from a vague
  ticket) stay with the model, and ambiguities are routed to you instead of invented.

## Requirements
- Claude Code with subagent support.
- A browser surface: the **Claude-in-Chrome extension** (best — the verifier attaches to your
  logged-in session) or the built-in Claude Code browser pane.
- A running instance of your app that you're logged into. Andon never handles credentials.

## Install
```
/plugin marketplace add <github-owner>/andon
/plugin install andon@andon
```
Private repos work — installers just need git access to the repo.

## Quickstart
1. Log into your app in Chrome (with the Claude extension connected).
2. In your project: `/qa PROJ-1234` (or `/qa "the reminder should reset when edited"`).
3. First run in a project, Andon asks three setup questions (app URL, how it gets an
   authenticated session, where tickets live) and remembers the answers in
   `.claude/qa/ui-map/`. First run is slow discovery; later runs reuse the map and its
   verified measurement recipes and get markedly faster.
4. Read the report; let the session fix what's broken; `/qa` again.

## Recommended permissions
Add to your project's `.claude/settings.local.json` to avoid prompt-per-step on runs:
```json
{
  "permissions": {
    "allow": [
      "mcp__claude-in-chrome",
      "Bash(curl *)",
      "Bash(jq *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(grep *)",
      "Read(.claude/qa/**)",
      "Write(.claude/qa/**)",
      "Edit(.claude/qa/**)"
    ]
  }
}
```
Setting `"defaultMode": "dontAsk"` removes all prompts in the project — personal choice, not a
default Andon assumes.

## Findings contract (schema_version 1)
Runs write JSON to `.claude/qa/runs/`:
```json
{
  "schema_version": 1,
  "verdict": "pass | fail | incomplete | blocked",
  "requirements": [
    {
      "id": "R1",
      "req": "the requirement in words, derived from the ticket",
      "status": "verified | broken | missing | untestable",
      "evidence_type": "direct | proxy",
      "expected": "…", "actual": "…",
      "repro": ["step", "step"],
      "evidence": "exact UI text / API response observed",
      "note": "…"
    }
  ],
  "ambiguities": ["questions the ticket doesn't answer — for the human"],
  "untested_env_gaps": ["what a follow-up run or different environment could cover"]
}
```
`missing` is a first-class status — every derived requirement must land somewhere, so the
coding agent can't pass by not building the hard part. `blocked` means a preflight
precondition failed (wrong build, logged out, unreachable) and no checklist was run.

## Knowledge base
`.claude/qa/ui-map/` grows with every run: navigation facts, environment quirks, and
`recipes.md` — verified probes and seeding procedures that later runs replay instead of
reinvent, which also makes measurements comparable across runs. It records **mechanics only**:
how to drive the app, never what correct behavior is (expectations come fresh from the ticket
every run, so stale assumptions can't bias verdicts). Commit it to share team knowledge, or
gitignore it to keep maps per-developer — Andon works either way.

## Limitations, stated plainly
- Behaviors that take real time (multi-day schedules, queued jobs) can't be observed in one
  session; they're reported `untestable` with what a follow-up should check.
- Quality is bounded by the intent: a two-sentence prompt yields a short checklist plus
  `ambiguities` for you to resolve.
- The verifier treats everything it reads in the app as data, never instructions
  (prompt-injection defense) — text addressed to AI agents gets reported, not obeyed.

## License
MIT
