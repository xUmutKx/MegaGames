import json, sys
p = json.load(open('/sdcard/Download/projects/MegaGames/tools/gi_paths.json'))
s = sorted({x.split('/')[1][:-4] for x in p})
for k in sys.argv[1:]:
    print(k, [x for x in s if k in x][:16])
