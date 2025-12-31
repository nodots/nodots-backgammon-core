#!/usr/bin/env bash
set -euo pipefail

GAMES_TOTAL=${1:-100}
BATCH_SIZE=${2:-20}
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

sumAnalyzed=0
sumR1=0
sumR2=0
sumR3p=0
sumFB=0
sumPR=0
minPR=9999
maxPR=0
countPR=0

run_batch() {
  local games=$1
  local out
  out=$(NODOTS_LOG_SILENT=1 ts-node "$SCRIPT_DIR/simulateGnuVsGnuPR.ts" --games="$games")
  echo "$out" | tail -n 10

  local analyzed r1 r2 r3 fb avg min max sd
  analyzed=$(echo "$out" | rg -o "Analyzed moves: (\d+)" -r "$1" | tail -n1)
  r1=$(echo "$out" | rg -o "Rank1 matches: (\d+)" -r "$1" | tail -n1)
  r2=$(echo "$out" | rg -o "Rank2 matches: (\d+)" -r "$1" | tail -n1)
  r3=$(echo "$out" | rg -o "Rank3\+ matches: (\d+)" -r "$1" | tail -n1)
  fb=$(echo "$out" | rg -o "Final-board matches \(doubles\): (\d+)" -r "$1" | tail -n1)
  avg=$(echo "$out" | rg -o "Average PR: ([0-9.]+)" -r "$1" | tail -n1)
  min=$(echo "$out" | rg -o "min ([0-9.]+)" -r "$1" | tail -n1)
  max=$(echo "$out" | rg -o "max ([0-9.]+)" -r "$1" | tail -n1)
  sd=$(echo "$out" | rg -o "sd ([0-9.]+)" -r "$1" | tail -n1)

  sumAnalyzed=$((sumAnalyzed + ${analyzed:-0}))
  sumR1=$((sumR1 + ${r1:-0}))
  sumR2=$((sumR2 + ${r2:-0}))
  sumR3p=$((sumR3p + ${r3:-0}))
  sumFB=$((sumFB + ${fb:-0}))
  # Accumulate PR via average; we also track min/max across batches
  if [[ -n "$avg" ]]; then
    sumPR=$(python - "$sumPR" "$avg" "$countPR" << 'PY'
import sys
s=float(sys.argv[1]); a=float(sys.argv[2]); c=int(sys.argv[3])
# weighted sum: add avg to pool by incrementing count
print(s + a)
PY
    )
    countPR=$((countPR + 1))
  fi
  if [[ -n "$min" ]]; then
    pymin=$(python - "$minPR" "$min" << 'PY'
import sys
a=float(sys.argv[1]); b=float(sys.argv[2])
print(min(a,b))
PY
    )
    minPR=$pymin
  fi
  if [[ -n "$max" ]]; then
    pymax=$(python - "$maxPR" "$max" << 'PY'
import sys
a=float(sys.argv[1]); b=float(sys.argv[2])
print(max(a,b))
PY
    )
    maxPR=$pymax
  fi
}

remain=$GAMES_TOTAL
while (( remain > 0 )); do
  n=$BATCH_SIZE
  (( n > remain )) && n=$remain
  run_batch "$n"
  remain=$((remain - n))
done

avgPR=$(python - "$sumPR" "$countPR" << 'PY'
import sys
s=float(sys.argv[1]); c=int(sys.argv[2])
print(0 if c==0 else s/c)
PY
)

echo
echo "=== GNU vs GNU PR Replay (batched) ==="
echo "Games: $GAMES_TOTAL (batch $BATCH_SIZE)"
echo "Analyzed moves: $sumAnalyzed"
echo "Rank1 matches: $sumR1"
echo "Rank2 matches: $sumR2"
echo "Rank3+ matches: $sumR3p"
echo "Final-board matches (doubles): $sumFB"
printf "Average PR (batch-avg): %.2f (min %.2f, max %.2f)\n" "$avgPR" "$minPR" "$maxPR"

