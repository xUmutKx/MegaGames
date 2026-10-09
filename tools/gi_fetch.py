import json, subprocess, sys
out = subprocess.run(['gh', 'api', 'repos/game-icons/icons/git/trees/master?recursive=1', '--jq', '[.tree[]|select(.path|endswith(".svg"))|.path]'],
                     capture_output=True, text=True)
print(out.returncode, len(out.stdout), out.stderr[:300])
if out.returncode == 0:
    paths = json.loads(out.stdout)
    open('/root/projects/MegaGames/tools/gi_paths.json', 'w').write(json.dumps(paths))
    print(len(paths), paths[:5])
