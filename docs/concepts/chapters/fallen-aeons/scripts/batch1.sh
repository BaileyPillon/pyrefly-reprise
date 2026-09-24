#!/usr/bin/env bash
G=/d/Tools/pyrefly-scratch/fallen-aeons-options/gen.sh
R=D:/Tools/pyrefly-scratch/fallen-aeons-options/renders
COMMON="magus sisters, final fantasy x, aeon, safe"
NEGA="staff, spear, polearm, sword held in hand, cape, cloak, profile, chibi"
# A: armoured sisters, faces visible
bash $G character --name sandy-a2 --pose idle --facing left --composition full --seed 911102 \
  --tags "1girl, solo, sandy \(ff10\), $COMMON, very tall and very slim woman, long legs, pale skin, face visible, dark red hair, red insect armour modelled on a praying mantis, crimson segmented armour plates, narrow red breastplate, red mantis crest on her head with two thin antennae, (curved mantis scythe blades growing from both forearms:1.3), red armoured gauntlets and boots, haughty confident expression, looking at viewer" \
  --poseTags "standing tall, both forearm scythes raised in front of her chest like a praying mantis" \
  --negAdd "$NEGA, wings, blue armour, orange armour, green skin, full helmet, mask" --out "$R/sandy-a2.png"
bash $G character --name cindy-a --pose idle --facing left --composition full --seed 912101 \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, rotund plump heavyset woman, very wide round body, short and stout, face visible, short blonde hair, blue insect armour modelled on a ladybug, (large rounded dome shell on her back like ladybug wing cases:1.2), red shell panels with black round spots, blue armoured chest and gauntlets, short sturdy legs, warm motherly smile, looking at viewer" \
  --poseTags "standing firmly, hands on her hips" \
  --negAdd "$NEGA, thin, slim, tall, wings, orange armour, mask" --out "$R/cindy-a.png"
bash $G character --name mindy-a --pose idle --facing left --composition full --seed 913101 \
  --tags "1girl, solo, mindy \(ff10\), $COMMON, petite small young woman, short, face visible, short blonde hair, orange insect armour modelled on a bee, orange armour with black stripes, striped bee abdomen armour behind her ending in a stinger point, (two small translucent insect wings on her back:1.2), two short antennae, mischievous grin, looking at viewer" \
  --poseTags "legs dangling with toes pointed down, arms spread out, light on her feet" \
  --negAdd "$NEGA, tall, blue armour, red armour, mask" --out "$R/mindy-a.png"
# B: insect helms, faces hidden, creature-forward
bash $G character --name sandy-b --pose idle --facing left --composition full --seed 911201 \
  --tags "1girl, solo, sandy \(ff10\), $COMMON, very tall and very slim armoured woman, long legs, (full helmet shaped like a praying mantis head:1.3), triangular helmet, large green compound eye visor, face hidden, (curved mantis scythe blades growing from both forearms:1.3), red segmented exoskeleton armour covering the whole body, narrow waist, menacing" \
  --poseTags "standing tall, both forearm scythes raised in front of her chest like a praying mantis" \
  --negAdd "$NEGA, wings, blue armour, orange armour, bare face, human face" --out "$R/sandy-b.png"
bash $G character --name cindy-b --pose idle --facing left --composition full --seed 912201 \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, rotund heavyset armoured woman, very wide round body, short and stout, (round dome helmet with a black visor:1.3), face hidden, (huge red ladybug shell with black spots covering her back and shoulders:1.3), blue segmented exoskeleton armour, short sturdy legs, armoured gauntlets" \
  --poseTags "standing firmly, arms held out from her sides" \
  --negAdd "$NEGA, thin, slim, tall, wings, orange armour, bare face, human face" --out "$R/cindy-b.png"
bash $G character --name mindy-b --pose idle --facing left --composition full --seed 913201 \
  --tags "1girl, solo, mindy \(ff10\), $COMMON, small petite armoured girl, (helmet shaped like a bee head with large compound eyes:1.3), face hidden, orange and black striped exoskeleton armour, (striped bee abdomen with a stinger behind her:1.2), (translucent insect wings on her back:1.2), antennae" \
  --poseTags "legs dangling with toes pointed down, arms spread out" \
  --negAdd "$NEGA, tall, blue armour, red armour, bare face, human face" --out "$R/mindy-b.png"
# C: robed aeons, insect as ornament
bash $G character --name sandy-c --pose idle --facing left --composition full --seed 911301 \
  --tags "1girl, solo, sandy \(ff10\), $COMMON, very tall and very slim woman, face visible, long dark red hair, long flowing crimson robe with a high collar, sleeves ending in long pointed blade-shaped cuffs like mantis forelegs, gold mantis ornament on her headdress with two thin antennae, light red chest armour over the robe, elegant, cold expression, looking at viewer" \
  --poseTags "standing tall, hands pressed together in front of her chest" \
  --negAdd "$NEGA, wings, blue robe, orange robe, mask, heavy armour" --out "$R/sandy-c.png"
bash $G character --name cindy-c --pose idle --facing left --composition full --seed 912301 \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, rotund plump heavyset woman, very wide round body, short and stout, face visible, short blonde hair, voluminous round blue robe and a red rounded capelet with black polka dots like a ladybug, blue headdress, gold trim, cheerful motherly smile, looking at viewer" \
  --poseTags "standing firmly, hands clasped in front of her belly" \
  --negAdd "staff, spear, polearm, profile, chibi, thin, slim, tall, wings, orange robe, mask, heavy armour" --out "$R/cindy-c.png"
bash $G character --name mindy-c --pose idle --facing left --composition full --seed 913301 \
  --tags "1girl, solo, mindy \(ff10\), $COMMON, petite small young woman, short, face visible, short blonde hair, short puffy orange dress with black horizontal stripes like a bee, (small translucent insect wings on her back:1.2), two short antennae on a headband, orange gloves and boots, mischievous grin, looking at viewer" \
  --poseTags "legs dangling with toes pointed down, arms spread out, light on her feet" \
  --negAdd "$NEGA, tall, blue dress, red dress, mask, heavy armour" --out "$R/mindy-c.png"
echo BATCH1-DONE
