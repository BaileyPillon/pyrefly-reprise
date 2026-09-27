#!/bin/bash
# Second pass after looking at the main batch: Cloud came back nearly frontal (turned sketch cloud2t.png,
# face looking left), and two Barret renders grew a second gun over the head (weapon-on-back banned).
. "$(dirname "$0")/common.sh"
cl 0.80 turn-a 3 cloud2t.png "looking to the side"
cl 0.83 turn-b 2 cloud2t.png "looking to the side"
BN="$BN, weapon on back, gun on back, backpack, gun over shoulder"
br 0.82 idle-c 3
echo DONE
