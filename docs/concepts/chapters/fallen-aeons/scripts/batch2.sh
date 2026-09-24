#!/usr/bin/env bash
G=/d/Tools/pyrefly-scratch/fallen-aeons-options/gen.sh
R=D:/Tools/pyrefly-scratch/fallen-aeons-options/renders
COMMON="magus sisters, final fantasy x, aeon, safe"
NEGA="staff, spear, polearm, sword held in hand, cape, cloak, profile, chibi"
FAT="(fat:1.35), (plump:1.3), chubby, round face, round belly, thick arms, very wide round body, short and stout"
bash $G character --name sandy-a3 --pose idle --facing left --composition full --seed 911103 \
  --tags "1girl, solo, sandy \(ff10\), $COMMON, very tall and very slim woman, long legs, pale skin, face visible, dark red hair, red insect armour modelled on a praying mantis, crimson segmented armour plates, narrow red breastplate, red mantis crest on her head with two thin antennae, (a curved mantis scythe blade on each forearm:1.25), red armoured gauntlets and boots, haughty confident expression, looking at viewer" \
  --poseTags "standing tall, both forearm scythes raised in front of her chest like a praying mantis" \
  --negAdd "$NEGA, wings, blue armour, orange armour, green skin, full helmet, mask, ribbons, many blades" --out "$R/sandy-a3.png"
bash $G character --name cindy-a2 --pose idle --facing left --composition full --seed 912102 \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, mature woman, $FAT, face visible, short blonde hair, blue insect armour modelled on a ladybug, (large rounded dome shell on her back like ladybug wing cases:1.2), red shell with black round spots, blue armoured breastplate and gauntlets, short sturdy legs, warm motherly smile, looking at viewer" \
  --poseTags "standing firmly, hands on her hips" \
  --negAdd "$NEGA, thin, slim, skinny, tall, wings, orange armour, mask, pregnant, fins, scales" --out "$R/cindy-a2.png"
bash $G character --name mindy-a2 --pose idle --facing left --composition full --seed 913102 \
  --tags "1girl, solo, mindy \(ff10\), $COMMON, petite small young woman, short, face visible, short blonde hair, (orange insect armour modelled on a bee:1.3), orange armour plates with black stripes, armoured breastplate, striped bee abdomen armour behind her ending in a stinger point, (two small translucent insect wings on her back:1.2), two short antennae, orange armoured boots and gloves, mischievous grin, looking at viewer" \
  --poseTags "legs dangling with toes pointed down, arms spread out, light on her feet" \
  --negAdd "$NEGA, tall, blue armour, red armour, mask, dress, skirt, barefoot" --out "$R/mindy-a2.png"
bash $G character --name cindy-b2 --pose idle --facing left --composition full --seed 912202 \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, armoured woman, $FAT, (round dome helmet with a black visor:1.3), face hidden, (huge red ladybug shell with black spots covering her back and shoulders:1.3), blue segmented exoskeleton armour, short sturdy legs, armoured gauntlets" \
  --poseTags "standing firmly, arms held out from her sides" \
  --negAdd "$NEGA, thin, slim, skinny, tall, wings, orange armour, bare face, human face, robot" --out "$R/cindy-b2.png"
bash $G character --name cindy-c2 --pose idle --facing left --composition full --seed 912302 \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, mature woman, $FAT, face visible, short blonde hair, voluminous round blue robe and a red rounded capelet with black polka dots like a ladybug, blue headdress, gold trim, cheerful motherly smile, looking at viewer" \
  --poseTags "standing firmly, one hand raised in greeting" \
  --negAdd "staff, spear, polearm, profile, chibi, thin, slim, skinny, tall, wings, orange robe, mask, heavy armour, pregnant" --out "$R/cindy-c2.png"
echo BATCH2-DONE
