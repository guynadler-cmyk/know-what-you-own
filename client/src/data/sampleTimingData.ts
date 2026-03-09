import type { TimingAnalysis } from "@shared/schema";

export const SAMPLE_TIMING_DATA_AAPL: TimingAnalysis = {
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

export const SAMPLE_TIMING_DATA_GM: TimingAnalysis = {
  ticker: "GM",
  companyName: "General Motors Company",
  lastUpdated: "2026-03-09T20:22:42.662Z",
  timeframe: "weekly",
  debug: {
    timeframe: "weekly",
    lastBarDate: "2026-03-09",
    seriesType: "unadjusted",
    rsiLatest: 50.52,
    rsiPrevious: 56.57,
    rsiDistanceFrom50: 0.52,
    macdLine: 4.755,
    macdSignal: 6.128,
    macdHist: -1.372,
    macdHistPrev: -0.849,
    shortEmaSlope: -0.0032,
    longEmaSlope: 0.0239,
    highsProgression: "Weakening",
    lowsProgression: "Weakening",
    distanceFromBalance: 0.52,
    rsiZone: "Neutral",
    rsiDirection: "Falling",
  },
  verdict: {
    message: "Conditions are mixed — patience may be rewarded",
    subtitle: "These readings describe current market conditions — not the future.",
    alignmentScore: -0.09999999999999999,
  },
  trend: {
    signal: {
      status: "red",
      label: "Weakening structure",
      interpretation: "Both highs and lows are declining — structure is under pressure.",
      score: -0.5,
      position: { x: 30, y: 30 },
      signals: [
        { label: "Highs", value: "Weakening" },
        { label: "Lows", value: "Weakening" },
      ],
    },
    chartData: {
      prices: [
        58.665, 58.446666666666665, 58.333333333333336, 58.35,
        59.336666666666666, 58.93666666666667, 58.46, 60.343333333333334,
        64.54666666666667, 67.78666666666668, 69.32000000000001,
        68.67333333333333, 70.64333333333333, 71.45666666666666,
        74.53333333333333, 77.52666666666666, 80.55666666666667,
        82.27999999999999, 82.13333333333333, 81.85333333333332,
        81.48666666666666, 81.35666666666667, 82.35333333333334, 84.04,
        83.67, 83.26, 81.97333333333334, 81.56666666666668,
        78.57666666666667, 76.65,
      ],
      baseline: [
        53.58011340881254, 54.48009278902843, 55.12189410011417,
        55.72882244554795, 56.24721836453922, 57.105905934622996,
        57.13392303741881, 57.13684612152448, 58.86105591761094,
        60.86268211440895, 61.95492172997095, 63.639481415430765,
        64.41957570353426, 65.93965284834621, 67.34335233046508,
        69.12819736128961, 71.42488875014604, 73.48399988648312,
        75.09236354348619, 76.22466108103414, 77.25835906630066,
        77.98047559970053, 78.51675276339134, 79.67734317004745,
        80.879644411857, 80.68698179151936, 81.22934873851584,
        81.44764896787659, 80.92989461008085, 79.79718649915705,
      ],
    },
    deepDive: {
      title: "Market Structure",
      explanation:
        "The structure shows prices moving lower across most timeframes. While this doesn't mean prices will continue falling, it suggests caution until conditions stabilize.",
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
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        0.9, 0.85, 0.82, 0.88, 0.91, 0.87, 0.83, 0.79, 0.72, 0.65,
      ],
      longEma: [
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.5,
      ],
    },
    deepDive: {
      title: "Price Tension",
      explanation:
        "Price has moved somewhat away from equilibrium. Some tension exists, which could resolve through price returning toward balance or the equilibrium adjusting.",
    },
  },
  stretch: {
    signal: {
      status: "yellow",
      label: "Cooling off",
      interpretation: "Wins have dominated lately, but momentum is easing — pullback risk is rising.",
      score: 0.2,
      position: { x: 50.51594342598701, y: 75 },
      signals: [
        { label: "RSI", value: "Balanced" },
        { label: "Pressure", value: "Cooling" },
      ],
    },
    chartData: {
      values: [
        0.3266611285812371, 0.31165483979870684, 0.28158812129134786,
        0.29661447968178833, 0.3008142565602469, 0.38019079481073104,
        0.16003446576114158, 0.15415605349026407, 0.42452532971709755,
        0.4853271294502963, 0.34415112134620474, 0.4289118392798727,
        0.292823359918618, 0.38570380280207134, 0.4010745422779064,
        0.459049991483638, 0.5242337568504456, 0.5371600846161106,
        0.5183131093590413, 0.47158641080891356, 0.4816225160344959,
        0.44749920639397034, 0.4318316038017628, 0.5077616394697344,
        0.5313756813884484, 0.234507985598827, 0.3190958930393438,
        0.27040416746585405, 0.1314772510540253, 0.010318868519740221,
      ],
      tension: [
        0.3266611285812371, 0.31165483979870684, 0.28158812129134786,
        0.29661447968178833, 0.3008142565602469, 0.38019079481073104,
        0.16003446576114158, 0.15415605349026407, 0.42452532971709755,
        0.4853271294502963, 0.34415112134620474, 0.4289118392798727,
        0.292823359918618, 0.38570380280207134, 0.4010745422779064,
        0.459049991483638, 0.5242337568504456, 0.5371600846161106,
        0.5183131093590413, 0.47158641080891356, 0.4816225160344959,
        0.44749920639397034, 0.4318316038017628, 0.5077616394697344,
        0.5313756813884484, 0.234507985598827, 0.3190958930393438,
        0.27040416746585405, 0.1314772510540253, 0.010318868519740221,
      ],
    },
    deepDive: {
      title: "Price Tension",
      explanation:
        "Price has moved somewhat away from equilibrium. Some tension exists, which could resolve through price returning toward balance or the equilibrium adjusting.",
    },
  },
};

