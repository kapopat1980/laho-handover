import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

scalability = json.load(open("../results/scalability.json"))

fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
colors = {"FIXED": "#9aa5b1", "LAHO": "#2f6f4e"}
for a in ["FIXED", "LAHO"]:
    ue = [r["n_ue"] for r in scalability[a]]
    pp = [r["pingpong_pct"] for r in scalability[a]]
    dr = [r["drop_rate"] for r in scalability[a]]
    axes[0].plot(ue, pp, marker="o", label=a, color=colors[a])
    axes[1].plot(ue, dr, marker="o", label=a, color=colors[a])

axes[0].set_xlabel("Number of UEs"); axes[0].set_ylabel("Ping-pong ratio (%)")
axes[0].set_title("Ping-Pong Ratio vs. Network Size\n(driving, high congestion)")
axes[0].legend(fontsize=9)
axes[1].set_xlabel("Number of UEs"); axes[1].set_ylabel("Call-drop rate (%)")
axes[1].set_title("Call-Drop Rate vs. Network Size\n(driving, high congestion)")
axes[1].legend(fontsize=9)
plt.tight_layout()
plt.savefig("../figures/fig_scalability.png", dpi=200)
print("done")
