"""
Extends sim.py: (1) classifies every handover event as Necessary / Ping-Pong / Blocked
per algorithm, aggregated over all scenarios; (2) sweeps LAHO's load-penalty weight (beta)
and load threshold (theta_L) to show sensitivity of ping-pong ratio and call-drop rate
in the driving + high-congestion stress scenario. All numbers below come from actually
executing this code.
"""
import numpy as np, json, itertools, math, random
import sys

AREA = 1500.0
GRID = 4
BS_SPACING = AREA / GRID
BS = np.array([[(.5+i)*BS_SPACING, (.5+j)*BS_SPACING] for i in range(GRID) for j in range(GRID)])
N_BS = len(BS)
CELL_RADIUS = 260.0
TX_POWER = 43.0
PL0, D0, N_EXP = 38.0, 1.0, 3.2
SHADOW_STD = 6.0
NOISE_FLOOR = -100.0
PINGPONG_WINDOW = 10.0  # seconds: a return to the previous cell only counts as ping-pong within this window
BW_MHZ = 20.0

def rsrp(d):
    d = max(d, D0)
    pl = PL0 + 10*N_EXP*math.log10(d/D0)
    return TX_POWER - pl

def tri(x, a, b, c):
    if x <= a or x >= c: return 0.0
    if x == b: return 1.0
    return (x-a)/(b-a) if x < b else (c-x)/(c-b)

def fuzz3(x, lo, mid, hi):
    L = tri(x, lo-1e-6, lo, mid); M = tri(x, lo, mid, hi); H = tri(x, mid, hi, hi+1e-6)
    return L, M, H

def mamdani_urgency(dwell, rsrp_diff, load):
    dL, dM, dH = fuzz3(dwell, 0, 4, 12)
    rL, rM, rH = fuzz3(rsrp_diff, -6, 0, 10)
    lL, lM, lH = fuzz3(load, 0, 0.5, 1.0)
    rules = [(dL, 100), (dM*rH, 85), (dM*rM, 55), (dM*rL, 25),
             (dH*rH, 25), (dH*rM, 8), (dH*rL, 2), (lH, -20), (lL*rH, 8)]
    num = sum(max(w,0)*val for w, val in rules if w > 0)
    den = sum(max(w,0) for w, val in rules if w > 0) or 1e-6
    return float(np.clip(num/den, 0, 100))

def fuzzy_speed_adapt(speed):
    sL, sM, sH = fuzz3(speed, 0, 12, 30)
    return (sL*10 + sM*55 + sH*90) / max(sL+sM+sH, 1e-6)

def make_ue_path(speed_mean, T, dt, rng):
    pos = rng.uniform(50, AREA-50, size=2)
    path = [pos.copy()]; heading = rng.uniform(0, 2*np.pi)
    for t in range(1, T):
        if t % 20 == 0: heading += rng.uniform(-0.6, 0.6)
        speed = max(0.3, rng.normal(speed_mean, speed_mean*0.15))
        step = np.array([math.cos(heading), math.sin(heading)]) * speed * dt
        pos = np.clip(pos + step, 0, AREA); path.append(pos.copy())
    return np.array(path)

def dwell_time_estimate(pos, heading_vec, speed, serving_bs):
    c = BS[serving_bs]; r = CELL_RADIUS
    oc = pos - c; v = heading_vec
    a = np.dot(v, v)
    if a < 1e-9 or speed < 1e-6: return 15.0
    b = 2*np.dot(oc, v); cterm = np.dot(oc, oc) - r*r
    disc = b*b - 4*a*cterm
    if disc < 0: return 15.0
    t_hit = (-b + math.sqrt(disc)) / (2*a)
    dist_to_edge = max(t_hit, 0) * speed
    return dist_to_edge / max(speed, 1e-6) if speed > 0 else 15.0

