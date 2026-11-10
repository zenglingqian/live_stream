"""Check a locale dictionary against i18n/strings.json.

Usage: python i18n/verify.py en        (or zh-TW / ja / ru / all)
"""
import io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
keys = [x['zh'] for x in json.load(io.open(os.path.join(HERE, 'strings.json'), encoding='utf-8'))['strings']]
kset = set(keys)

targets = sys.argv[1:] or ['zh-TW', 'en', 'ja', 'ru']
for name in targets:
    p = os.path.join(HERE, name + '.json')
    try:
        d = json.load(io.open(p, encoding='utf-8'))
    except Exception as e:
        print('%s: INVALID JSON or missing (%s)' % (name, e))
        continue
    missing = [k for k in keys if k not in d]
    extra = [k for k in d if k not in kset]
    empty = [k for k in d if not isinstance(d[k], str) or not d[k].strip()]
    same = [k for k in d if isinstance(d[k], str) and d[k].strip() == k.strip()]
    print('%s: need %d have %d missing %d extra %d empty %d untranslated %d' % (name, len(keys), len(d), len(missing), len(extra), len(empty), len(same)))
    for label, items in (('MISSING', missing), ('EXTRA', extra), ('EMPTY', empty)):
        if items:
            print('  %s: %s' % (label, json.dumps(items[:6], ensure_ascii=False)))
