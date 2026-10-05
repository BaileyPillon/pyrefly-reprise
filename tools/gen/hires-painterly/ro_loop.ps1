# supervisor: runs the roll-out, restarts it (it resumes from the manifest) until RW\ALLDONE or RW\STOP exists
$py = 'D:\Tools\ComfyUI\python_embeded\python.exe'
$rw = 'D:\Tools\pyrefly-scratch\2026-10-05\rollout'
$r39 = 'D:\Tools\pyrefly-scratch\2026-10-04\r39-art'
Set-Location $r39
while (-not (Test-Path "$rw\ALLDONE") -and -not (Test-Path "$rw\STOP")) {
  & $py -s tools/ro_run.py --workers 2 --inflight 3 *>> "$r39\logs\ro-run.log"
  Start-Sleep -Seconds 60
}
