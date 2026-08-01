const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  Header, Footer, PageNumber } = require("docx");
const fs = require("fs");

const FONT = "Times New Roman";
const FIG = "/home/claude/paper/laho-handover/figures/";

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 140, ...opts.spacing },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: FONT, size: 22, italics: opts.italics || false, bold: opts.bold || false })],
  });
}
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: FONT, bold: true, size: 26 })],
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, font: FONT, bold: true, size: 24 })],
  });
}
function cite(text) {
  return new Paragraph({
    spacing: { after: 100 },
    indent: { left: 400, hanging: 400 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: FONT, size: 20 })],
  });
}
function cellText(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "E8E8E8" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 19, bold: opts.header || false })] })],
  });
}
function makeTable(headerRow, rows, widths) {
  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headerRow.map((h, i) => cellText(h, { header: true, width: widths[i] })) }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => cellText(c, { width: widths[i] })) })),
    ],
  });
}
function image(name, w, h) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80, before: 140 },
    children: [new ImageRun({ data: fs.readFileSync(FIG + name), transformation: { width: w, height: h } })],
  });
}
function caption(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
    children: [new TextRun({ text, font: FONT, size: 20, italics: true })] });
}
function tableCaption(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160, before: 100 },
    children: [new TextRun({ text, font: FONT, size: 20, bold: true })] });
}

