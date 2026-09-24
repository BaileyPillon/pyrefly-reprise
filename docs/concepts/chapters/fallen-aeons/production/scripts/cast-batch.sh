#!/usr/bin/env bash
# Hero casts (FA13): one cast per sister, rendered with the house recipe and IP-Adapter on the CLEANED idle (--ref),
# identity words = the picked render's own, pose words = the cast. 3 seeds each; the keeper gets the same clean pass.
G=/d/Tools/pyrefly-scratch/fa-prod/gen.sh
R=D:/Tools/pyrefly-scratch/fa-prod/renders
W=D:/Tools/pyrefly-scratch/fa-prod/work
COMMON="magus sisters, final fantasy x, aeon, safe"
NEGA="staff, spear, polearm, sword held in hand, cape, cloak, profile, chibi"
bash $G character --name sandy --pose cast --facing left --composition full --seed 931101 --batch 3 --ref "$W/sandy-idle-clean.png" \
  --tags "1girl, solo, sandy \(ff10\), $COMMON, very tall and very slim woman, long legs, pale skin, face visible, dark red hair, red insect armour modelled on a praying mantis, crimson segmented armour plates, narrow red breastplate, red mantis crest on her head with two thin antennae, (one large curved red mantis scythe blade attached to her right forearm:1.25), red armoured gauntlets and boots, purple frilled skirt, black leggings, haughty confident expression, looking at viewer" \
  --poseTags "casting a spell, left hand raised high above her head with fingers spread, scythe arm swept down and back, chin up" \
  --negAdd "$NEGA, wings, blue armour, orange armour, green skin, full helmet, mask, ribbons, many blades, two scythes, floating weapon" --out "$R/sandy-cast.png"
bash $G character --name cindy --pose cast --facing left --composition full --seed 932101 --batch 3 --ref "$W/cindy-idle-clean.png" \
  --tags "1girl, solo, cindy \(ff10\), $COMMON, mature woman, (fat:1.35), (plump:1.3), chubby, round face, round belly, thick arms, very wide round body, short and stout, face visible, short blonde hair in a ponytail with a red ribbon, blue insect armour modelled on a ladybug, (large blue dome shell on her back with big solid red round spots:1.2), blue armoured breastplate and gauntlets, blue apron skirt, black trousers, short sturdy legs, warm motherly smile, looking at viewer" \
  --poseTags "casting a spell, both hands raised in front of her chest with palms forward, feet planted" \
  --negAdd "$NEGA, thin, slim, skinny, tall, wings, orange armour, mask, pregnant, fins, scales, white spots, polka dots" --out "$R/cindy-cast.png"
bash $G character --name mindy --pose cast --facing left --composition full --seed 933101 --batch 3 --ref "$W/mindy-idle-clean.png" \
  --tags "1girl, solo, mindy \(ff10\), $COMMON, petite small young woman, short, face visible, short blonde hair, black hairband with two red antennae, (orange insect armour modelled on a bee:1.3), orange shoulder armour, black and white striped shirt, black leggings, (striped yellow bee abdomen behind her ending in a black stinger:1.2), (two translucent orange insect wings on her back:1.2), orange armoured boots, black gloves, mischievous grin, looking at viewer" \
  --poseTags "casting a spell, one arm thrust forward with the palm open, other hand on her hip, legs dangling with toes pointed down, light on her feet" \
  --negAdd "$NEGA, tall, blue armour, red armour, mask, dress, skirt, barefoot, barrel, pumpkin" --out "$R/mindy-cast.png"
echo CAST-DONE
