import json, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

results = json.load(open("../results/results.json"))
algos = ["FIXED", "DWELL", "FUZZYSP", "LAHO"]
metrics = ["ho_success_rate", "ho_pingpong_ratio", "call_drop_rate", "avg_throughput_mbps", "avg_ho_latency_ms"]

# Overall average per algorithm (across all 6 scenarios)
overall = {a: {m: float(np.mean([r[m] for r in results if r["algo"] == a])) for m in metrics} for a in algos}
print("=== Overall average across all scenarios ===")
for a in algos:
    print(a, {m: round(overall[a][m], 2) for m in metrics})

# High-stress subset: driving + high congestion (LAHO's target regime)
def subset(mob, cong):
    return {a: [r for r in results if r["algo"] == a and r["mobility"] == mob and r["congestion"] == cong][0] for a in algos}

hs = subset("driving", "high")
print("\n=== Driving + High Congestion (stress scenario) ===")
for a in algos:
    print(a, {m: round(hs[a][m], 2) for m in metrics})

# % improvement of LAHO vs each baseline, overall and stress scenario
def pct_improve(base_val, laho_val, lower_is_better):
    if lower_is_better:
        return 100.0 * (base_val - laho_val) / base_val if base_val else 0.0
    else:
        return 100.0 * (laho_val - base_val) / base_val if base_val else 0.0

improve_dir = {
    "ho_success_rate": False, "ho_pingpong_ratio": True, "call_drop_rate": True,
    "avg_throughput_mbps": False, "avg_ho_latency_ms": True,
}

summary = {"overall": {}, "stress": {}}
for a in ["FIXED", "DWELL", "FUZZYSP"]:
    summary["overall"][a] = {m: round(pct_improve(overall[a][m], overall["LAHO"][m], improve_dir[m]), 1) for m in metrics}
    summary["stress"][a] = {m: round(pct_improve(hs[a][m], hs["LAHO"][m], improve_dir[m]), 1) for m in metrics}

print("\n=== LAHO % improvement vs baselines (overall average) ===")
for a in ["FIXED", "DWELL", "FUZZYSP"]:
    print(a, summary["overall"][a])
print("\n=== LAHO % improvement vs baselines (driving + high congestion) ===")
for a in ["FIXED", "DWELL", "FUZZYSP"]:
    print(a, summary["stress"][a])

json.dump({"overall": overall, "stress": hs, "improve": summary}, open("../results/summary.json", "w"), indent=2)

# ---- charts ----
labels = ["Fixed", "Dwell+Score", "FuzzySpeed", "LAHO (proposed)"]
colors = ["#9aa5b1", "#7c93c2", "#c58f5e", "#2f6f4e"]

fig, axes = plt.subplots(1, 3, figsize=(13, 4))
for ax, metric, title, ylab in zip(
    axes,
    ["ho_pingpong_ratio", "call_drop_rate", "ho_success_rate"],
    ["Ping-Pong Ratio\n(Driving, High Congestion)", "Call-Drop Rate\n(Driving, High Congestion)", "Handover Success Rate\n(Driving, High Congestion)"],
    ["%", "%", "%"],
):
    vals = [hs[a][metric] for a in algos]
    ax.bar(labels, vals, color=colors)
    ax.set_title(title, fontsize=10)
    ax.set_ylabel(ylab, fontsize=9)
    ax.tick_params(axis='x', labelsize=8, rotation=20)
    for i, v in enumerate(vals):
        ax.text(i, v, f"{v:.1f}", ha='center', va='bottom', fontsize=8)
plt.tight_layout()
plt.savefig("../figures/fig_stress.png", dpi=200)

fig2, axes2 = plt.subplots(1, 2, figsize=(10, 4))
for ax, metric, title in zip(axes2, ["ho_pingpong_ratio", "call_drop_rate"],
                             ["Ping-Pong Ratio vs. Congestion\n(Driving)", "Call-Drop Rate vs. Congestion\n(Driving)"]):
    for a, c in zip(algos, colors):
        vals = [[r for r in results if r["algo"]==a and r["mobility"]=="driving" and r["congestion"]==cg][0][metric] for cg in ["low","medium","high"]]
        ax.plot(["Low","Medium","High"], vals, marker='o', label=a, color=c)
    ax.set_title(title, fontsize=10)
    ax.set_xlabel("Congestion Level", fontsize=9)
    ax.set_ylabel("%", fontsize=9)
axes2[0].legend(fontsize=7)
plt.tight_layout()
plt.savefig("../figures/fig_congestion_trend.png", dpi=200)
print("\ncharts written")