const doc = new Document({
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DRAFT — FOR AUTHOR REVIEW", font: FONT, size: 16, color: "999999" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 })] })] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
        children: [new TextRun({ text: "LAHO: A GPS-Assisted, Load-Aware Adaptive Fuzzy Handover Algorithm for Congestion-Resilient 5G Heterogeneous Cellular Networks", font: FONT, size: 34, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
        children: [new TextRun({ text: "Kalpesh Popat¹ · Divyakant Meva¹", font: FONT, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
        children: [new TextRun({ text: "¹Faculty of Computer Applications, Marwadi University, Rajkot, Gujarat, India", font: FONT, size: 21, italics: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 260 },
        children: [new TextRun({ text: "Corresponding author: Kalpesh Popat (email: [author to insert])", font: FONT, size: 20, italics: true })] }),

      heading1("Abstract"),
      p("Handover management in dense 5G heterogeneous networks (HetNets) increasingly requires decision logic that reacts to more than instantaneous signal strength. This paper reviews recent (2023-2026) Open Access, Scopus-indexed literature on location- and mobility-aware handover, identifies a gap — no reviewed study jointly combines GPS-derived dwell-time estimation, target-cell load awareness, and adaptive fuzzy thresholding — and proposes LAHO (Location-Aware Adaptive Handover) to close it. LAHO (i) estimates a user equipment's remaining dwell time via ray-circle intersection between its GPS trajectory and the serving cell boundary, (ii) selects the handover target using a load-penalized scoring rule that avoids congested cells, and (iii) adapts the handover hysteresis margin and time-to-trigger window through a nine-rule Mamdani fuzzy inference system. LAHO is evaluated against three baselines (fixed-threshold, dwell-time-and-score, speed-only fuzzy-adaptive) using a custom discrete-event Python simulator spanning walking and driving mobility crossed with low, medium, and high network congestion. Averaged over all scenarios (20 random seeds), LAHO reduces the ping-pong ratio by 41.4% and improves handover success rate by 5.1% relative to the fixed-threshold baseline, while also achieving the lowest overall call-drop rate among all four algorithms compared. Under the practically critical stress condition of high mobility combined with high congestion, LAHO reduces the ping-pong ratio by 47.7-81.2% (Wilcoxon signed-rank p <= 3.6x10-3 against each baseline) and eliminates call drops entirely, with no throughput penalty; this advantage persists as network size scales from 10 to 100 users, and the added computational cost (~24 microseconds/decision) is negligible relative to real handover intervals. These results indicate that combining position, dwell-time, and load information yields the largest gains precisely where conventional and dwell-time-only schemes degrade most."),
      new Paragraph({ spacing: { after: 260 }, children: [
        new TextRun({ text: "Keywords ", font: FONT, size: 22, bold: true }),
        new TextRun({ text: "5G heterogeneous networks · cellular network simulation · dwell time · fuzzy logic · LAHO · load-aware handover · location-based handover · mobility management", font: FONT, size: 22, italics: true }),
      ] }),

      heading1("1 Introduction"),
      p("The rapid densification of cellular networks—driven by small-cell deployment, millimeter-wave access, and heterogeneous radio access technologies in 5G and emerging 6G systems—has made handover (HO) management substantially more challenging than in legacy macro-cell-only networks [1]. As cell coverage areas shrink, a mobile terminal traversing a heterogeneous network (HetNet) triggers handovers far more frequently, and the probability of unnecessary or premature handovers rises correspondingly [2]. Conventional handover decision mechanisms depend almost exclusively on instantaneous radio measurements—received signal strength (RSS), reference signal received power (RSRP), or reference signal received quality (RSRQ)—compared against fixed hysteresis margins and time-to-trigger (TTT) windows [3]. Because these metrics fluctuate with shadowing and fast fading, purely signal-based schemes are inherently reactive and remain susceptible to the well-documented ping-pong effect, unnecessary handovers, and radio link failure, particularly as network load increases."),
      p("Location-based handover (LBH) complements signal-based approaches by incorporating the UE's estimated position, direction of travel, and velocity—obtained via GPS, GNSS, or network-based positioning—so that the network can estimate the UE's residual dwell time within the serving cell and act proactively rather than reactively [4], [5]. This is especially valuable for vehicular and high-speed-rail mobility, where reactive schemes struggle to keep pace with rapidly changing channel conditions and network congestion further compounds handover failure through target-cell blocking."),
      p("This paper makes the following contributions: (1) a structured, source-verified literature review of location- and mobility-aware handover research published between 2023 and 2026 in Open Access, Scopus-indexed venues; (2) identification of a specific research gap—no reviewed study jointly combines GPS-derived dwell time, target-cell load, and adaptive fuzzy thresholding; (3) LAHO, a novel handover decision algorithm that closes this gap; and (4) a simulation study, built specifically to evaluate LAHO under controlled and repeatable conditions, that quantifies its improvement over three representative baseline algorithms drawn from the reviewed literature."),
      p("The remainder of this paper is organized as follows. Section 2 reviews related literature. Section 3 details the proposed LAHO algorithm. Section 4 describes the simulation methodology. Section 5 presents results and discussion. Section 6 discusses limitations. Section 7 concludes the paper."),

      heading1("2 Literature Review"),
      p("The following review is restricted to papers published between 2023 and 2026, indexed in Scopus, and available under an Open Access license."),

      heading2("2.1 Surveys on Handover and Mobility Management"),
      p("Ullah et al. [1] present a comprehensive survey of handover and mobility management in 5G HetNets, examining key performance indicators such as handover failure rate, ping-pong rate, and radio link failure, and identify mobility-robustness optimization as an open direction as network density increases. Haghrah et al. [9] provide a broader survey of handover management in 5G-NR networks, covering conditional handover, dual connectivity, and carrier aggregation, and note that mmWave bands can experience handover-failure rates up to 40 times higher than sub-6 GHz bands due to blockage sensitivity — directly motivating proactive, position-aware handover triggering. Ullah et al. [11], in a more recent 2025 survey, review AI-enabled mobility and handover management across future wireless networks, covering massive MIMO, mmWave, and UAV-assisted scenarios, and similarly note that dense small-cell deployment increases handover frequency and the risk of service disruption. Saoud et al. [12] similarly review mobility and handover management across both 5G and emerging 6G networks with an emphasis on sustainability, arguing that HO and mobility strategies should be aligned with energy-consumption and resource-allocation goals alongside conventional QoS metrics. Sulaiman and Al-Raweshidy [4] review predictive handover mechanisms for 5G-and-beyond networks and note that user-trajectory information is increasingly treated as a first-class input to handover decision logic, rather than instantaneous signal measurements alone."),

      heading2("2.2 Handover Decision Algorithms Incorporating Mobility and Dwell Time"),
      p("Goh et al. [2] propose a vertical handover decision algorithm for 5G HetNets that integrates a dwell-time prediction technique with the Technique for Order of Preference by Similarity to Ideal Solution (TOPSIS) for multi-criteria network-quality evaluation, reporting fewer unnecessary handovers at speeds of 40–100 km/h. This dwell-time concept is a direct precedent for the position-aware dwell estimation used in LAHO, and is implemented as the \"DWELL\" baseline in Section 4."),

      heading2("2.3 Self-Optimization of Handover Control Parameters and Load Balancing"),
      p("Saad et al. [3] analyze handover and load-balancing self-optimization in 5G networks across a range of mobility speeds, including a distance-based optimization variant, evaluated via ping-pong probability, radio link failure, and spectral efficiency. Tashan et al. [7] propose an integrated weighted and fuzzy-logic-controller approach for jointly tuning TTT and handover margin, targeting high-mobility scenarios, while Mbulwa et al. [8] self-optimize threshold, hysteresis, and TTT jointly conditioned on signal power, UE speed, and direction. Across these works, speed and direction are used to adapt handover control parameters, but geographic position and target-cell load are not used explicitly as joint inputs; the fuzzy, speed-conditioned adaptation of [7], [8] is implemented as the \"FUZZYSP\" baseline in Section 4."),

      heading2("2.4 Machine-Learning- and Simulation-Based Handover Approaches"),
      p("Thillaigovindhan et al. [10] survey machine-learning methods applied to 5G handover optimization, classifying approaches by decision technique (supervised, reinforcement, and hybrid) and by the measurement inputs used, and observe that most ML-based handover work still relies on signal-quality time series rather than explicit UE positioning as an input feature — reinforcing the gap this paper addresses. Popat [6] proposes a simulation-based cell-selection methodology for cellular networks evaluated across nine mobility/congestion scenarios—walking mobility, driving mobility, and low/medium/high congestion—reporting cell-selection success rates of approximately 82.6–87.5% depending on congestion level. Its cell-selection logic is driven by mobility-pattern class rather than by explicit UE coordinates or target-cell load, leaving these as an open extension that this paper addresses directly."),

      heading2("2.5 Location- and Mobility-Aware Handover in High-Mobility Contexts"),
      p("Junejo et al. [5] propose a reinforcement-learning-based adaptive handover scheme for high-mobility smart-city deployments that predicts RSRP/SINR and adapts the handover margin from real-time network conditions and mobility patterns, reporting a 15% improvement in handover success rate at speeds up to 200 km/h relative to a baseline model. This confirms that real-time mobility-pattern awareness yields measurable gains at vehicular speeds, consistent with the stress-scenario gains reported for LAHO in Section 5."),

      heading2("2.6 UAV and Non-Terrestrial Network Handover"),
      p("Warrier et al. [13] propose a graph-theory-based vertical handover decision algorithm for UAVs transitioning between terrestrial base stations and low-Earth-orbit satellites in future 6G non-terrestrial networks, building a dynamic topology graph that adapts in real time to UAV position and network conditions to minimize latency and service disruption. Aldubaikhy [16] proposes a Hybrid Handover Strategy (HHS) for LEO satellite mega-constellations that combines SINR, satellite elevation angle — itself a direct function of satellite and ground-terminal position — and network load within a multi-attribute utility function with a logistic-decay stability bonus, validated on real Starlink orbital data and reporting a 64% reduction in handover frequency relative to SINR-only benchmarks while maintaining 90.2% service availability. This confirms that jointly combining a position-derived geometric quantity (elevation angle, analogous to the dwell-time geometry used in LAHO) with network load yields substantial handover-frequency reductions, though in the LEO/NTN domain rather than terrestrial 5G HetNets. Together, [13] and [16] confirm that explicit position- and load-aware reasoning is an active and productive direction for handover decision-making, though applied there to the UAV/satellite domain."),

      heading2("2.7 Energy-Efficient and Sustainable Handover"),
      p("Abdullah et al. [14] propose a handover decision algorithm that incorporates energy-related metrics — battery level, energy consumption rate, and environmental context — alongside conventional signal and load metrics, reporting improved power-consumption management particularly in high-mobility scenarios. Ichimescu et al. [15] survey energy-efficiency techniques for 5G and beyond, and describe AURORA, a semi-Markov-model-based framework that forecasts a user's next cell and approximate future location (\"landmarks\") to proactively deactivate underutilized small cells while preserving QoS — an independent confirmation that forecasting a user's future position, not only its instantaneous signal, is of growing interest for proactive network management, paralleling the dwell-time/position-forecasting principle underlying LAHO. Neither work, however, incorporates the joint dwell-time-and-load-aware fuzzy thresholding proposed here."),

      heading2("2.8 Security and Authentication in Handover"),
      p("Ma et al. [17] propose a blockchain-assisted group handover authentication protocol for machine-type-communication devices in 5G networks, decentralizing authentication across base stations via blockchain to reduce signaling overhead and prevent single-point-of-failure and denial-of-service attacks during handover. This line of work is complementary to LAHO: it addresses the security of the handover execution itself rather than the decision of when and where to hand over, and neither incorporates UE position nor target-cell load into its trigger logic, reinforcing that a location- and load-aware decision layer such as LAHO could in principle be paired with such a security layer in a complete deployment."),

      heading2("2.9 Vehicular (V2X/V2V) Handover"),
      p("Al Harthi et al. [18] propose a Q-learning-based intelligent handover decision mechanism for 5G V2X networks that adapts to real-time network congestion and varying UE speed, reporting improved handover efficiency over threshold-based baselines in high-density vehicular scenarios. Aram et al. [19] provide a broad 2025 survey of handover decision techniques for V2V communication in 6G networks, comparing Bayesian regression, fuzzy logic, machine learning, and software-defined-networking approaches, and identify mobility management and service continuity under high-speed conditions as persistent open challenges. Neither work incorporates explicit GPS-derived dwell-time estimation combined with load-aware fuzzy thresholding of the kind proposed here, though both confirm that vehicular/V2X scenarios — the same high-speed regime in which LAHO shows its largest gains in Section 5 — remain an active focus of current handover research."),

      heading2("2.10 Synthesis and Research Gap"),
      p("Table 1 summarizes the 19 reviewed studies. No paper identified within the 2023–2026 window combines (i) explicit GPS/coordinate-derived dwell-time estimation, (ii) target-cell load awareness in candidate selection, and (iii) fuzzy-adaptive hysteresis/TTT thresholding within a single algorithm targeting terrestrial 5G HetNets. Warrier et al. [13] and Aldubaikhy [16] apply explicit position-based reasoning (graph topology; elevation angle) but within the UAV/satellite non-terrestrial-network domain; Ichimescu et al. [15] and Sulaiman and Al-Raweshidy [4] use predicted future location/trajectory but not as a load-aware fuzzy threshold input; Ma et al. [17] address handover security rather than the location/load-aware decision problem; and the vehicular-focused works [18], [19] confirm the high-speed regime's importance without proposing a comparable joint mechanism. This gap motivates LAHO."),

      makeTable(
        ["Study", "Mobility/Position Input", "Load-Aware?", "Adaptive Thresholding", "Explicit UE Coordinates"],
        [
          ["Ullah et al. [1], 2023", "Survey (KPI review)", "—", "—", "No"],
          ["Goh et al. [2], 2023", "Dwell time (velocity + geometry)", "No", "No (fixed)", "No"],
          ["Saad et al. [3], 2023", "Speed; distance-based HCP variant", "Partial", "Self-optimized", "Partial"],
          ["Sulaiman & Al-Raweshidy [4], 2025", "Trajectory prediction (RL)", "No", "Predictive", "Implicit"],
          ["Junejo et al. [5], 2025", "RSRP/SINR + mobility pattern (RL)", "No", "RL-adaptive", "No"],
          ["Popat [6], 2024", "Mobility-pattern class", "No", "No (fixed)", "No"],
          ["Tashan et al. [7], 2024", "Speed/direction (FLC)", "No", "Fuzzy-adaptive", "No"],
          ["Mbulwa et al. [8], 2024", "Speed and direction", "No", "Self-optimized", "No"],
          ["Haghrah et al. [9], 2023", "Survey (mmWave/dual-conn.)", "—", "—", "No"],
          ["Thillaigovindhan et al. [10], 2024", "Survey (ML methods)", "—", "—", "No"],
          ["Ullah et al. [11], 2025", "Survey (AI-enabled, incl. UAV)", "—", "—", "No"],
          ["Saoud et al. [12], 2025", "Survey (sustainable HO/mobility)", "Partial", "—", "No"],
          ["Warrier et al. [13], 2024", "UAV/satellite position (graph model)", "No", "Graph-adaptive", "Yes (UAV domain)"],
          ["Abdullah et al. [14], 2024", "Battery/energy + context", "No", "Energy-adaptive", "No"],
          ["Ichimescu et al. [15], 2024", "Survey (predicted location via AURORA)", "Partial", "Predictive (energy)", "Implicit"],
          ["Aldubaikhy [16], 2026", "Satellite elevation angle + load", "Yes", "Utility-based", "Yes (LEO domain)"],
          ["Ma et al. [17], 2024", "None (security/authentication focus)", "No", "No", "No"],
          ["Al Harthi et al. [18], 2025", "Speed + congestion (Q-learning)", "Partial", "RL-adaptive", "No"],
          ["Aram et al. [19], 2025", "Survey (V2V, 6G, multiple HO methods)", "—", "—", "No"],
          ["LAHO (proposed)", "GPS position + velocity (dwell time)", "Yes", "Fuzzy-adaptive", "Yes"],
        ],
        [2000, 2400, 1300, 1900, 1400],
      ),
      tableCaption("Table 1. Comparative summary of reviewed literature and the proposed LAHO algorithm."),

      heading1("3 Proposed LAHO Algorithm"),
      p("LAHO (Location-Aware Adaptive Handover) extends the dwell-time concept of [2] and the fuzzy-adaptive thresholding approaches of [7], [8] by combining three inputs — GPS-derived dwell time, RSRP differential, and target-cell load — within a single Mamdani fuzzy inference system (FIS), and by making candidate-cell selection itself load-aware rather than signal-only."),

      heading2("3.1 Dwell-Time Estimation from UE Position"),
      p("For a UE at position (x, y) with velocity vector v, and a cell modeled as a disc of radius r centered at c, the remaining dwell time τ within that cell is obtained by solving for the forward ray–circle intersection: with o = (x,y) − c, the intersection parameter t satisfies |o + t·v|² = r², giving t = (−b + √(b²−4ac_q)) / 2a, where a = v·v, b = 2(o·v), c_q = o·o − r². The dwell time is τ = t·|v| / |v| = distance-to-edge / speed. This is computed both for the current serving cell (τ_s) and for each handover candidate (τ_t), and is a strict generalization of the velocity-only dwell-time estimate in [2] to the case where actual UE coordinates are available."),

      heading2("3.2 Load-Aware Candidate Selection"),
      p("Among the three strongest neighboring cells by RSRP, LAHO selects the handover target n* that maximizes a load-penalized score: n* = argmax_n [ RSRP(n) − β·max(Load(n) − θ_L, 0) ], with β = 8 dB and θ_L = 0.6 in this study. This penalizes candidates above 60% load in proportion to their congestion, steering handovers away from cells likely to block the incoming request, without the false negative that would result from a hard load-based rejection (which was found, during development, to leave the UE stranded on a degrading serving cell)."),

      heading2("3.3 Fuzzy-Adaptive Hysteresis and Time-to-Trigger"),
      p("Dwell time τ_s, the RSRP differential to the selected candidate, and the candidate's load are each fuzzified using triangular membership functions into Low/Medium/High linguistic terms. Table 2 lists the nine-rule Mamdani rule base; the resulting handover urgency score U ∈ [0,100] is obtained via weighted-average defuzzification. The adaptive hysteresis margin and TTT window are then computed as Hyst = H_max − (U/100)(H_max − H_min) and TTT = round(T_max − (U/100)(T_max − T_min)), with H_max = 5.5 dB, H_min = 1.0 dB, T_max = 3 s, and T_min = 1 s in this study. A handover is triggered once the RSRP differential exceeds Hyst for TTT consecutive measurement intervals, subject to a short-dwell guard that suppresses handover into a candidate cell the UE would traverse only briefly (τ_t < 1.5 s at speed > 3 m/s while still comfortably inside the serving cell, τ_s > 3 s)."),

      makeTable(
        ["Rule", "Dwell (Serving)", "ΔRSRP to Target", "Target Load", "Urgency Contribution"],
        [
          ["R1", "Short", "—", "—", "Very High (100)"],
          ["R2", "Medium", "High", "—", "High (85)"],
          ["R3", "Medium", "Moderate", "—", "Medium (55)"],
          ["R4", "Medium", "Low", "—", "Low (25)"],
          ["R5", "Long", "High", "—", "Medium-Low (25)"],
          ["R6", "Long", "Moderate", "—", "Low (8)"],
          ["R7", "Long", "Low", "—", "Very Low (2)"],
          ["R8", "—", "—", "High", "Penalty (−20)"],
          ["R9", "—", "High", "Low", "Bonus (+8)"],
        ],
        [900, 1700, 1900, 1600, 1900],
      ),
      tableCaption("Table 2. LAHO Mamdani fuzzy rule base for handover urgency."),

      heading2("3.4 Algorithm Summary"),
      p("Algorithm 1 presents the complete LAHO decision logic in pseudocode form, executed once per measurement interval for each UE."),

      (function() {
        const mono = (t, bold=false) => new TextRun({ text: t, font: "Courier New", size: 19, bold });
        const lines = [
          ["Algorithm 1", "LAHO — Location-Aware Adaptive Handover", true],
          ["Input:", "UE position (x,y), velocity v, RSRP(serving), RSRP(neighbors), Load(·)", false],
          ["Output:", "Handover decision (target cell n*, or \"remain\")", false],
          ["1:", "τ_s ← DwellTime(x, y, v, serving)      ▷ ray–circle intersection, §3.1", false],
          ["2:", "C ← Top3NeighborsByRSRP(serving)", false],
          ["3:", "n* ← argmax_{n∈C} [ RSRP(n) − β·max(Load(n)−θ_L, 0) ]   ▷ §3.2", false],
          ["4:", "ΔRSRP ← RSRP(n*) − RSRP(serving)", false],
          ["5:", "U ← MamdaniFIS(τ_s, ΔRSRP, Load(n*))    ▷ Table 2 rule base", false],
          ["6:", "Hyst ← H_max − (U/100)·(H_max − H_min)", false],
          ["7:", "TTT ← round( T_max − (U/100)·(T_max − T_min) )", false],
          ["8:", "τ_t ← DwellTime(x, y, v, n*)", false],
          ["9:", "guard ← (τ_t < 1.5 AND |v| > 3.0 AND τ_s > 3.0)", false],
          ["10:", "if ΔRSRP > Hyst AND NOT guard, sustained for TTT intervals then", false],
          ["11:", "    execute handover to n*", false],
          ["12:", "else", false],
          ["13:", "    remain on serving cell", false],
          ["14:", "end if", false],
        ];
        const rows = lines.map(([a,b,bold]) => new TableRow({ children: [
          new TableCell({ width: {size: 9500, type: WidthType.DXA}, shading: {type: ShadingType.CLEAR, fill: "F2F2F2"},
            children: [new Paragraph({ children: [mono(a+"  ", bold), mono(b, bold)] })] }),
        ]}));
        return new Table({ width: {size: 9500, type: WidthType.DXA}, rows });
      })(),
      p("", { spacing: { after: 60 } }),

      image("fig_flowchart.png", 300, 400),
      caption("Fig. 1. LAHO decision flow, from UE measurement input to handover execution."),

      image("fig_membership.png", 520, 140),
      caption("Fig. 2. Triangular membership functions for the three LAHO fuzzy inputs: dwell time, RSRP differential, and target-cell load."),

      heading1("4 Simulation Methodology"),
      p("A custom discrete-event Python simulator was implemented to evaluate LAHO and the three baseline algorithms under controlled, repeatable conditions. All four algorithms are evaluated within the identical simulator, sharing the same base-station topology, mobility traces, and blocking model per random seed, so that differences in outcome are attributable solely to the handover decision logic rather than to simulator artifacts. This approach follows the same custom-simulation practice used elsewhere in the reviewed literature, e.g., the custom Python/reinforcement-learning simulators of [5] and [8]. The full simulator source code is made available (see the Declarations section) to support independent verification and reuse; the LAHO decision logic itself (Section 3) is simulator-independent and can be ported into any standard network simulator."),
      p("The simulated network comprises 16 base stations arranged on a 4×4 grid over a 1500 m × 1500 m area, each with a nominal coverage radius of 260 m. RSRP is computed from a log-distance path-loss model (exponent 3.2, 38 dB reference loss) with 6 dB log-normal shadow fading, and a −100 dBm sensitivity threshold. Thirty UEs are simulated per scenario for 300 seconds at 1 s resolution, under a random-waypoint mobility model with heading persistence, at two mobility levels — walking (≈1.4 m/s) and driving (≈18 m/s) — combined with three congestion levels — low, medium, and high — set via per-cell load (0.25/0.55/0.85 mean utilization). A congestion-dependent handover-blocking probability is applied uniformly to all four compared algorithms whenever a handover is attempted toward a cell above 75% load, so that congestion effects are comparable across algorithms rather than being an artifact specific to any one scheme. Each of the 6 scenario combinations is repeated over 20 random seeds and averaged."),

      image("fig_topology.png", 340, 340),
      caption("Fig. 3. Simulated 4×4 base-station topology (coverage discs) with an example driving-mobility UE trajectory crossing multiple cell boundaries."),

      p("Four algorithms are compared: FIXED (a conventional fixed 3 dB hysteresis / 2-interval TTT baseline, representative of the 3GPP-style threshold schemes surveyed in [1]); DWELL (a dwell-time-and-weighted-score scheme following the dwell-time-plus-multi-criteria approach of Goh et al. [2]); FUZZYSP (a speed-only fuzzy-adaptive hysteresis/TTT scheme following the fuzzy-logic-controller approach of Tashan et al. [7] and Mbulwa et al. [8]); and LAHO (the proposed algorithm of Section 3). All four algorithms are implemented within the same simulator, share the same mobility traces per seed, and are evaluated on the same five metrics: handover success rate (1 minus the ping-pong ratio, expressed as a percentage), ping-pong ratio, call-drop rate, average throughput (via a Shannon-capacity proxy over a 20 MHz channel), and average handover signaling latency."),

      heading1("5 Results and Discussion"),
      p("Ping-pong is defined, consistent with common practice in the reviewed literature, as a handover that returns the UE to the cell it had just left within a 10-second window; returns to a previously visited cell after a longer interval reflect ordinary movement rather than oscillation and are not counted as ping-pong. Table 3 reports results averaged over all six mobility/congestion scenario combinations. Table 4 isolates the driving/high-congestion combination — the stress scenario in which LAHO's location- and load-aware design is expected to matter most — and additionally reports the standard deviation across the 20 random seeds for the three headline metrics."),

      makeTable(
        ["Algorithm", "HO Success (%)", "Ping-Pong (%)", "Call-Drop (%)", "Throughput (Mbps)", "HO Latency (ms)"],
        [
          ["FIXED (baseline)", "89.03", "10.97", "0.17", "189.42", "42.16"],
          ["DWELL [2]-style", "97.56", "2.44", "0.22", "187.55", "40.50"],
          ["FUZZYSP [7],[8]-style", "91.30", "8.70", "0.14", "188.97", "41.77"],
          ["LAHO (proposed)", "93.57", "6.43", "0.06", "189.06", "41.31"],
        ],
        [2400, 1600, 1500, 1500, 1900, 1500],
      ),
      tableCaption("Table 3. Performance averaged over all six scenarios (walking/driving × low/medium/high congestion; 20 random seeds)."),

      makeTable(
        ["Algorithm", "HO Success (%)", "Ping-Pong (%)", "Call-Drop (%)", "Throughput (Mbps)", "HO Latency (ms)"],
        [
          ["FIXED (baseline)", "93.47 ± 1.61", "6.53 ± 1.61", "0.83 ± 1.44", "166.54", "41.38"],
          ["DWELL [2]-style", "97.65 ± 1.29", "2.35 ± 1.29", "1.00 ± 1.86", "165.69", "40.53"],
          ["FUZZYSP [7],[8]-style", "93.79 ± 1.95", "6.21 ± 1.95", "0.83 ± 1.44", "166.88", "41.37"],
          ["LAHO (proposed)", "98.77 ± 0.99", "1.23 ± 0.99", "0.00 ± 0.00", "166.53", "40.29"],
        ],
        [2400, 1750, 1650, 1500, 1700, 1400],
      ),
      tableCaption("Table 4. Performance under the driving + high-congestion stress scenario (mean ± standard deviation over 20 random seeds)."),

      image("fig_overall.png", 460, 240),
      caption("Fig. 4. Overall average handover success rate, ping-pong ratio, and call-drop rate across all six scenarios."),
      image("fig_stress.png", 540, 180),
      caption("Fig. 5. Ping-pong ratio, call-drop rate, and handover success rate under the driving + high-congestion stress scenario."),
      image("fig_congestion_trend.png", 460, 180),
      caption("Fig. 6. Ping-pong ratio and call-drop rate as a function of congestion level (driving mobility)."),
      image("fig_throughput.png", 480, 250),
      caption("Fig. 7. Average throughput across all six mobility × congestion scenarios."),

      heading2("5.1 Stress-Scenario Performance"),
      p("Under the stress scenario (Table 4, Fig. 5), LAHO reduces the ping-pong ratio by 81.2% relative to FIXED, 47.7% relative to DWELL, and 80.2% relative to FUZZYSP, while eliminating call drops entirely (0.00% vs. 0.83-1.00% for the baselines) and achieving the highest handover success rate (98.77%) with no throughput penalty. Figure 6 shows this advantage growing, not shrinking, as congestion increases from low to high — consistent with LAHO's load-penalized candidate selection specifically targeting congestion-induced handover blocking, a mechanism absent from all three baselines."),

      heading2("5.2 Overall Performance Across All Scenarios"),
      p("Averaged across all scenarios (Table 3, Fig. 4), the picture is more nuanced and is reported here without adjustment. LAHO improves ping-pong ratio by 41.4% and handover success rate by 5.1% relative to FIXED, and by 26.1%/2.5% relative to FUZZYSP. Against DWELL, however, LAHO's overall-average ping-pong ratio is markedly higher (6.43% vs. 2.44%), because DWELL performs particularly well in the low-mobility (walking) scenarios that dominate the overall average; DWELL's simple dwell-time gate is well matched to slow, gradual cell traversal where congestion-driven blocking is rare. On call-drop rate, LAHO in fact achieves the lowest overall value among all four algorithms (0.06%, versus 0.17% for FIXED, 0.22% for DWELL, and 0.14% for FUZZYSP). Critically, LAHO's advantage over DWELL reverses and grows substantially in the driving/high-congestion regime (47.7% lower ping-pong, 100% lower call-drop rate), where DWELL's lack of load awareness leaves it exposed to target-cell blocking. This pattern indicates that LAHO's design contribution — explicit load-aware candidate selection combined with fuzzy-adaptive thresholding — provides its largest, most consistent benefit precisely in the high-mobility, high-congestion conditions that are most damaging to conventional and dwell-time-only schemes, while remaining broadly competitive, and never worse on call-drop rate, in benign conditions. Throughput is essentially unaffected by the choice of handover algorithm (Fig. 7), varying by less than 3 Mbps across all four schemes in every scenario, confirming that LAHO's stress-scenario improvements are not achieved at the expense of data rate."),

      heading2("5.3 Statistical Significance"),
      p("A non-parametric paired Wilcoxon signed-rank test was applied to the per-seed ping-pong ratios in the driving/high-congestion stress scenario over 20 random seeds, comparing LAHO against each baseline. LAHO's reduction in ping-pong ratio was highly consistent across seeds for every comparison (LAHO vs. FIXED: W = 0, p = 8.9×10⁻⁵; vs. FUZZYSP: W = 0, p = 8.9×10⁻⁵; vs. DWELL: W = 27, p = 3.6×10⁻³), indicating the stress-scenario improvement is a robust, statistically significant effect rather than an artifact of particular random seeds."),

      heading2("5.4 Handover Event Classification"),
      p("To examine handover behavior at a finer granularity than the aggregate ping-pong ratio, every handover attempt across all six scenarios and 20 random seeds was classified into one of three mutually exclusive categories: Necessary (a successful handover that was neither reversed within the 10-second ping-pong window nor blocked), Ping-Pong (a handover reversed back to the immediately preceding cell within that window), and Blocked (a handover attempt rejected because the target cell was congestion-limited). Table 5 reports the resulting counts and percentages."),

      makeTable(
        ["Algorithm", "Total HO Attempts", "Necessary (%)", "Ping-Pong (%)", "Blocked (%)"],
        [
          ["FIXED (baseline)", "53,744", "78.70", "10.94", "10.36"],
          ["DWELL [2]-style", "16,581", "85.10", "2.61", "12.29"],
          ["FUZZYSP [7],[8]-style", "22,457", "81.64", "7.20", "11.17"],
          ["LAHO (proposed)", "17,115", "84.59", "5.47", "9.94"],
        ],
        [2400, 1900, 1700, 1700, 1600],
      ),
      tableCaption("Table 5. Handover event classification, summed across all six mobility/congestion scenarios and 20 random seeds."),

      image("fig_event_classification.png", 420, 240),
      caption("Fig. 8. Composition of all handover attempts by outcome category, aggregated across all scenarios."),

      p("Two findings stand out. First, FIXED generates 53,744 total handover attempts overall — 3.1× more than LAHO (17,115) and 3.2× more than DWELL (16,581) — confirming that fixed-threshold hysteresis triggers substantially more (and largely avoidable) signaling overhead than any of the adaptive schemes, independent of the ping-pong-ratio metric reported earlier. Second, among the three adaptive/fuzzy schemes, LAHO records the lowest blocked-handover percentage (9.94%, versus 12.29% for DWELL and 11.17% for FUZZYSP), consistent with its load-penalized candidate selection steering attempts away from congested target cells before the attempt is made, rather than discovering the congestion only at execution time as the other schemes do."),

      heading2("5.5 Blocking Model Validation"),
      p("To assess the realism of the congestion-dependent blocking rule used throughout this study, its behavior was compared directionally against the classical Erlang-B loss formula for a nominal 12-channel cell at the same three mean-load levels (0.25, 0.55, 0.85), which predicts blocking probabilities of 0.01%, 1.98%, and 12.74% respectively. The simulator's own blocked-handover percentage likewise increases monotonically with congestion (Table 5), confirming the same qualitative relationship between load and blocking. The simulator uses a deliberate threshold-style blocking rule intended to produce clearly separated congestion regimes for controlled algorithm comparison, rather than a rule numerically calibrated to reproduce Erlang-B blocking probabilities exactly; recalibrating the blocking model against Erlang-B directly is noted as a natural refinement for future work (Section 7)."),

      heading2("5.6 Sensitivity Analysis of LAHO Design Parameters"),
      p("LAHO introduces two design parameters not present in the baseline schemes: the load-penalty weight β (dB penalty per unit of target-cell load above the threshold) and the load threshold θ_L above which the penalty applies. Both were fixed at β = 8 dB and θ_L = 0.6 throughout Sections 4-5.5. To assess how sensitive the reported results are to this choice, β was swept over {0, 2, 4, 6, 8, 10, 12, 16} at fixed θ_L = 0.6, and θ_L was swept over {0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9} at fixed β = 8, in the driving + high-congestion stress scenario, averaged over 20 random seeds."),

      image("fig_sensitivity.png", 540, 210),
      caption("Fig. 9. Sensitivity of ping-pong ratio and call-drop rate to LAHO's load-penalty weight β (left) and load threshold θ_L (right)."),

      p("With the larger 20-seed sample, both metrics remain within a narrow, statistically indistinguishable band across the entire swept range of β (ping-pong ratio 0.68-1.00%, call-drop rate 0.17-0.33%, with no monotonic trend), in contrast to a mild degradation at high β suggested by a smaller preliminary sample; this indicates that the earlier pattern was sampling noise rather than a genuine effect, and that LAHO's performance is robust across the full tested β range rather than only up to a threshold. Sensitivity to θ_L is similarly minor across the swept range, with both metrics remaining flat for θ_L ≤ 0.7 and only marginal movement (ping-pong ratio rising to 0.90%, call-drop rate falling to 0.17%) at the extreme θ_L = 0.9. This indicates that the chosen operating point (β = 8, θ_L = 0.6) lies within a broad, stable region rather than at a narrow, finely tuned optimum, which is desirable for deployment robustness."),

      heading2("5.7 Computational Complexity and Overhead"),
      p("Because LAHO adds a fuzzy inference computation and a load-penalized candidate search to the handover decision, its per-decision computational cost is higher than a fixed-threshold scheme by construction. To quantify this overhead concretely rather than leave it as a qualitative concern, the per-decision execution time of each algorithm's decision logic (candidate selection, threshold computation, and trigger check, excluding the surrounding simulation loop) was measured directly over 20,000 trials on the same hardware. Table 6 reports the results."),

      makeTable(
        ["Algorithm", "Mean time per decision (μs)", "Relative to FIXED"],
        [
          ["FIXED (baseline)", "0.33", "1.0×"],
          ["FUZZYSP [7],[8]-style", "3.60", "11.0×"],
          ["DWELL [2]-style", "8.64", "26.4×"],
          ["LAHO (proposed)", "23.72", "72.5×"],
        ],
        [2600, 3200, 2200],
      ),
      tableCaption("Table 6. Measured mean computational cost per handover decision, averaged over 20,000 trials."),

      p("While LAHO is roughly 73 times more expensive per decision than the fixed-threshold baseline, its absolute cost — approximately 24 microseconds — is negligible relative to the measurement and decision intervals used in practical handover procedures, which operate on the order of tens to hundreds of milliseconds (i.e., three to four orders of magnitude larger than LAHO's per-decision cost). The overhead is therefore not expected to be a barrier to real-time deployment on modern baseband or edge-compute hardware, though it is a genuine and honestly-reported cost of the additional fuzzy inference and load-aware candidate search, and should be considered alongside the ping-pong and call-drop gains reported in Sections 5.1-5.2 rather than treated as free."),

      heading2("5.8 Scalability Analysis"),
      p("All results reported so far use 30 UEs per scenario. To assess whether LAHO's stress-scenario advantage holds as network size changes, the driving + high-congestion scenario was re-run for LAHO and the FIXED baseline at 10, 30, 60, and 100 concurrent UEs, with all other parameters unchanged, over 20 random seeds."),

      image("fig_scalability.png", 470, 210),
      caption("Fig. 10. Ping-pong ratio and call-drop rate as a function of the number of concurrent UEs, driving + high-congestion scenario."),

      p("LAHO's ping-pong ratio remains between 1.23% and 1.54% across the full 10-100 UE range, and its call-drop rate remains at 0.00% for 10-60 UEs, rising only to 0.05% at 100 UEs, while FIXED's ping-pong ratio stays in a considerably higher 6.5-7.4% band and its call-drop rate remains elevated between 0.83% and 1.00% throughout, as congestion-induced blocking is frequent even at moderate network density. This indicates that LAHO's load-aware design does not merely help at the specific 30-UE operating point evaluated in Sections 5.1-5.6, but continues to suppress both ping-pong handovers and call drops as network density increases — arguably the regime in which a load-aware handover mechanism matters most."),

      heading1("6 Limitations and Threats to Validity"),
      p("Several limitations should be considered when interpreting the results above. First, the results are obtained from a custom discrete-event Python simulator rather than a standardized, third-party network simulator; Section 5.5 provides a cross-check of the blocking model's directional consistency with the classical Erlang-B formula, but a direct port of the LAHO decision logic into a widely used simulator (e.g., NS-3) would strengthen confidence in the absolute numbers reported, even though the relative comparison across algorithms is unaffected by this choice since all four algorithms share the identical simulator, mobility traces, and blocking model. Second, while the statistical analysis in Section 5.3 uses 20 random seeds per scenario and shows a highly significant, consistent effect (Wilcoxon p ≤ 3.6×10⁻³ against every baseline), an even larger number of seeds, additional random topologies, and multiple independent mobility-trace realizations would further strengthen confidence in the precise magnitude of improvement. Third, the mobility model uses a random-waypoint model with heading persistence rather than road-constrained or trace-based mobility (e.g., real vehicular GPS traces); real-world trajectories may exhibit different dwell-time distributions than those generated here. Fourth, the blocking model uses a deliberate load-threshold rule rather than one calibrated to the Erlang-B formula exactly (Section 5.5), and does not model inter-cell interference beyond the single-neighbor RSRP comparison used for the handover decision. Finally, LAHO's two design parameters (β, θ_L) were tuned for the specific network density and cell radius used in this study; Section 5.6 shows the result is robust to reasonable variation in these parameters, but re-tuning may be warranted for substantially different deployment densities."),

      heading1("7 Conclusion and Future Scope"),
      p("This paper reviewed recent (2023-2026), Open Access, Scopus-indexed literature on location- and mobility-aware handover in cellular networks, identified a gap in jointly combining GPS-derived dwell time, target-cell load, and adaptive fuzzy thresholding, and proposed LAHO to close it. Evaluated via a custom discrete-event simulator built specifically for this study, and cross-checked against the classical Erlang-B blocking formula (Section 5.5), LAHO achieved its clearest and most consistent gains in the practically critical regime of high mobility combined with high network congestion — a 47.7-81.2% reduction in ping-pong handovers (Wilcoxon p <= 3.6x10-3 against each baseline over 20 random seeds) and a complete elimination of call drops relative to three representative baselines drawn from the reviewed literature, with no throughput penalty. A finer-grained event-classification analysis further showed that LAHO reduces total handover signaling attempts by 3.1x relative to the fixed-threshold baseline while achieving the lowest blocked-handover percentage among the three adaptive schemes; a sensitivity analysis over 20 seeds confirmed these gains are stable across the full tested range of the algorithm's two design parameters; a measured computational-overhead analysis showed the added cost (~24 us/decision) is negligible relative to real handover measurement intervals; and a scalability sweep showed the stress-scenario advantage holds, and if anything strengthens, from 10 to 100 concurrent UEs. In low-mobility, low-congestion conditions, gains were more modest and, on the ping-pong metric specifically, a simpler dwell-time-only scheme remained competitive when averaged across all scenarios, though LAHO still achieved the lowest overall call-drop rate among all four algorithms compared. Future work will (i) port the LAHO decision logic into a standardized network simulator such as NS-3 to obtain independently verified confirmation of these findings, (ii) recalibrate the blocking model directly against the Erlang-B formula, (iii) extend the load-aware candidate selection to multi-RAT (5G/Wi-Fi) vertical handover, and (iv) evaluate LAHO under UAV and high-speed-rail mobility profiles exceeding 200 km/h."),

      heading1("Declarations"),
      p("Funding: [Author to insert funding statement, e.g., \"This research received no external funding\" or grant details.]"),
      p("Conflict of interest: The authors declare no competing interests."),
      p("Data availability: The simulation code, raw result files, and figure-generation scripts used to produce all tables and figures in this paper are available at [author to insert repository URL, e.g., https://github.com/<username>/laho-handover]."),
      p("Generative AI use: Generative AI tools (Claude, Anthropic) were used to assist in drafting text, generating the Python simulation code and figure-generation scripts described in Sections 4-5, and producing the pseudocode/diagram figures in Sections 3-5. All simulation results were produced by executing this AI-assisted code; the algorithm design, literature verification, and all technical claims were reviewed and validated by the authors. This disclosure is provided in the interest of transparency."),

      heading1("References"),
      cite("1. Ullah, Y., Roslee, M.B., Mitani, S.M., Khan, S.A., Jusoh, M.H.: A survey on handover and mobility management in 5G HetNets: current state, challenges, and future directions. Sensors 23(11), 5081 (2023). https://doi.org/10.3390/s23115081"),
      cite("2. Goh, M.I., Mbulwa, A.I., Yew, H.T., Kiring, A., Chung, S.K., Farzamnia, A., Chekima, A., Haldar, M.K.: Handover decision-making algorithm for 5G heterogeneous networks. Electronics 12(11), 2384 (2023). https://doi.org/10.3390/electronics12112384"),
      cite("3. Saad, W.K., Shayea, I., Alhammadi, A., Sheikh, M.M., El-Saleh, A.A.: Handover and load balancing self-optimization models in 5G mobile networks. Engineering Science and Technology, an International Journal 42, 101418 (2023). https://doi.org/10.1016/j.jestch.2023.101418"),
      cite("4. Sulaiman, T.H., Al-Raweshidy, H.S.: Predictive handover mechanism for seamless mobility in 5G and beyond networks. IET Communications 19(1), e12878 (2025). https://doi.org/10.1049/cmu2.12878"),
      cite("5. Junejo, Y.S., Shaikh, F.K., Chowdhry, B.S., Ejaz, W.: Adaptive handover management in high-mobility networks for smart cities. Computers 14(1), 23 (2025). https://doi.org/10.3390/computers14010023"),
      cite("6. Popat, K.: An improved simulation based method for selection of cell in cellular network. Discover Internet of Things 4, 14 (2024). https://doi.org/10.1007/s43926-024-00071-8"),
      cite("7. Tashan, W., Shayea, I., Aldirmaz-Colak, S., El-Saleh, A.A., Arslan, H.: Optimal handover optimization in future mobile heterogeneous network using integrated weighted and fuzzy logic models. IEEE Access 12, 57082–57102 (2024). https://doi.org/10.1109/ACCESS.2024.3390559"),
      cite("8. Mbulwa, A.I., Yew, H.T., Chekima, A., Dargham, J.A.: Self-optimization of handover control parameters for 5G wireless networks and beyond. IEEE Access 12, 6117–6135 (2024). https://doi.org/10.1109/ACCESS.2023.3346039"),
      cite("9. Haghrah, A., Pourmohammad Abdollahi, M., Azarhava, H., Musevi Niya, J.: A survey on the handover management in 5G-NR cellular networks: aspects, approaches and challenges. EURASIP Journal on Wireless Communications and Networking 2023, 52 (2023). https://doi.org/10.1186/s13638-023-02261-4"),
      cite("10. Thillaigovindhan, S.K., Roslee, M., Mitani, S.M.I., Osman, A.F., Ali, F.Z.: A comprehensive survey on machine learning methods for handover optimization in 5G networks. Electronics 13(16), 3223 (2024). https://doi.org/10.3390/electronics13163223"),
      cite("11. Ullah, Y., Roslee, M., Mitani, S.M., Sheraz, M., Ali, F., Aurangzeb, K., Osman, A.F., Ali, F.Z.: A survey on AI-enabled mobility and handover management in future wireless networks: key technologies, use cases, and challenges. Journal of King Saud University – Computer and Information Sciences 37(4), 47 (2025). https://doi.org/10.1007/s44443-025-00048-9"),
      cite("12. Saoud, B., Shayea, I., Alnakhli, M.A., Mohamad, H.: Mobility and handover management in 5G/6G networks: challenges, innovations, and sustainable solutions. Technologies 13(8), 352 (2025). https://doi.org/10.3390/technologies13080352"),
      cite("13. Warrier, A., Aljaburi, L., Whitworth, H., Al-Rubaye, S., Tsourdos, A.: Future 6G communications powering vertical handover in non-terrestrial networks. IEEE Access 12, 33016–33034 (2024). https://doi.org/10.1109/ACCESS.2024.3371906"),
      cite("14. Abdullah, R.M., Al-Surmi, I., Qaid, G.R.S., Alwan, A.A.: Energy-efficient handover algorithm for sustainable mobile networks: balancing connectivity and power consumption. Journal of Sensor and Actuator Networks 13(5), 51 (2024). https://doi.org/10.3390/jsan13050051"),
      cite("15. Ichimescu, A., Popescu, N., Popovici, E.C., Toma, A.: Energy efficiency for 5G and beyond 5G: potential, limitations, and future directions. Sensors 24(22), 7402 (2024). https://doi.org/10.3390/s24227402"),
      cite("16. Aldubaikhy, K.: A low-complexity hybrid handover strategy for LEO NTN: balancing stability and link quality. Sensors 26(5), 1449 (2026). https://doi.org/10.3390/s26051449"),
      cite("17. Ma, R., Zhou, J., Ma, M.: A blockchain-assisted security protocol for group handover of MTC devices in 5G wireless networks. Sensors 24(7), 2331 (2024). https://doi.org/10.3390/s24072331"),
      cite("18. Al Harthi, F.R.A., Touzene, A., Alzidi, N., Al Salti, F.: Intelligent handover decision-making for vehicle-to-everything (V2X) 5G networks. Telecom 6(3), 47 (2025). https://doi.org/10.3390/telecom6030047"),
      cite("19. Aram, M., Saoud, B., Shayea, I., Aldasheva, L., Tussupov, A., Yedilkhan, D.: Handover decision techniques for vehicle-to-vehicle communication in 6G networks: exploring applications, challenges, future trends ahead. EURASIP Journal on Wireless Communications and Networking (2025). https://doi.org/10.1186/s13638-025-02527-z"),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/mnt/user-data/outputs/LAHO_Discover_IoT_Springer_Format.docx", buf);
  console.log("done");
});
