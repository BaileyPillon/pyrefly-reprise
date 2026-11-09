"""targets.py <config name> : the registration of every pose painting (the targets `rig.py fit-keys` makes, without the fit): <work>/targets/targets.json, read by retarget, partition and `rig.py variants`."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pcommon as P  # noqa: E402
import rig_fit  # noqa: E402

party = P.load(sys.argv[1])
build = P.read_json(party.work / "build" / "build.json")
tdir, T = rig_fit.ensure_targets(party.sub, build, retarget=True)
print(f"targets: {len(T['poses'])} poses registered: {', '.join(T['poses'])}")
