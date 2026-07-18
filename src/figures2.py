import json, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Circle

results = json.load(open("../results/results.json"))
algos = ["FIXED", "DWELL", "FUZZYSP", "LAHO"]
labels = ["Fixed", "Dwell+Score", "FuzzySpeed", "LAHO (proposed)"]
colors = ["#9aa5b1", "#7c93c2", "#c58f5e", "#2f6f4e"]

# ---------------------------------------------------------------- Fig A: network topology + example UE path
AREA = 1500.0; GRID = 4; SP = AREA/GRID; R = 260.0
BS = [((.5+i)*SP, (.5+j)*SP) for i in range(GRID) for j in range(GRID)]

rng = np.random.default_rng(7)
pos = np.array([200., 200.]); path = [pos.copy()]; heading = 0.4
for t in range(140):
    if t % 20 == 0: heading += rng.uniform(-0.5, 0.5)
    step = np.array([np.cos(heading), np.sin(heading)]) * 18.0
    pos = np.clip(pos + step, 0, AREA); path.append(pos.copy())
path = np.array(path)

fig, ax = plt.subplots(figsize=(6, 6))
for (bx, by) in BS:
    ax.add_patch(Circle((bx, by), R, facecolor="#cfe0f3", edgecolor="#4472a8", alpha=0.35, linewidth=1))
    ax.plot(bx, by, marker="^", color="#1f4e79", markersize=7)
ax.plot(path[:,0], path[:,1], color="#c0392b", linewidth=2, label="UE trajectory")
ax.plot(path[0,0], path[0,1], marker="o", color="green", markersize=8, label="Start")
ax.plot(path[-1,0], path[-1,1], marker="s", color="black", markersize=7, label="End")
ax.set_xlim(0, AREA); ax.set_ylim(0, AREA); ax.set_aspect("equal")
ax.set_xlabel("x (m)"); ax.set_ylabel("y (m)")
ax.set_title("Simulated 4×4 Base-Station Topology (1500 m × 1500 m)\nwith Example Driving-Mobility UE Trajectory")
ax.legend(loc="upper right", fontsize=8)
plt.tight_layout()
plt.savefig("../figures/fig_topology.png", dpi=200)
plt.close()

# ---------------------------------------------------------------- Fig B: fuzzy membership functions
def tri(x, a, b, c):
    y = np.zeros_like(x)
    left = (x > a) & (x <= b)
    right = (x > b) & (x < c)
    y[left] = (x[left]-a)/(b-a)
    y[right] = (c-x[right])/(c-b)
    y[x==b] = 1.0
    return y

fig, axes = plt.subplots(1, 3, figsize=(13, 3.4))
x1 = np.linspace(0, 14, 400)
for (a,b,c), nm, col in zip([(0-1e-6,0,4), (0,4,12), (4,12,12+1e-6)], ["Short","Medium","Long"], ["#c0392b","#e08e2c","#2f6f4e"]):
    axes[0].plot(x1, tri(x1,a,b,c), label=nm, color=col)
axes[0].set_title("Dwell Time (s)"); axes[0].set_xlabel("τ (s)"); axes[0].set_ylabel("Membership"); axes[0].legend(fontsize=8)

x2 = np.linspace(-8, 12, 400)
for (a,b,c), nm, col in zip([(-6-1e-6,-6,0), (-6,0,10), (0,10,10+1e-6)], ["Low","Moderate","High"], ["#c0392b","#e08e2c","#2f6f4e"]):
    axes[1].plot(x2, tri(x2,a,b,c), label=nm, color=col)
axes[1].set_title("RSRP Differential ΔRSRP (dB)"); axes[1].set_xlabel("ΔRSRP (dB)"); axes[1].legend(fontsize=8)

x3 = np.linspace(0, 1, 400)
for (a,b,c), nm, col in zip([(0-1e-6,0,0.5), (0,0.5,1.0), (0.5,1.0,1.0+1e-6)], ["Low","Medium","High"], ["#c0392b","#e08e2c","#2f6f4e"]):
    axes[2].plot(x3, tri(x3,a,b,c), label=nm, color=col)
axes[2].set_title("Target Cell Load (fraction)"); axes[2].set_xlabel("Load"); axes[2].legend(fontsize=8)

plt.suptitle("LAHO Fuzzy Input Membership Functions", y=1.03)
plt.tight_layout()
plt.savefig("../figures/fig_membership.png", dpi=200, bbox_inches="tight")
plt.close()

# ---------------------------------------------------------------- Fig C: algorithm flowchart
fig, ax = plt.subplots(figsize=(6.6, 8.8))
ax.set_xlim(0, 10); ax.set_ylim(0, 24); ax.axis("off")

