import json
paths = json.load(open('/root/projects/MegaGames/tools/fluent_paths.json'))
names = [p.split('/')[1] for p in paths]
for w in ['mage', 'vampire', 'run', 'snowboard', 'astronaut', 'levitat', 'bicycl', 'bik', 'suit', 'castle', 'sorcer', 'wizard', 'fairy', 'zombie', 'genie', 'elf', 'person']:
    print(w, [n for n in names if w in n.lower()][:12])
