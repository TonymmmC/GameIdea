#!/bin/bash
# lanza el bot en paralelo (6 procesos)
cd "$(dirname "$0")"
mkdir -p logs
ids="$@"
printf '%s\n' $ids | xargs -P 6 -I{} sh -c 'node solver.js {} > logs/{}.log 2>&1'