export const SAMPLE_TIMING_DATA_MU: TimingAnalysis = {
  ticker: "MU",
  companyName: "Micron Technology Inc",
  lastUpdated: "2026-03-09T20:22:43.408Z",
  timeframe: "weekly",
  debug: {
    timeframe: "weekly",
    lastBarDate: "2026-03-09",
    seriesType: "unadjusted",
    rsiLatest: 65.69,
    rsiPrevious: 68.32,
    rsiDistanceFrom50: 15.69,
    macdLine: 63.508,
    macdSignal: 60.309,
    macdHist: 3.199,
    macdHistPrev: 7.124,
    shortEmaSlope: 0.1059,
    longEmaSlope: 0.1366,
    highsProgression: "Weakening",
    lowsProgression: "Strengthening",
    distanceFromBalance: 15.69,
    rsiZone: "Neutral",
    rsiDirection: "Falling",
  },
  verdict: {
    message: "Conditions are improving, but not fully aligned",
    subtitle: "These readings describe current market conditions — not the future.",
    alignmentScore: 0.39999999999999997,
  },
  trend: {
    signal: {
      status: "yellow",
      label: "Stabilizing",
      interpretation: "Higher lows forming, but highs not yet improving — early signs of support.",
      score: 0.3,
      position: { x: 30, y: 70 },
      signals: [
        { label: "Highs", value: "Weakening" },
        { label: "Lows", value: "Strengthening" },
      ],
    },
    chartData: {
      prices: [
        117.49000000000001, 123.40666666666668, 137.51333333333335, 153.49,
        164.18333333333334, 173.14000000000001, 180.0233333333333,
        191.67999999999998, 203.75333333333333, 214.07666666666668,
        227.01666666666665, 229.21333333333334, 231.38, 230.84,
        238.8133333333333, 241.47333333333333, 253.73333333333332,
        267.13666666666666, 284.77, 305.8633333333333, 319.43666666666667,
        354.0033333333334, 385.91333333333336, 401.2633333333333, 408.34,
        403.56333333333333, 420.09666666666664, 416.9066666666667,
        406.3633333333333, 395.04499999999996,
      ],
      baseline: [
        115.91077112566771, 116.37790364827357, 119.80737571222383,
        126.90058012818312, 134.084111013968, 140.12699992051927,
        148.4111817531521, 155.43823961621536, 163.9567415041762,
        174.49369759432597, 182.40938894081216, 193.08222731520993,
        199.52182234880814, 204.0687637399339, 210.50898851449136,
        218.12917242094744, 220.74386834441154, 230.8395286454276,
        242.0741598008044, 249.95340347338544, 266.2436937509517,
        278.4448403416877, 298.5657784613809, 323.42290965022073,
        333.60056244108966, 347.5531874518006, 360.8980624605641,
        373.2802329222797, 378.2783723909561, 380.2859410471459,
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
      status: "green",
      label: "Aligned",
      interpretation: "Momentum is aligning — supportive.",
      score: 0.7,
      position: { x: 70, y: 70 },
      signals: [
        { label: "Short-term pressure", value: "Improving" },
        { label: "Long-term baseline", value: "Improving" },
        { label: "Pressure gap", value: "Narrowing" },
      ],
    },
    chartData: {
      shortEma: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
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
        "Underlying pressure is positive and building. This suggests more participants are leaning in the same direction, which can support continued movement. However, strong momentum can reverse quickly.",
    },
  },
  stretch: {
    signal: {
      status: "yellow",
      label: "Cooling off",
      interpretation: "Wins have dominated lately, but momentum is easing — pullback risk is rising.",
      score: 0.2,
      position: { x: 65.6873012874903, y: 75 },
      signals: [
        { label: "RSI", value: "Balanced" },
        { label: "Pressure", value: "Cooling" },
      ],
    },
    chartData: {
      values: [
        0.09524112497223015, 0.11389715165187227, 0.2541009728638943,
        0.39833960953393927, 0.43613667432483794, 0.44067354411917764,
        0.5239443288630321, 0.5295692839679907, 0.5878683155925635,
        0.6483305384792465, 0.5983905525429154, 0.6636677355471696,
        0.518449302668265, 0.47480282356491443, 0.5296660130488653,
        0.5713450895094414, 0.3700207479550045, 0.5166128448716251,
        0.5580201921624396, 0.4970716299485838, 0.617807915058649,
        0.5712873054004172, 0.6646767625871712, 0.719217745170599,
        0.41849383129739354, 0.47341664777761366, 0.49116488822048754,
        0.5048023007130641, 0.36648993101869964, 0.313746025749806,
      ],
      tension: [
        0.09524112497223015, 0.11389715165187227, 0.2541009728638943,
        0.39833960953393927, 0.43613667432483794, 0.44067354411917764,
        0.5239443288630321, 0.5295692839679907, 0.5878683155925635,
        0.6483305384792465, 0.5983905525429154, 0.6636677355471696,
        0.518449302668265, 0.47480282356491443, 0.5296660130488653,
        0.5713450895094414, 0.3700207479550045, 0.5166128448716251,
        0.5580201921624396, 0.4970716299485838, 0.617807915058649,
        0.5712873054004172, 0.6646767625871712, 0.719217745170599,
        0.41849383129739354, 0.47341664777761366, 0.49116488822048754,
        0.5048023007130641, 0.36648993101869964, 0.313746025749806,
      ],
    },
    deepDive: {
      title: "Price Tension",
      explanation:
        "Price has moved somewhat away from equilibrium. Some tension exists, which could resolve through price returning toward balance or the equilibrium adjusting.",
    },
  },
};

export const SAMPLE_TIMING_DATA = SAMPLE_TIMING_DATA_AAPL;
