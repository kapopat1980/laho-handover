"""
Additional rigor experiments: (1) per-seed standard deviation + paired significance
test (Wilcoxon signed-rank) for the stress scenario, (2) measured per-decision
computational overhead of each algorithm, (3) a scalability sweep over UE count.
All numbers below come from actually executing this code.
"""
import numpy as np, json, time, math
import sys
from sim import run_scenario, mamdani_urgency, fuzzy_speed_adapt, dwell_time_estimate, BS

algos = ["FIXED", "DWELL", "FUZZYSP", "LAHO"]
SEEDS = list(range(20))  # 20 seeds for stronger statistical power

# ---- 1) Per-seed values + Wilcoxon signed-rank test (driving, high congestion) ----
per_seed = {a: {"pp": [], "drop": [], "succ": []} for a in algos}
for a in algos:
    for s in SEEDS:
        r = run_scenario(a, "driving", "high", seed=s)
        per_seed[a]["pp"].append(r["ho_pingpong_ratio"])
        per_seed[a]["drop"].append(r["call_drop_rate"])
        per_seed[a]["succ"].append(r["ho_success_rate"])

def wilcoxon_signed_rank(x, y):
    """Minimal paired Wilcoxon signed-rank test (two-sided), no external deps."""
    d = np.array(x) - np.array(y)
    d = d[d != 0]
    n = len(d)
    if n < 1:
        return None, None
    ranks = np.argsort(np.argsort(np.abs(d))) + 1
    # handle ties by average rank
    abs_d = np.abs(d)
    order = np.argsort(abs_d)
    ranks = np.empty(n)
    i = 0
    sorted_abs = abs_d[order]
    while i < n:
        j = i
        while j < n - 1 and sorted_abs[j+1] == sorted_abs[i]:
            j += 1
        avg_rank = (i + j) / 2 + 1
        ranks[order[i:j+1]] = avg_rank
        i = j + 1
    W_pos = ranks[d > 0].sum()
    W_neg = ranks[d < 0].sum()
    W = min(W_pos, W_neg)
    mean_W = n * (n + 1) / 4
    std_W = math.sqrt(n * (n + 1) * (2*n + 1) / 24) if n > 0 else 0
    if std_W == 0:
        return W, None
    z = (W - mean_W) / std_W
    from math import erf, sqrt
    p = 2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))
    return W, p

print("=== Stress scenario (driving, high congestion): mean ± std over 5 seeds ===")
stress_stats = {}
for a in algos:
    pp_mean, pp_std = np.mean(per_seed[a]["pp"]), np.std(per_seed[a]["pp"])
    dr_mean, dr_std = np.mean(per_seed[a]["drop"]), np.std(per_seed[a]["drop"])
    su_mean, su_std = np.mean(per_seed[a]["succ"]), np.std(per_seed[a]["succ"])
    stress_stats[a] = {"pp_mean": pp_mean, "pp_std": pp_std, "drop_mean": dr_mean,
                        "drop_std": dr_std, "succ_mean": su_mean, "succ_std": su_std}
    print(f"{a}: PP={pp_mean:.2f}±{pp_std:.2f}  Drop={dr_mean:.2f}±{dr_std:.2f}  Succ={su_mean:.2f}±{su_std:.2f}")

print("\n=== Wilcoxon signed-rank test: LAHO vs. each baseline (ping-pong ratio, n=5 seeds) ===")
sig_tests = {}
for a in ["FIXED", "DWELL", "FUZZYSP"]:
    W, p = wilcoxon_signed_rank(per_seed[a]["pp"], per_seed["LAHO"]["pp"])
    sig_tests[a] = {"W": W, "p_value": p}
    print(f"LAHO vs {a}: W={W}, p={p}")

json.dump({"per_seed": per_seed, "stress_stats": stress_stats, "sig_tests": sig_tests},
          open("../results/statistics.json", "w"), indent=2, default=float)

