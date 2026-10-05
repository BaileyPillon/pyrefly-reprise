import sys, time, json, urllib.request
pid_prefix = sys.argv[1] if len(sys.argv) > 1 else ''
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 540
t0 = time.time()
def j(u):
    return json.load(urllib.request.urlopen('http://127.0.0.1:8188' + u, timeout=20))
while time.time() - t0 < limit:
    q = j('/queue')
    run = [(it[0], it[1]) for it in q['queue_running']]
    pend = [(it[0], it[1]) for it in q['queue_pending']]
    if not any(str(n) == pid_prefix or p.startswith(pid_prefix) for n, p in run + pend):
        break
    time.sleep(15)
q = j('/queue')
print('running', [(it[0], it[1][:8]) for it in q['queue_running']], 'pending', [(it[0], it[1][:8]) for it in q['queue_pending']])
h = j('/history?max_items=6')
for k, v in h.items():
    msgs = {m[0]: m[1].get('timestamp') for m in v['status']['messages'] if isinstance(m[1], dict)}
    st, en = msgs.get('execution_start'), msgs.get('execution_success') or msgs.get('execution_error')
    print(k[:8], v['status']['status_str'], 'exec s', round((en - st) / 1000, 1) if st and en else '?', 'nodes', len(v.get('prompt', [None, None, {}])[2]))
