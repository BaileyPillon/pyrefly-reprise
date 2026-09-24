import json, time, urllib.request, sys
need = float(sys.argv[1]) if len(sys.argv) > 1 else 180
empty_since = None
while True:
    try:
        q = json.load(urllib.request.urlopen('http://127.0.0.1:8188/queue', timeout=10))
        busy = len(q['queue_running']) + len(q['queue_pending'])
    except Exception as e:
        busy = 1
    now = time.time()
    if busy:
        empty_since = None
    elif empty_since is None:
        empty_since = now
    if empty_since and now - empty_since >= need:
        print('queue empty for', int(now - empty_since), 's'); break
    time.sleep(5)
