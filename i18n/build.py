"""Regenerate web/i18n.js from the engine template plus the per-locale dictionaries.

Run from anywhere: python i18n/build.py
Dictionaries are flat {source Simplified Chinese: translation} JSON, keyed exactly by
the strings listed in i18n/strings.json.
"""
import io, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOCALES = ['zh-TW', 'en', 'ja', 'ru']


def path(*parts):
    return os.path.join(HERE, *parts)


src = json.load(io.open(path('strings.json'), encoding='utf-8'))
keys = [x['zh'] for x in src['strings']]
kset = set(keys)

parts, report = [], []
for loc in LOCALES:
    p = path(loc + '.json')
    if not os.path.exists(p):
        report.append('%s: absent' % loc)
        continue
    d = json.load(io.open(p, encoding='utf-8'))
    d = {k: v for k, v in d.items() if isinstance(v, str) and v.strip() and k in kset}
    parts.append('"%s":%s' % (loc, json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')))
    report.append('%s: %d keys, missing %d' % (loc, len(d), len([k for k in keys if k not in d])))

tpl = io.open(path('engine.template.js'), encoding='utf-8').read()
assert 'var D = {/*LOCALES*/};' in tpl, 'placeholder missing from engine.template.js'
out = tpl.replace('var D = {/*LOCALES*/};', 'var D = {' + ','.join(parts) + '};', 1)
target = os.path.join(ROOT, 'web', 'i18n.js')
io.open(target, 'w', encoding='utf-8', newline='\n').write(out)
print('\n'.join(report))
print('wrote', target, os.path.getsize(target), 'bytes')
