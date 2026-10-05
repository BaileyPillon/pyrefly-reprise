"""gpu_watch.py: keeps the hires refine batch (P3, overnight) polite about the driver's PAUSE-GPU file, and stops it at 08:00 EDT.

Runs detached (WMI). Every 15 s:
  * PAUSE-GPU exists and the batch is running            -> create hires/STOP (the driver finishes the job in flight and its workers, then exits); note it.
  * PAUSE-GPU is gone and we made the STOP                -> wait until the supervisor has exited, move STOP aside (STOP.used-HHMMSS), start the supervisor again (WMI).
  * the clock passes 2026-10-05 08:00 (machine time, EDT) -> create hires/STOP for good (the final stop) and exit.
It only touches hires/STOP when the file OVERNIGHT-ON exists in the r39-art scratch folder (so it can be switched off by deleting that file).
Log: D:/Tools/pyrefly-scratch/2026-10-04/r39-art/logs/gpu_watch.log
"""
import datetime
import os
import subprocess
import sys
import time

R39 = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art'
HIRES = 'D:/Tools/pyrefly-art-backup/hires'
PAUSE = f'{R39}/PAUSE-GPU'
ON = f'{R39}/OVERNIGHT-ON'
MINE = f'{R39}/watcher-made-stop'
LOG = f'{R39}/logs/gpu_watch.log'
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
TOOLS = 'D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools'
PLAN = 'E:P1,E:P2,E:P3,E:P4,E:P5,E:P6,D:P1,D:P2,D:P3,D:P4,D:P5'
FINAL = datetime.datetime(2026, 10, 5, 8, 0, 0)


def log(m):
    with open(LOG, 'a', encoding='utf8') as f:
        f.write(f'{datetime.datetime.now():%Y-%m-%d %H:%M:%S} {m}\n')


def supervisor_running():
    try:
        out = subprocess.check_output(['wmic', 'process', 'where', "name='python.exe'", 'get', 'CommandLine'], text=True, errors='ignore')
        return 'hires_supervisor' in out or 'hires_driver' in out
    except Exception:
        return False


def start_supervisor():
    cmd = f'"{PY}" -s "{TOOLS}/hires_supervisor.py" --workers 3 --plan {PLAN}'
    ps = ("$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '" + cmd.replace("'", "''") +
          "'; CurrentDirectory = '" + TOOLS.replace('/', '\\') + "' }; \"$($r.ReturnValue) $($r.ProcessId)\"")
    r = subprocess.run(['powershell', '-NoProfile', '-Command', ps], capture_output=True, text=True)
    log(f'supervisor started via WMI: {r.stdout.strip()} {r.stderr.strip()[:200]}')


def stop_path():
    return f'{HIRES}/STOP'


def main():
    log('watcher start')
    while True:
        try:
            now = datetime.datetime.now()
            if os.path.exists(ON):
                if now >= FINAL:
                    if not os.path.exists(stop_path()):
                        open(stop_path(), 'w').write(f'{now} r39-art final stop (08:00)\n')
                    log('08:00 reached: final STOP written; watcher exits')
                    return
                paused = os.path.exists(PAUSE)
                if paused and not os.path.exists(stop_path()) and supervisor_running():
                    open(stop_path(), 'w').write(f'{now} r39-art: PAUSE-GPU\n')
                    open(MINE, 'w').write(str(now))
                    log('PAUSE-GPU seen: hires/STOP written')
                elif (not paused) and os.path.exists(MINE):
                    if not supervisor_running():
                        if os.path.exists(stop_path()):
                            os.replace(stop_path(), f'{stop_path()}.used-{now:%H%M%S}')
                        os.remove(MINE)
                        start_supervisor()
                        log('PAUSE-GPU gone: batch resumed')
        except Exception as e:
            log(f'error {type(e).__name__}: {e}')
        time.sleep(15)


if __name__ == '__main__':
    main()
