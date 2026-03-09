import type { TimingAnalysis } from "@shared/schema";

export const SAMPLE_TIMING_DATA: TimingAnalysis = {
  ticker: "AAPL",
  companyName: "Apple Inc",
  lastUpdated: "2026-03-09T19:44:36.538Z",
  timeframe: "weekly",
  debug: {
    timeframe: "weekly",
    lastBarDate: "2026-03-06",
    seriesType: "unadjusted",
    rsiLatest: 48.94,
    rsiPrevious: 51.4,
    rsiDistanceFrom50: 1.06,
    macdLine: 5.09,
    macdSignal: 7.646,
    macdHist: -2.556,
    macdHistPrev: -2.006,
    shortEmaSlope: -0.0044,
    longEmaSlope: 0.006,
    highsProgression: "Mixed",
    lowsProgression: "Strengthening",
    distanceFromBalance: 1.06,
    rsiZone: "Neutral",
    rsiDirection: "Falling",
  },
  verdict: {
    message: "Conditions are improving, but not fully aligned",
    subtitle: "These readings describe current market conditions — not the future.",
    alignmentScore: 0.2333333333333333,
  },
  trend: {
    signal: {
      status: "yellow",
      label: "Stabilizing",
      interpretation: "Higher lows forming, but highs not yet improving — early signs of support.",
      score: 0.3,
      position: { x: 30, y: 70 },
      signals: [
        { label: "Highs", value: "Mixed" },
        { label: "Lows", value: "Strengthening" },
      ],
    },
    chartData: {
      prices: [
        229.515, 231.12666666666667, 234.07333333333335, 242.31000000000003,
        249.07000000000002, 255.17999999999998, 252.96, 255.67333333333332,
        259.84666666666664, 267.27, 271.43, 270.91, 273.22, 276.86666666666673,
        280.1133333333334, 279.32666666666665, 274.71666666666664,
        273.34999999999997, 272.43333333333334, 268.42333333333335, 264.05,
        255.98, 254.6833333333333, 260.1933333333333, 269.4766666666667,
        272.11333333333334, 271.36, 267.03333333333336, 264.7366666666667,
        259.99,
      ],
      baseline: [
        217.48293482392242, 219.70785576502743, 222.37006380774972,
        225.23914311543157, 230.54657163989856, 234.9253767962806,
        238.84439919695683, 240.46723570660103, 244.52228375994628,
        248.9727776217742, 252.80318169054252, 256.8844213831711,
        258.8036174953218, 262.106596132536, 266.4853968357113,
        268.42987013830924, 269.5535301131621, 270.06379736531443,
        270.61219784434815, 270.83907096355756, 268.92833078836526,
        267.29772519048066, 263.72541151948417, 262.4007912432143,
        264.96246556262986, 266.87838091487896, 266.4186752939919,
        267.8389161496297, 266.87184048606065, 265.1605967613223,
      ],
    },
    deepDive: {
      title: "Market Structure",
      explanation:
        "The structure is in transition. Some timeframes show strength while others lag. This mixed picture often resolves in one direction or another — waiting for clarity can help.",
    },
  },
  momentum: {
    signal: {
      status: "yellow",
      label: "Mixed",
      interpretation: "Momentum signals are mixed — no clear direction yet.",
      score: 0,
      position: { x: 50, y: 50 },
      signals: [
        { label: "Short-term pressure", value: "Flat" },
        { label: "Long-term baseline", value: "Improving" },
        { label: "Pressure gap", value: "Widening" },
      ],
    },
    chartData: {
      shortEma: [
        0.589838817858865, 0.6652550754079332, 0.7497286177672347,
        0.8347403674417719, 0.9918091568198524, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 0.9476710017427503, 0.9845092430179176, 1,
        0.9542045236063341, 0.9608061683523805, 0.902133465345899,
        0.8262436310273156,
      ],
      longEma: [
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.5,
      ],
    },
    deepDive: {
      title: "Pressure Flow",
      explanation:
        "Pressure is shifting or stabilizing. The balance between participants is changing, which often precedes a new directional move. Clarity may come soon.",
    },
  },
  stretch: {
    signal: {
      status: "green",
      label: "Bounce setup",
      interpretation:
        "Losses have dominated lately, but that pressure is easing — rebounds become more likely.",
      score: 0.4,
      position: { x: 48.94127598036428, y: 75 },
      signals: [
        { label: "RSI", value: "Balanced" },
        { label: "Pressure", value: "Cooling" },
      ],
    },
    chartData: {
      values: [
        0.14290097348378722, 0.14641139664881223, 0.18691078712111064,
        0.21963613840735974, 0.34185142970942023, 0.3432122904766578,
        0.3564675016602075, 0.23054844536779343, 0.34356267329076845,
        0.38402898202464003, 0.3907805409918177, 0.4247944038554368,
        0.30699225869160895, 0.3749081472317204, 0.4328211438196752,
        0.3055301551683806, 0.27084907069604935, 0.239797010131186,
        0.2461447493223406, 0.22744212531841854, 0.06479245863958312,
        0.0599385684270915, -0.08887542034119818, 0.017228431823064626,
        0.20703708911191995, 0.19476687594002798, 0.06362419519945461,
        0.152404436085654, 0.02799795134304233, -0.02117448039271437,
      ],
      tension: [
        0.14290097348378722, 0.14641139664881223, 0.18691078712111064,
        0.21963613840735974, 0.34185142970942023, 0.3432122904766578,
        0.3564675016602075, 0.23054844536779343, 0.34356267329076845,
        0.38402898202464003, 0.3907805409918177, 0.4247944038554368,
        0.30699225869160895, 0.3749081472317204, 0.4328211438196752,
        0.3055301551683806, 0.27084907069604935, 0.239797010131186,
        0.2461447493223406, 0.22744212531841854, 0.06479245863958312,
        0.0599385684270915, 0.08887542034119818, 0.017228431823064626,
        0.20703708911191995, 0.19476687594002798, 0.06362419519945461,
        0.152404436085654, 0.02799795134304233, 0.02117448039271437,
      ],
    },
    deepDive: {
      title: "Price Tension",
      explanation:
        "Price is near its natural equilibrium — neither stretched too high nor too low. This balanced state often provides more stable conditions for patient decisions.",
    },
  },
};
