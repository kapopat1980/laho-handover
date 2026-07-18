# LAHO: Location-Aware Adaptive Handover for 5G Heterogeneous Networks

This repository contains the simulation code, raw results, and figures supporting the paper:

> K. Popat and D. Meva, "LAHO: A GPS-Assisted, Load-Aware Adaptive Fuzzy Handover Algorithm for Congestion-Resilient 5G Heterogeneous Cellular Networks," *submitted to IEEE Access*, 2026. [DOI to be added upon publication]

## What this is

LAHO is a handover decision algorithm for 5G heterogeneous networks that combines:
1. GPS-derived dwell-time estimation (ray–circle intersection between UE trajectory and cell coverage boundary)
2. Load-aware target-cell selection (penalizes congested candidate cells before attempting handover)
3. A 9-rule Mamdani fuzzy inference system that adapts the handover hysteresis margin and time-to-trigger (TTT) window in real time

A handover is classified as "ping-pong" only if the UE returns to the immediately preceding cell within a 10-second window (`PINGPONG_WINDOW` in `sim.py`), consistent with standard usage in the reviewed literature; returns after a longer interval reflect ordinary movement, not oscillation, and are not counted.

It is evaluated against three baselines (fixed-threshold, dwell-time-and-score, speed-only fuzzy-adaptive) across 6 mobility/congestion scenarios.

## Simulator validation

The congestion-dependent blocking rule's realism was cross-checked directionally against the classical Erlang-B loss formula (Section V-E of the paper): both the simulator's blocked-handover percentage and the Erlang-B formula increase monotonically with congestion, though the simulator uses a deliberate threshold rule rather than one numerically calibrated to Erlang-B. Recalibrating the blocking model against Erlang-B directly is noted as future work.

## About the simulator

This is a custom Python discrete-event simulator built specifically for this study. All four compared algorithms (FIXED, DWELL, FUZZYSP, LAHO) run within the identical simulator, sharing the same base-station topology, mobility traces, and blocking model per random seed, so that differences in outcome are attributable solely to the handover decision logic. The full source is provided here to support independent verification, reuse, and porting into other simulation environments (e.g., NS-3) if desired — the LAHO decision logic itself (the `run_scenario` function in `sim.py`) is simulator-independent.

## Repository structure

```
laho-handover/
├── README.md
├── LICENSE
├── CITATION.cff
├── requirements.txt
├── paper/
│   └── LAHO_Location_Aware_Handover_Paper.docx   # submitted manuscript
├── src/
│   ├── sim.py          # main simulator: 4 algorithms × 6 scenarios × 5 seeds
│   ├── sim_extra.py     # handover event classification + β/θ_L sensitivity sweep
│   ├── analyze.py       # aggregation, % improvement calculations, Fig. 4-7 generation
│   ├── figures2.py      # topology, flowchart, membership function, overall/throughput figures
│   ├── figures3.py      # event classification and sensitivity analysis figures
│   ├── rigor_extra.py   # statistical significance, computational overhead, scalability sweep
│   └── figures4.py      # scalability figure
├── results/
│   ├── results.json          # raw per-scenario, per-algorithm metrics (output of sim.py)
│   ├── summary.json          # overall + stress-scenario % improvement (output of analyze.py)
│   ├── event_totals.json     # handover event classification (output of sim_extra.py)
│   ├── sensitivity.json      # β and θ_L sweep results (output of sim_extra.py)
│   ├── statistics.json       # per-seed values + Wilcoxon signed-rank test (output of rigor_extra.py)
│   ├── runtime.json          # measured per-decision computational cost (output of rigor_extra.py)
│   └── scalability.json      # UE-count scalability sweep (output of rigor_extra.py)
└── figures/              # all 9 figures as generated (PNG, 200 dpi)
```

## Reproducing the results

```bash
pip install -r requirements.txt
cd src

# 1. Run the main simulation (4 algorithms × 6 scenarios × 5 seeds)
python sim.py                 # writes ../results/results.json

# 2. Aggregate results and generate Tables III/IV and Figs. 4-7
python analyze.py             # writes ../results/summary.json, ../figures/fig_overall.png, etc.

# 3. Generate topology/flowchart/membership-function figures (Figs. 1-3)
python figures2.py

# 4. Run handover event classification + sensitivity analysis (Table V, Figs. 8-9)
python sim_extra.py           # writes ../results/event_totals.json, ../results/sensitivity.json
python figures3.py
```

All randomness is seeded (`SEEDS = list(range(20))` in `sim.py`/`sim_extra.py`/`rigor_extra.py`), so re-running the scripts above reproduces the exact numbers reported in the paper. Note: `sim.py` (480 runs) takes a few minutes, and `sim_extra.py` (~780 runs, event classification + parameter sensitivity) takes approximately 5-6 minutes on typical hardware.

## Figure/table → script mapping

| Paper item | Generated by |
|---|---|
| Fig. 1 (algorithm flowchart) | `src/figures2.py` |
| Fig. 2 (fuzzy membership functions) | `src/figures2.py` |
| Fig. 3 (topology + example trajectory) | `src/figures2.py` |
| Table III, IV; Fig. 4 (overall), Fig. 5 (stress scenario), Fig. 6 (congestion trend) | `src/sim.py` + `src/analyze.py` |
| Fig. 7 (throughput across scenarios) | `src/analyze.py` |
| Table V; Fig. 8 (event classification) | `src/sim_extra.py` + `src/figures3.py` |
| Fig. 9 (β / θ_L sensitivity) | `src/sim_extra.py` + `src/figures3.py` |
| Table VI (computational overhead); Fig. 10 (scalability sweep) | `src/rigor_extra.py` + `src/figures4.py` |

## Key simulation parameters

| Parameter | Value |
|---|---|
| Area | 1500 m × 1500 m |
| Base stations | 16 (4×4 grid), 260 m coverage radius |
| Path loss model | Log-distance, exponent 3.2, 38 dB reference loss |
| Shadow fading | 6 dB log-normal |
| Mobility models | Walking (~1.4 m/s), Driving (~18 m/s) |
| Congestion levels | Low (0.25), Medium (0.55), High (0.85) mean cell load |
| LAHO parameters | β = 8 dB, θ_L = 0.6 (see Fig. 9 for sensitivity) |
| UEs per scenario | 30 |
| Simulation duration | 300 s, 1 s resolution |
| Seeds | 0, 1, 2, 3, 4 |

## License

Code and data: MIT License (see `LICENSE`). If you use this simulator or dataset, please cite the paper above (see `CITATION.cff`).

## Contact

Kalpesh Popat — Faculty of Computer Applications, Marwadi University, Rajkot, Gujarat, India — kapopat@gmail.com
