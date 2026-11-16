#!/usr/bin/env bash
# ============================================================
# .claude/hooks/validate-ac.sh
# ------------------------------------------------------------
# Continuous backlog guard (PreToolUse).
#
# Purpose: block any change to a backlog epic file
# (backlog/E<NN>-<slug>.md) that would leave a story with
# `**Status:** done` but without acceptance criteria in
# Given/When/Then format.
#
# Why PreToolUse and not PostToolUse: a PostToolUse hook runs
# after the file is already written. Only a PreToolUse hook that
# exits with code 2 can block the change before it happens.
#
# How it works:
#   1. Reads the hook payload (JSON) from stdin.
#   2. Ignores everything except Write / Edit / MultiEdit on
#      backlog/E*.md files.
#   3. Builds the file content as it WOULD be after the change
#      (Write: new content; Edit/MultiEdit: current file with the
#      replacements applied).
#   4. Splits it into `## REC-<NNN>` story sections and checks:
#      a. A story whose Status is `done` must have Given ... When ...
#         Then (on one line or across consecutive lines) under
#         `### Acceptance criteria`.
#      b. A story flagged `needs-human-validation` cannot have
#         Status `in-progress` or `done`.
#      c. The `needs-human-validation` flag cannot be removed from a
#         story unless `**Estimate:**` (the team estimate) is set to a
#         Fibonacci value (1|2|3|5|8|13) or `spike <N>h`, not `—`.
#      d. `**Estimate:**` and `**AI estimate:**`, when set (not `—`),
#         must be a Fibonacci value (1|2|3|5|8|13, optional "SP") or
#         `spike <N>h`.
#   5. Any failure -> exit 2 with the failing story IDs on stderr.
#
# Claude Code protocol:
#   - exit 0 -> allow the tool call.
#   - exit 2 -> block the tool call; stderr is shown to Claude.
#
# Limitation: edits made through Bash (sed, heredocs, ...) bypass
# this hook.
#
# Requires: python3.
# ============================================================

set -uo pipefail

PY_SCRIPT=$(cat <<'PYEOF'
import json, os, re, sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)  # not our business to fail on malformed input

tool = payload.get("tool_name", "")
if tool not in ("Write", "Edit", "MultiEdit"):
    sys.exit(0)

ti = payload.get("tool_input") or {}
path = ti.get("file_path") or ""
if not path:
    sys.exit(0)
if not os.path.isabs(path):
    path = os.path.join(payload.get("cwd") or os.getcwd(), path)

parent = os.path.basename(os.path.dirname(path))
name = os.path.basename(path)
if parent != "backlog" or not re.match(r"^E\d+.*\.md$", name):
    sys.exit(0)

def read_current():
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None

def apply_edit(text, old, new, replace_all):
    if text is None or not old or old not in text:
        return None  # the tool itself will fail; let it
    return text.replace(old, new) if replace_all else text.replace(old, new, 1)

before = read_current()

if tool == "Write":
    content = ti.get("content", "")
elif tool == "Edit":
    content = apply_edit(read_current(), ti.get("old_string", ""),
                         ti.get("new_string", ""), bool(ti.get("replace_all")))
else:  # MultiEdit
    content = read_current()
    for e in ti.get("edits") or []:
        content = apply_edit(content, e.get("old_string", ""),
                             e.get("new_string", ""), bool(e.get("replace_all")))
        if content is None:
            break

if content is None:
    sys.exit(0)

story_re = re.compile(r"^##\s+(REC-\d+)\b.*$", re.M)
status_re = re.compile(r"^\s*[-*]\s*\*\*Status:\*\*\s*`?([A-Za-z-]+)`?", re.M | re.I)
ac_head_re = re.compile(r"^###\s+Acceptance criteria\s*$", re.M | re.I)
gwt_re = re.compile(r"\bgiven\b.*?\bwhen\b.*?\bthen\b", re.I | re.S)
flags_re = re.compile(r"^\s*[-*]\s*\*\*Flags:\*\*(.*)$", re.M | re.I)
estimate_re = re.compile(r"^\s*[-*]\s*\*\*Estimate:\*\*(.*)$", re.M | re.I)
ai_estimate_re = re.compile(r"^\s*[-*]\s*\*\*AI estimate:\*\*(.*)$", re.M | re.I)
valid_estimate_re = re.compile(
    r"^`?((1|2|3|5|8|13)(\s*SP)?|spike\s*\d+(\.\d+)?\s*h)`?$", re.I)
UNSET = ("", "—", "-", "–")
HV = "needs-human-validation"

def sections(text):
    out = {}
    if not text:
        return out
    ms = list(story_re.finditer(text))
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(text)
        out.setdefault(m.group(1), text[m.start():end])
    return out

def has_hv_flag(section):
    f = flags_re.search(section)
    return bool(f and HV in f.group(1))

def estimate_ok(section):
    e = estimate_re.search(section)
    return bool(e and valid_estimate_re.match(e.group(1).strip()))

def bad_values(section):
    """Estimate fields that are set (not '—') but not a valid value."""
    bad = []
    for label, rx in (("Estimate", estimate_re), ("AI estimate", ai_estimate_re)):
        m = rx.search(section)
        if m:
            v = m.group(1).strip()
            if v not in UNSET and not valid_estimate_re.match(v):
                bad.append((label, v))
    return bad

old_sections = sections(before)
failures = []
for sid, section in sections(content).items():
    st = status_re.search(section)
    status = st.group(1).lower() if st else ""
    flagged = has_hv_flag(section)

    # b. Unvalidated stories cannot be started or finished.
    if flagged and status in ("in-progress", "done"):
        failures.append(f"{sid}: flagged '{HV}', cannot be '{status}' "
                        "until a human validates it")

    # c. The flag cannot be removed without an agreed Estimate.
    old = old_sections.get(sid)
    if old and has_hv_flag(old) and not flagged and not estimate_ok(section):
        failures.append(f"{sid}: '{HV}' removed but the team '**Estimate:**' is "
                        "not set (use 1|2|3|5|8|13 or 'spike <N>h')")

    # d. Estimates must use the Fibonacci scale (or a spike timebox).
    for label, v in bad_values(section):
        failures.append(f"{sid}: '**{label}:** {v}' is not valid "
                        "(use 1|2|3|5|8|13 or 'spike <N>h')")

    # a. Done stories need Given/When/Then criteria.
    if status != "done":
        continue
    head = ac_head_re.search(section)
    if not head:
        failures.append(f"{sid}: done, but no '### Acceptance criteria' section")
        continue
    ac = section[head.end():]
    nxt = re.search(r"^#{1,3}\s", ac, re.M)
    if nxt:
        ac = ac[:nxt.start()]
    if not gwt_re.search(ac):
        failures.append(f"{sid}: done, but no Given/When/Then criteria")

if not failures:
    sys.exit(0)

lines = "\n".join(f"   - {f}" for f in failures)
sys.stderr.write(f"""validate-ac: blocked change to {name}.
{lines}

Rules (see AGENTS.md, "Backlog quality rules"):
   - 'done' needs Given/When/Then under '### Acceptance criteria'.
   - '{HV}' stories cannot be 'in-progress' or 'done'.
   - '{HV}' is removed only by a human, and only once '**Estimate:**' is set.
   - '**Estimate:**' and '**AI estimate:**' use 1|2|3|5|8|13 or 'spike <N>h'.
""")
sys.exit(2)
PYEOF
)

exec python3 -I -c "$PY_SCRIPT"
