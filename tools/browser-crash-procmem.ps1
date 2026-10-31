param([string]$Pids)
# One sample of the browser's process tree: working set, private bytes, GPU dedicated/shared memory per pid, plus the host's totals. Prints one JSON line. Read only.
$ErrorActionPreference = 'SilentlyContinue'
$ids = @($Pids -split ',' | Where-Object { $_ } | ForEach-Object { [int]$_ })
$procs = @()
foreach ($i in $ids) {
  $p = Get-Process -Id $i
  if ($p) { $procs += [pscustomobject]@{ id = $i; name = $p.ProcessName; ws = [int64]$p.WorkingSet64; pm = [int64]$p.PrivateMemorySize64 } }
}
$c = Get-Counter '\GPU Process Memory(*)\Dedicated Usage', '\GPU Process Memory(*)\Shared Usage', '\Processor(_Total)\% Processor Time'
$ded = @{}; $shr = @{}; $cpu = $null
foreach ($s in $c.CounterSamples) {
  if ($s.Path -match 'dedicated usage') { if ($s.InstanceName -match '^pid_(\d+)_') { $ded[[int]$Matches[1]] = [int64]($ded[[int]$Matches[1]]) + [int64]$s.CookedValue } }
  elseif ($s.Path -match 'shared usage') { if ($s.InstanceName -match '^pid_(\d+)_') { $shr[[int]$Matches[1]] = [int64]($shr[[int]$Matches[1]]) + [int64]$s.CookedValue } }
  elseif ($s.Path -match 'processor time') { $cpu = [math]::Round($s.CookedValue, 1) }
}
foreach ($p in $procs) { $p | Add-Member -NotePropertyName gpuDed -NotePropertyValue ([int64]($ded[$p.id])) ; $p | Add-Member -NotePropertyName gpuShr -NotePropertyValue ([int64]($shr[$p.id])) }
$totDed = [int64](($ded.Values | Measure-Object -Sum).Sum)
$os = Get-CimInstance Win32_OperatingSystem
$mine = @($ids)
$others = @($ded.GetEnumerator() | Where-Object { $mine -notcontains $_.Key } | Sort-Object Value -Descending | Select-Object -First 3 | ForEach-Object { "$($_.Key):$([int]($_.Value/1MB))MB" })
[pscustomobject]@{ procs = $procs; hostCpu = $cpu; hostFreeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 1); gpuDedTotalMB = [int]($totDed / 1MB); gpuOthers = $others } | ConvertTo-Json -Compress -Depth 4