def run_scenario(algo, mobility, congestion, T=300, dt=1.0, n_ue=30, seed=0, beta=8.0, theta_L=0.6):
    rng = np.random.default_rng(seed)
    speed_mean = 1.4 if mobility == "walking" else 18.0
    load_base = {"low": 0.25, "medium": 0.55, "high": 0.85}[congestion]
    bs_load = np.clip(load_base + rng.normal(0, 0.05, N_BS), 0, 1.0)

    ho_necessary = ho_pingpong = ho_blocked = drops = 0
    thr_samples, ho_delay_samples = [], []
    for u in range(n_ue):
        path = make_ue_path(speed_mean, T, dt, rng)
        d0 = np.linalg.norm(BS - path[0], axis=1)
        serving = int(np.argmin(d0))
        ttt_timer = 0
        last_serving_history = [serving]
        last_ho_time = [-1e9]
        consec_drop = 0
        connected = True
        for t in range(1, T):
            pos = path[t]
            heading_vec = (path[t] - path[t-1]) / dt
            speed = np.linalg.norm(heading_vec)
            d = np.linalg.norm(BS - pos, axis=1)
            rsrp_all = np.array([rsrp(di) + rng.normal(0, SHADOW_STD) for di in d])
            serving_rsrp = rsrp_all[serving]
            neigh_order = np.argsort(-rsrp_all)
            top_candidates = [int(i) for i in neigh_order if i != serving][:3]

            if algo == "LAHO":
                def combo(i): return rsrp_all[i] - beta*max(bs_load[i]-theta_L, 0)
                best_neighbor = max(top_candidates, key=combo)
            else:
                best_neighbor = top_candidates[0]
            diff = rsrp_all[best_neighbor] - serving_rsrp

            if algo == "FIXED":
                hyst, ttt_req = 3.0, 2
                trigger = diff > hyst
            elif algo == "DWELL":
                dwell = dwell_time_estimate(pos, heading_vec, speed, best_neighbor)
                reject_short = dwell < 2.0 and speed > 3.0
                score_cur = 0.6*serving_rsrp + 0.4*(dwell_time_estimate(pos, heading_vec, speed, serving)*5)
                score_new = 0.6*rsrp_all[best_neighbor] + 0.4*(dwell*5)
                hyst, ttt_req = 3.0, 2
                trigger = (diff > hyst) and (score_new > score_cur) and not reject_short
            elif algo == "FUZZYSP":
                urgency = fuzzy_speed_adapt(speed)
                hyst = 5.0 - (urgency/100)*3.5
                ttt_req = max(1, round(3 - (urgency/100)*2))
                trigger = diff > hyst
            else:
                dwell_serving = dwell_time_estimate(pos, heading_vec, speed, serving)
                dwell_target = dwell_time_estimate(pos, heading_vec, speed, best_neighbor)
                target_load = bs_load[best_neighbor]
                urgency = mamdani_urgency(dwell_serving, diff, target_load)
                hyst = 5.5 - (urgency/100)*4.5
                ttt_req = max(1, round(3 - (urgency/100)*2))
                short_dwell_guard = dwell_target < 1.5 and speed > 3.0 and dwell_serving > 3.0
                trigger = (diff > hyst) and not short_dwell_guard

            ttt_timer = ttt_timer + 1 if trigger else 0

            if ttt_timer >= ttt_req and best_neighbor != serving:
                target_load_exec = bs_load[best_neighbor]
                block_prob = max(0.0, (target_load_exec - 0.75) / 0.25) * 0.7
                blocked = rng.random() < block_prob
                delay = 40 + rng.normal(0, 5)
                is_pingpong = (len(last_serving_history) >= 2 and best_neighbor == last_serving_history[-2]
                               and (t - last_ho_time[-1]) <= PINGPONG_WINDOW)
                if blocked:
                    ho_blocked += 1
                    consec_drop += 1
                elif is_pingpong:
                    ho_pingpong += 1
                    delay += 20
                    ho_delay_samples.append(delay)
                    last_serving_history.append(serving); last_ho_time.append(t); serving = best_neighbor; serving_rsrp = rsrp_all[serving]
                else:
                    ho_necessary += 1
                    ho_delay_samples.append(delay)
                    last_serving_history.append(serving); last_ho_time.append(t); serving = best_neighbor; serving_rsrp = rsrp_all[serving]
                ttt_timer = 0

            if serving_rsrp < NOISE_FLOOR + 3: consec_drop += 1
            else: consec_drop = 0
            if consec_drop >= 3 and connected:
                drops += 1; connected = False
            if connected:
                sinr = serving_rsrp - (-95); sinr_lin = 10**(max(sinr,-5)/10)
                thr_samples.append(BW_MHZ * math.log2(1+sinr_lin))

    n = max(n_ue, 1)
    total_ho = ho_necessary + ho_pingpong + ho_blocked
    return {
        "algo": algo, "mobility": mobility, "congestion": congestion,
        "ho_necessary": ho_necessary, "ho_pingpong": ho_pingpong, "ho_blocked": ho_blocked,
        "total_ho": total_ho,
        "call_drop_rate": 100.0*drops/n,
        "avg_throughput_mbps": float(np.mean(thr_samples)) if thr_samples else 0.0,
    }

