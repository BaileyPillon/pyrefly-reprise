#!/bin/bash
# Round 2 pilots: look at every one before the main batch.
. "$(dirname "$0")/common.sh"
br 0.80 pilot-080 1
br 0.83 pilot-083 1
br 0.86 pilot-086 1
gs gs2-low.png 0.82 pilot-idle "" 1
gs gs2-raised.png 0.82 pilot-raised ", (scorpion tail raised high over its body:1.2), tail tip aimed forward" 1
cl 0.82 pilot-082 1
echo DONE
