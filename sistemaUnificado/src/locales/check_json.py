import json

def check_duplicates(ordered_pairs):
    d = {}
    for k, v in ordered_pairs:
        if k in d:
            print(f"Duplicate key found: {k}")
        else:
            d[k] = v
    return d

try:
    with open(r'c:\Users\Eros\SistemaDeUsuarios\frontend\src\locales\es.json', 'r', encoding='utf-8') as f:
        json.load(f, object_pairs_hook=check_duplicates)
    print("No duplicates found by script.")
except Exception as e:
    print(f"Error: {e}")