algos = ["FIXED", "DWELL", "FUZZYSP", "LAHO"]
mobilities = ["walking", "driving"]
congestions = ["low", "medium", "high"]
SEEDS = list(range(20))  # 20 seeds for stronger statistical power

# ---- 1) handover event classification, aggregated over all 6 scenarios ----
event_totals = {a: {"ho_necessary":0, "ho_pingpong":0, "ho_blocked":0} for a in algos}
for algo, mob, cong in itertools.product(algos, mobilities, congestions):
    for s in SEEDS:
        r = run_scenario(algo, mob, cong, seed=s)
        for k in ["ho_necessary","ho_pingpong","ho_blocked"]:
            event_totals[algo][k] += r[k]

print("=== Handover event classification (summed over all scenarios & seeds) ===")
for a in algos:
    tot = sum(event_totals[a].values())
    pct = {k: round(100*v/tot,2) for k,v in event_totals[a].items()}
    print(a, event_totals[a], "-> %", pct)

json.dump(event_totals, open("../results/event_totals.json","w"), indent=2)

# ---- 2) sensitivity analysis: beta and theta_L (LAHO, driving+high congestion) ----
betas = [0, 2, 4, 6, 8, 10, 12, 16]
sens_beta = []
for b in betas:
    runs = [run_scenario("LAHO", "driving", "high", seed=s, beta=b, theta_L=0.6) for s in SEEDS]
    pp = np.mean([r["ho_pingpong"]/max(r["total_ho"],1)*100 for r in runs])
    dr = np.mean([r["call_drop_rate"] for r in runs])
    sens_beta.append({"beta": b, "pingpong_pct": float(pp), "drop_rate": float(dr)})

thetas = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
sens_theta = []
for th in thetas:
    runs = [run_scenario("LAHO", "driving", "high", seed=s, beta=8.0, theta_L=th) for s in SEEDS]
    pp = np.mean([r["ho_pingpong"]/max(r["total_ho"],1)*100 for r in runs])
    dr = np.mean([r["call_drop_rate"] for r in runs])
    sens_theta.append({"theta_L": th, "pingpong_pct": float(pp), "drop_rate": float(dr)})

print("\n=== Sensitivity to beta (load-penalty weight), theta_L=0.6 ===")
for row in sens_beta: print(row)
print("\n=== Sensitivity to theta_L (load threshold), beta=8 ===")
for row in sens_theta: print(row)

json.dump({"beta": sens_beta, "theta_L": sens_theta}, open("../results/sensitivity.json","w"), indent=2)
print("\ndone")
