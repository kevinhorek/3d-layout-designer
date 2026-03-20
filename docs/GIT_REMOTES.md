# Git: push to both GitHub remotes

`origin` is set up so **one push** updates both repositories:

| Role | URL |
|------|-----|
| **Fetch** (default) | `https://github.com/kevinhorek/3d-layout-designer.git` |
| **Push** | `https://github.com/COE-CRC/rams-3d-layout-designer.git` |
| **Push** | `https://github.com/kevinhorek/3d-layout-designer.git` |

```bash
git push origin main    # pushes to both
git push origin dev     # same for other branches
```

## New clone: add the second push URL yourself

If you only cloned one repo, add the other as an extra push URL (keep your existing `url` for fetch):

```bash
git remote set-url --add --push origin https://github.com/COE-CRC/rams-3d-layout-designer.git
git remote set-url --add --push origin https://github.com/kevinhorek/3d-layout-designer.git
```

Then `git remote -v` should list two `(push)` lines for `origin`.

**Note:** `.git/config` is local; this file documents the intended setup for the team.
