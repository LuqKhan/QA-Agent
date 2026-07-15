# Andon

**Andon tests what your coding agent built, in your browser.**

Works as a Claude Code plugin. Tests any web app you can open in Chrome.

![Demo: the agent testing a fix by itself](media/demo.gif)

*The agent testing a fix by itself. It types an invalid NPI and saves. The old build
accepted it silently. This one rejects it.*

---

## Use it

1. Install:
```
/plugin marketplace add LuqKhan/Andon
/plugin install andon@andon
```

2. Log into your app in Chrome, then run `/qa setup` in your project. It asks three
questions, saves the permissions it needs, and learns your app's pages.

3. Say what you want tested:
```
/qa "clicking save should clear the reminder banner"
/qa quick "does the setup banner disappear once the profile is completed?"
```

You get a checklist back. Every requirement ends in one of four states: verified, broken
with steps to reproduce, missing, or untestable with the exact reason. Your coding session
reads it, fixes, and you run it again.

---

## Make it fast

Most of a run is the model thinking between browser clicks. The first time the agent tests
something, it drives the browser step by step, which is slow. Then it saves those steps as
a script. The same check later runs in seconds, in your real Chrome, with your login.

Once per machine (needs Node 18+):

```bash
cd ~/.claude/plugins/cache/andon/andon/*/runner
npm install

# Quit Chrome completely, then relaunch it with:
open -a "Google Chrome" --args --remote-debugging-port=9222
```

That flag lets programs on your machine control that Chrome window. Fine on a dev machine.
Skip it anywhere else. Everything still works without it, just slower.

---

## Sharing what it learns

The agent saves what it learns about your app in `.claude/qa/`. Pages, routes, quirks.
Never expectations, never credentials. It gets faster every run.

Commit that folder and your whole team shares the learning. If you don't want QA files in
the main repo, point it at a small private repo of its own during setup. Or gitignore it
and keep it personal. All three work.

---

## Is it safe?

It only touches test data it created itself, with a `QA-agent` prefix and fake example.com
emails. It never enters passwords; logging in is your job. It never touches billing, user
management, or account settings. Production is read-only: it asks before saving anything
there, and puts back whatever it changed.

## License

MIT
