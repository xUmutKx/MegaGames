"""Merge tools/agents/*.js (window.__AG_<name> IIFEs) into assets/mega.html. Idempotent: replaces the previous block."""
import glob, os, re, subprocess, sys
D = '/root/projects/MegaGames'
P = D + '/app/src/main/assets/mega.html'
html = open(P, encoding='utf-8').read()

files = sorted(f for f in glob.glob(D + '/tools/agents/*.js')
               if not f.endswith('.stubs.js') and os.path.basename(f) not in ('harness.js', 'sample.js'))
names = []
blocks = []
for f in files:
    src = open(f, encoding='utf-8').read()
    m = re.search(r'window\.__AG_(\w+)\s*=', src)
    if not m:
        print('skip (no __AG_):', f); continue
    if subprocess.run(['node', '--check', f], capture_output=True).returncode:
        print('skip (syntax error, truncated agent file):', f); continue
    names.append(m.group(1))
    blocks.append('/* --- agent: %s --- */\n%s\n' % (m.group(1), src))
print('merging:', names)

B1, B2 = '/* ===== AGENT PACKS BEGIN ===== */', '/* ===== AGENT PACKS END ===== */'
html = re.sub(re.escape(B1) + r'.*?' + re.escape(B2) + r'\n?', '', html, flags=re.S)
html = re.sub(r'/\* ===== AGENT AAA BEGIN ===== \*/.*?/\* ===== AGENT AAA END ===== \*/\n?', '', html, flags=re.S)

# 1) engines + minis, right after the last built-in pack registration
anchor = 'Object.assign(ENGINES,PACK14_ENGINES);MINIS.push(...PACK14_MINIS);'
assert html.count(anchor) == 1, 'anchor for packs not found'
reg = ('\n' + B1 + '\n' + '\n'.join(blocks) +
       'window.__AG_PACKS=[' + ','.join('window.__AG_' + n for n in names) + '];\n'
       '(function(){for(const r of window.__AG_PACKS){if(!r)continue;Object.assign(ENGINES,r.engines||{});'
       'for(const m of (r.minis||[])){const i=MINIS.findIndex(x=>x.id===m.id);if(i>=0)MINIS[i]=Object.assign({},MINIS[i],m);else MINIS.push(m)}}})();\n' + B2 + '\n')
html = html.replace(anchor, anchor + reg)

# 2) big modules, right after `const AAA=[ ... ];`
i = html.index('const AAA=[')
j = html.index('\n];', i) + 3
aaa = ('\n/* ===== AGENT AAA BEGIN ===== */\nwindow.AAA_MODS={};(function(){for(const r of (window.__AG_PACKS||[])){if(!r)continue;'
       'for(const a of (r.aaa||[])){const e=Object.assign({},a);delete e.mod;if(!AAA.some(x=>x.id===e.id))AAA.push(e);window.AAA_MODS[a.id]=a.mod}}})();\n/* ===== AGENT AAA END ===== */\n')
html = html[:j] + aaa + html[j:]

# 3) launchAAA / restart: look the module up in AAA_MODS first
old = 'const mod=key==="voxel"?Voxel:'
assert html.count(old) == 2 or 'AAA_MODS[key]' in html, 'mapping lines not found'
if 'AAA_MODS[key])||(' not in html:
    html = html.replace('const mod=key==="voxel"?Voxel:key==="calradia"?Calradia:key==="drift3d"?Drift3D:key==="spellmerge"?SpellMerge:key==="horde"?Horde:key==="bastion"?Bastion:NeonFighter;',
                        'const mod=(window.AAA_MODS&&window.AAA_MODS[key])||(key==="voxel"?Voxel:key==="calradia"?Calradia:key==="drift3d"?Drift3D:key==="spellmerge"?SpellMerge:key==="horde"?Horde:key==="bastion"?Bastion:NeonFighter);')
    assert html.count('AAA_MODS[key])||(') == 2, 'mapping replace failed'
open(P, 'w', encoding='utf-8').write(html)
print('merged into mega.html', len(html), 'bytes')
