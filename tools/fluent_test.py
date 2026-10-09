import json, subprocess
r = subprocess.run(['gh', 'api', 'repos/microsoft/fluentui-emoji/git/trees/main?recursive=1', '--jq', '[.tree[]|select((.path|startswith("assets/")) and (.path|contains("/3D/")) and ((.path|endswith("_3d.png")) or (.path|endswith("_3d_default.png"))))|.path]'], capture_output=True, text=True)
print(r.returncode, len(r.stdout), r.stderr[:300])
if r.returncode == 0:
    p = json.loads(r.stdout)
    print(len(p), p[:3])
    open('/root/projects/MegaGames/tools/fluent_paths.json', 'w').write(json.dumps(p))
    b = subprocess.run(['gh', 'api', 'repos/microsoft/fluentui-emoji/contents/' + p[0].replace(' ', '%20'), '-H', 'Accept: application/vnd.github.raw'], capture_output=True)
    print(b.returncode, len(b.stdout), b.stdout[:8], b.stderr[:200])