def box(cx, cy, w, h, text, fc="#eaf1fb", ec="#2f4f6f", fs=8.5):
    b = FancyBboxPatch((cx-w/2, cy-h/2), w, h, boxstyle="round,pad=0.12,rounding_size=0.15",
                        linewidth=1.2, edgecolor=ec, facecolor=fc)
    ax.add_patch(b)
    ax.text(cx, cy, text, ha="center", va="center", fontsize=fs, wrap=True)

def arrow(x1,y1,x2,y2):
    ax.add_patch(FancyArrowPatch((x1,y1), (x2,y2), arrowstyle="-|>", mutation_scale=14, color="#333333", linewidth=1.1))

steps = [
    (5, 23, "Read UE position (x,y),\nvelocity vector, RSRP\nmeasurements"),
    (5, 20.3, "Estimate dwell time τ_s\nin serving cell\n(ray–circle intersection)"),
    (5, 17.6, "Form candidate set C:\ntop-3 neighbors by RSRP"),
    (5, 14.9, "Select target n* = argmax\n[RSRP(n) − β·max(Load(n)−θ_L,0)]"),
    (5, 12.2, "Compute ΔRSRP, Load(n*);\nrun Mamdani FIS (Table II)\n→ urgency U"),
    (5, 9.5, "Derive adaptive Hyst(U), TTT(U)"),
    (5, 6.8, "Estimate τ_t (dwell in n*);\napply short-dwell guard"),
    (5, 4.1, "ΔRSRP > Hyst sustained\nfor TTT intervals?"),
]
for (x,y,t) in steps:
    box(x,y,4.6,2.0,t)
for i in range(len(steps)-1):
    arrow(5, steps[i][1]-1.0, 5, steps[i+1][1]+1.0)

box(2.1, 1.2, 3.4, 1.5, "No: remain on\nserving cell", fc="#fbeaea")
box(7.9, 1.2, 3.4, 1.5, "Yes: execute\nhandover to n*", fc="#eafbea")
arrow(4.0, 3.2, 2.6, 1.9)
arrow(6.0, 3.2, 7.4, 1.9)

plt.title("Algorithm 1: LAHO Decision Flow", fontsize=11)
plt.tight_layout()
plt.savefig("../figures/fig_flowchart.png", dpi=200)
plt.close()

# ---------------------------------------------------------------- Fig D: overall grouped bar (Table III metrics)
overall = json.load(open("../results/summary.json"))["overall"]
metrics = ["ho_success_rate", "ho_pingpong_ratio", "call_drop_rate"]
mlabels = ["HO Success (%)", "Ping-Pong (%)", "Call-Drop (%)"]
xw = 0.19
fig, ax = plt.subplots(figsize=(8,4.2))
xpos = np.arange(len(metrics))
for i, a in enumerate(algos):
    vals = [overall[a][m] for m in metrics]
    ax.bar(xpos + (i-1.5)*xw, vals, width=xw, label=labels[i], color=colors[i])
ax.set_xticks(xpos); ax.set_xticklabels(mlabels)
ax.set_ylabel("%")
ax.set_title("Overall Average Performance Across All Six Scenarios")
ax.legend(fontsize=8)
for i, a in enumerate(algos):
    vals = [overall[a][m] for m in metrics]
    for j, v in enumerate(vals):
        ax.text(xpos[j] + (i-1.5)*xw, v, f"{v:.1f}", ha='center', va='bottom', fontsize=7)
plt.tight_layout()
plt.savefig("../figures/fig_overall.png", dpi=200)
plt.close()

# ---------------------------------------------------------------- Fig E: throughput across mobility x congestion
fig, ax = plt.subplots(figsize=(8,4.2))
scenarios = [("walking","low"),("walking","medium"),("walking","high"),("driving","low"),("driving","medium"),("driving","high")]
xlabels = ["Walk-Low","Walk-Med","Walk-High","Drive-Low","Drive-Med","Drive-High"]
xw = 0.19
xpos = np.arange(len(scenarios))
for i, a in enumerate(algos):
    vals = [[r for r in results if r["algo"]==a and r["mobility"]==m and r["congestion"]==c][0]["avg_throughput_mbps"] for (m,c) in scenarios]
    ax.bar(xpos + (i-1.5)*xw, vals, width=xw, label=labels[i], color=colors[i])
ax.set_xticks(xpos); ax.set_xticklabels(xlabels, fontsize=8)
ax.set_ylabel("Avg. Throughput (Mbps)")
ax.set_title("Average Throughput Across All Mobility × Congestion Scenarios")
ax.legend(fontsize=8)
plt.tight_layout()
plt.savefig("../figures/fig_throughput.png", dpi=200)
plt.close()

print("all figures written")
