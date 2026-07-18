import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

event_totals = json.load(open("../results/event_totals.json"))
sens = json.load(open("../results/sensitivity.json"))

algos = ["FIXED", "DWELL", "FUZZYSP", "LAHO"]
labels = ["Fixed", "Dwell+Score", "FuzzySpeed", "LAHO (proposed)"]
colors_stack = {"ho_necessary": "#2f6f4e", "ho_pingpong": "#c0392b", "ho_blocked": "#7c93c2"}

# ---- Fig: handover event classification (stacked, % of total attempts) ----
fig, ax = plt.subplots(figsize=(7.5, 4.3))
necessary_pct, pingpong_pct, blocked_pct = [], [], []
for a in algos:
    tot = sum(event_totals[a].values())
    necessary_pct.append(100*event_totals[a]["ho_necessary"]/tot)
    pingpong_pct.append(100*event_totals[a]["ho_pingpong"]/tot)
    blocked_pct.append(100*event_totals[a]["ho_blocked"]/tot)

x = np.arange(len(algos))
ax.bar(x, necessary_pct, label="Necessary (successful)", color=colors_stack["ho_necessary"])
ax.bar(x, pingpong_pct, bottom=necessary_pct, label="Ping-Pong", color=colors_stack["ho_pingpong"])
bottom2 = [n+p for n,p in zip(necessary_pct, pingpong_pct)]
ax.bar(x, blocked_pct, bottom=bottom2, label="Blocked (congestion)", color=colors_stack["ho_blocked"])
ax.set_xticks(x); ax.set_xticklabels(labels)
ax.set_ylabel("% of Total Handover Attempts")
ax.set_title("Handover Event Classification\n(summed over all 6 scenarios × 5 seeds)")
ax.legend(fontsize=8, loc="lower right")
for i in range(len(algos)):
    tot_n = sum(event_totals[algos[i]].values())
    ax.text(i, 102, f"n={tot_n}", ha="center", fontsize=8)
ax.set_ylim(0, 110)
plt.tight_layout()
plt.savefig("../figures/fig_event_classification.png", dpi=200)
plt.close()

# ---- Fig: sensitivity to beta and theta_L ----
fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))
betas = [r["beta"] for r in sens["beta"]]
pp_b = [r["pingpong_pct"] for r in sens["beta"]]
dr_b = [r["drop_rate"] for r in sens["beta"]]
ax1 = axes[0]
ax1.plot(betas, pp_b, marker="o", color="#2f6f4e", label="Ping-pong ratio (%)")
ax1.set_xlabel("β (load-penalty weight, dB)")
ax1.set_ylabel("Ping-pong ratio (%)", color="#2f6f4e")
ax1.axvline(8, color="gray", linestyle="--", linewidth=1)
ax1.text(8.2, max(pp_b)*0.95, "chosen β=8", fontsize=8, color="gray")
ax1b = ax1.twinx()
ax1b.plot(betas, dr_b, marker="s", color="#c0392b", label="Call-drop rate (%)")
ax1b.set_ylabel("Call-drop rate (%)", color="#c0392b")
ax1.set_title("Sensitivity to β (driving, high congestion)")

thetas = [r["theta_L"] for r in sens["theta_L"]]
pp_t = [r["pingpong_pct"] for r in sens["theta_L"]]
dr_t = [r["drop_rate"] for r in sens["theta_L"]]
ax2 = axes[1]
ax2.plot(thetas, pp_t, marker="o", color="#2f6f4e", label="Ping-pong ratio (%)")
ax2.set_xlabel("θ_L (load threshold, fraction)")
ax2.set_ylabel("Ping-pong ratio (%)", color="#2f6f4e")
ax2.axvline(0.6, color="gray", linestyle="--", linewidth=1)
ax2.text(0.61, max(pp_t)*0.95, "chosen θ_L=0.6", fontsize=8, color="gray")
ax2b = ax2.twinx()
ax2b.plot(thetas, dr_t, marker="s", color="#c0392b", label="Call-drop rate (%)")
ax2b.set_ylabel("Call-drop rate (%)", color="#c0392b")
ax2.set_title("Sensitivity to θ_L (driving, high congestion)")

plt.tight_layout()
plt.savefig("../figures/fig_sensitivity.png", dpi=200)
plt.close()
print("sensitivity + event classification figures written")
