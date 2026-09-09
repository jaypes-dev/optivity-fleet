# This fork

`optivity-fleet` is a fork of [fleetdm/fleet](https://github.com/fleetdm/fleet),
maintained for Optivity's Shadow AI Discovery Tool
(see [optivity-shadow-ai-scanner](https://github.com/jaypes-dev/optivity-shadow-ai-scanner)
for the actual detection logic, reporting, and packaging built on top of it).

## What's changed vs. upstream

One patch, currently: `orbit/pkg/packaging/windows.go` and
`windows_templates.go` are rebranded from "Fleet osquery" / "Fleet Device
Management (fleetdm.com)" to Optivity's own naming, so the Windows MSI and
Windows Service show Optivity branding instead of Fleet's. Scoped
deliberately to Windows product/service naming — see the scanner repo's
README for what's out of scope and why (macOS paths, `osqueryd` itself,
the update URL).

## Staying in sync with upstream

`.github/workflows/sync-upstream.yml` runs weekly: rebases this fork's
patch onto the latest `upstream/main`, verifies `fleetctl` still builds
with the patch applied, and only then force-pushes. If upstream changes
touch the same lines this patch does, or the build breaks, the workflow
fails instead of pushing — check the Actions tab and resolve the conflict
by hand (re-diff the change against the current source, same as if you
were reapplying it fresh).

Manual sync, if needed:
```
git fetch upstream main
git rebase upstream/main
go build ./cmd/fleetctl   # sanity check
git push --force-with-lease origin HEAD:main
```
