# qa-agent

A Claude Code plugin that adds a `/qa` command. It tests your running app against what you
asked for, and tells you what works, what's broken, what never got built, and what it
couldn't test.

![Demo: the agent testing a fix by itself](media/demo.gif)

*The agent testing a fix by itself. It types an invalid NPI and saves. The old build
accepted it silently. This one rejects it.*

## How it works

When you run `/qa`, a second agent starts with a clean slate. It reads what you asked to
test, decides what done means, then opens your app in your browser and checks each
requirement the way a user would. If your product has an API, it checks that too. Then it
writes a report your coding session can read and fix from. You fix, and run it again.

The verifier never sees your code or your conversation. That's deliberate. An agent that
checks its own work misses the same things it missed while writing it. A fresh reader
doesn't.

## What you need

Claude Code on your desktop, the Claude in Chrome extension, and a running app that you're
logged into. The agent never types passwords. Logging in is your job.

Node 18 or newer if you want the fast runner, which you probably do.

## Install

```
/plugin marketplace add LuqKhan/QA-Agent
/plugin install qa-agent@qa-agent
```

## First run

In your project:

```
/qa "clicking save should clear the reminder banner"
/qa PROJ-1234
```

Just say what you want tested. Tickets work too if your team has them, but a plain sentence
is the normal way.

The first time you use it in a project it asks three questions: where the app runs, how it
gets a logged-in browser, and whether you use tickets. It also offers to save the
permissions it needs so later runs don't keep asking. Say yes.

Or run `/qa setup` right after installing. It does all of this at once, so your first real
check starts warm.

## Quick checks

For a single question instead of a whole feature:

```
/qa quick "does the setup banner disappear once the profile is completed?"
```

## The fast runner

Most of a run is the model thinking between browser clicks. The first time the agent tests
something, it drives the browser step by step, which is slow. Then it saves those steps as
a script. The same check later runs in seconds, in your real Chrome, with your login.

Once per machine:

```bash
cd ~/.claude/plugins/cache/qa-agent/qa-agent/*/runner
npm install

# Quit Chrome completely, then relaunch it with:
open -a "Google Chrome" --args --remote-debugging-port=9222
```

That flag lets programs on your machine control that Chrome window. Fine on a dev machine.
Skip it anywhere else. Everything still works without it, just slower.

## Sharing what it learns

The agent saves what it learns about your app in `.claude/qa/`. Pages, routes, quirks.
Never expectations, never credentials. It gets faster every run.

Commit that folder and your whole team shares the learning. If you don't want QA files in
the main repo, point it at a small private repo of its own during setup. Or gitignore it
and keep it personal. All three work.

## The report

Each run writes a JSON report to `.claude/qa/runs/` and summarizes it in chat. Every
requirement ends in one of four states: verified, broken with steps to reproduce, missing,
or untestable with the exact reason.

Missing is why the tool exists. Coding agents like to say done when they've built most of
it. And when what you asked is too vague to judge, the agent asks you instead of guessing.

The exact format is in [examples/findings-example.json](examples/findings-example.json).

## Safety rules

It only touches test data it created itself, with a `QA-agent` prefix and fake example.com
emails. It never enters passwords, and never touches billing, user management, or account
settings. Production is read-only: it asks before saving anything there, and puts back
whatever it changed.

## License

MIT