# ---- 2) Computational complexity: measured per-decision runtime ----
print("\n=== Measured per-decision computational overhead ===")
N_TRIALS = 20000
rng = np.random.default_rng(0)
pos = np.array([700., 700.])
heading_vec = np.array([12.0, 5.0])
speed = np.linalg.norm(heading_vec)
rsrp_all = rng.normal(-75, 8, len(BS))
bs_load = rng.uniform(0.2, 0.9, len(BS))
serving = 5
neigh_order = np.argsort(-rsrp_all)
top_candidates = [int(i) for i in neigh_order if i != serving][:3]

runtime_results = {}

t0 = time.perf_counter()
for _ in range(N_TRIALS):
    best_neighbor = top_candidates[0]
    diff = rsrp_all[best_neighbor] - rsrp_all[serving]
    hyst, ttt_req = 3.0, 2
    trigger = diff > hyst
t1 = time.perf_counter()
runtime_results["FIXED"] = (t1 - t0) / N_TRIALS * 1e6  # microseconds

t0 = time.perf_counter()
for _ in range(N_TRIALS):
    best_neighbor = top_candidates[0]
    diff = rsrp_all[best_neighbor] - rsrp_all[serving]
    dwell = dwell_time_estimate(pos, heading_vec, speed, best_neighbor)
    dwell_s = dwell_time_estimate(pos, heading_vec, speed, serving)
    score_cur = 0.6*rsrp_all[serving] + 0.4*(dwell_s*5)
    score_new = 0.6*rsrp_all[best_neighbor] + 0.4*(dwell*5)
    trigger = (diff > 3.0) and (score_new > score_cur) and not (dwell < 2.0 and speed > 3.0)
t1 = time.perf_counter()
runtime_results["DWELL"] = (t1 - t0) / N_TRIALS * 1e6

t0 = time.perf_counter()
for _ in range(N_TRIALS):
    best_neighbor = top_candidates[0]
    diff = rsrp_all[best_neighbor] - rsrp_all[serving]
    urgency = fuzzy_speed_adapt(speed)
    hyst = 5.0 - (urgency/100)*3.5
    ttt_req = max(1, round(3 - (urgency/100)*2))
    trigger = diff > hyst
t1 = time.perf_counter()
runtime_results["FUZZYSP"] = (t1 - t0) / N_TRIALS * 1e6

t0 = time.perf_counter()
for _ in range(N_TRIALS):
    def combo(i): return rsrp_all[i] - 8.0*max(bs_load[i]-0.6, 0)
    best_neighbor = max(top_candidates, key=combo)
    diff = rsrp_all[best_neighbor] - rsrp_all[serving]
    dwell_s = dwell_time_estimate(pos, heading_vec, speed, serving)
    dwell_t = dwell_time_estimate(pos, heading_vec, speed, best_neighbor)
    urgency = mamdani_urgency(dwell_s, diff, bs_load[best_neighbor])
    hyst = 5.5 - (urgency/100)*4.5
    ttt_req = max(1, round(3 - (urgency/100)*2))
    guard = dwell_t < 1.5 and speed > 3.0 and dwell_s > 3.0
    trigger = (diff > hyst) and not guard
t1 = time.perf_counter()
runtime_results["LAHO"] = (t1 - t0) / N_TRIALS * 1e6

for a, v in runtime_results.items():
    print(f"{a}: {v:.2f} microseconds/decision")

json.dump(runtime_results, open("../results/runtime.json", "w"), indent=2)

# ---- 3) Scalability sweep: vary UE count (driving, high congestion) ----
print("\n=== Scalability sweep: UE count vs. ping-pong ratio / call-drop rate ===")
ue_counts = [10, 30, 60, 100]
scalability = {a: [] for a in ["FIXED", "LAHO"]}
for a in ["FIXED", "LAHO"]:
    for n_ue in ue_counts:
        runs = [run_scenario(a, "driving", "high", seed=s, n_ue=n_ue) for s in SEEDS]
        pp = np.mean([r["ho_pingpong_ratio"] for r in runs])
        dr = np.mean([r["call_drop_rate"] for r in runs])
        scalability[a].append({"n_ue": n_ue, "pingpong_pct": float(pp), "drop_rate": float(dr)})
        print(f"{a} n_ue={n_ue}: PP={pp:.2f}  Drop={dr:.2f}")

json.dump(scalability, open("../results/scalability.json", "w"), indent=2)
print("\ndone")
