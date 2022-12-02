const TRACK_PRESET = {
  bahrain: [
    ["s", "m", "s"],
    ["s", "h", "s"],
    ["s", "h", "m"],
  ],
  saudi_arabia: [
    ["m", "h"],
    ["h", "m"],
    ["s", "h", "m"],
  ],
  australia: [
    ["m", "h"],
    ["m", "h", "m"],
    ["h", "m"],
  ],
  emilia_romagna: [
    ["m", "h"],
    ["h", "s"],
    ["s", "m", "m"],
  ],
  miami: [
    ["m", "h"],
    ["h", "m", "m"],
    ["m", "h", "s"],
  ],
};

const getPossibleStrategies = (track) => {
  const tireCounts = {
    s: 3,
    m: 3,
    h: 2,
  };

  const presetStrats = [...TRACK_PRESET[track]];

  const tires = Object.keys(tireCounts).sort().reverse();
  let strategies = [tires.map((k) => [k])];

  for (let i = 1; i < 4; i++) {
    let newStrategies = [];

    strategies[i - 1].forEach((s) => {
      tires.forEach((t) => {
        if (s.filter((st) => st === t).length < tireCounts[t]) {
          const newStrat = [...s, t];
          const newStratSort = [...newStrat].sort().join("");

          if (!newStrategies.find((s) => [...s].sort().join("") === newStratSort)) {
            const preset = presetStrats.find((ps) => [...ps].sort().join("") === newStratSort);
            newStrategies.push(preset || newStrat);
          }
        }
      });
    });

    strategies.push(newStrategies);
  }

  return strategies.flat().filter((s) => [...new Set(s)].length > 1);
};

const TRACK_TIRE_PARAMS = {
  bahrain: {
    lapTime: { h: 96.736, m: 95.967, s: 95.128 },
    competitiveLaps: { h: 27, m: (1.5 / 1.75) * 27, s: (1.089 / 1.75) * 27 },
    averageDeg: { h: 0.1, m: 0.175 / 1.5, s: 0.175 / 1.089 },
  },
  saudi_arabia: {
    lapTime: { h: 92.968, m: 92.637, s: 92.351 },
    competitiveLaps: { h: 31, m: 22, s: 14.75 },
    averageDeg: { h: 0.05, m: 0.08, s: (1.089 / 0.733) * 0.08 },
  },
  australia: {
    lapTime: { h: 83.229, m: 82.805, s: 82.442 },
    competitiveLaps: { h: 32, m: 23, s: 12 },
    averageDeg: { h: (0.578 / 1.5) * 0.14, m: (0.578 / 1.089) * 0.14, s: 0.14 },
  },
  emilia_romagna: {
    lapTime: { h: 79.289, m: 79.022, s: 78.741 },
    competitiveLaps: { h: 46, m: 47, s: 22 },
    averageDeg: { h: 0.03, m: 0.04, s: 0.07 },
  },
  miami: {
    lapTime: { h: 92.848, m: 92.42, s: 91.985 },
    competitiveLaps: { h: 32, m: 23, s: 15.5 },
    averageDeg: { h: 0.07, m: 0.1, s: 0.16 },
  },
};

const getStints = (laps, track) => {
  const { lapTime, competitiveLaps, averageDeg } = TRACK_TIRE_PARAMS[track];
  const percentageDeg = { h: 70 / competitiveLaps.h, m: 70 / competitiveLaps.m, s: 70 / competitiveLaps.s };
  const startingDeg = 100;

  let lapTimes = { h: [], m: [], s: [] };
  let stintArrays = { h: [], m: [], s: [] };

  Object.keys(lapTime).forEach((k) => {
    let stintTime = 0;
    let currentDeg = 0;

    for (let i = 1; i <= laps; i++) {
      const lapstartingDeg = Math.round(startingDeg - percentageDeg[k] * i);
      if (lapstartingDeg <= 0) {
        break;
      }
      let degFactor;

      if (lapstartingDeg >= 90) {
        degFactor = 0.1;
      } else if (lapstartingDeg >= 85) {
        degFactor = 0.25;
      } else if (lapstartingDeg >= 80) {
        degFactor = 0.5;
      } else if (lapstartingDeg >= 75) {
        degFactor = 0.75;
      } else if (lapstartingDeg > 60) {
        degFactor = 1;
      } else if (lapstartingDeg > 50) {
        degFactor = 1.25;
      } else if (lapstartingDeg > 40) {
        degFactor = 1.5;
      } else if (lapstartingDeg > 30) {
        degFactor = 1.75;
      } else if (lapstartingDeg > 20) {
        degFactor = 3;
      } else {
        degFactor = 5;
      }

      // degFactor = 1;

      currentDeg += degFactor * averageDeg[k];
      lapTimes[k].push(lapTime[k] + currentDeg);
      stintTime += lapTime[k] + currentDeg;
      stintArrays[k].push(stintTime);
    }
  });

  return [stintArrays, lapTimes];
};

const getOptimalStint = (stints, laps, stintArrays) => {
  const stintArray = stintArrays[stints[0]];

  if (stints.length === 1) {
    const stintTime = stintArray[laps - 1];
    return [stintTime];
  }

  const maxLaps = Math.min(stintArray.length, laps);
  let bestTotalTime;
  let allPitLaps;

  for (let i = maxLaps; i > 0; i--) {
    const stintTime = stintArray[i - 1];

    if (stintTime) {
      const [restStintsTime, restStintPitLaps] = getOptimalStint(stints.slice(1), laps - i, stintArrays);
      if (restStintsTime) {
        let totalTime = stintTime + restStintsTime;
        if (!bestTotalTime || totalTime.toFixed(3) < bestTotalTime.toFixed(3)) {
          bestTotalTime = totalTime;
          allPitLaps = [i, ...(restStintPitLaps || [])];
        }
      }
    }
  }

  return [bestTotalTime, allPitLaps];
};

const TRACK_PIT_LOSS = {
  bahrain: 20,
  saudi_arabia: 17,
  australia: 19,
  emilia_romagna: 26,
  miami: 22,
};

const getTotal = (stints, laps, stintArrays, track) => {
  const pitLoss = TRACK_PIT_LOSS[track];
  let [bestTotalTime, pitLap] = getOptimalStint(stints, laps, stintArrays);
  bestTotalTime += pitLoss * (stints.length - 1);

  return [bestTotalTime, pitLap];
};

const TRACK_LAPS = {
  bahrain: 57,
  saudi_arabia: 50,
  australia: 58,
  emilia_romagna: 63,
  miami: 57,
};

const getStrategies = (track) => {
  const laps = TRACK_LAPS[track];
  const [stintArrays, lapTimes] = getStints(laps, track);
  return getPossibleStrategies(track)
    .map((s) => {
      const [totalTime, pitLap = []] = getTotal(s, laps, stintArrays, track).filter(Boolean);
      return [s.join("-").toUpperCase(), totalTime, pitLap, s.flatMap((t, i) => lapTimes[t].slice(0, pitLap[i] || laps - pitLap.reduce((a, b) => a + b, 0)))].filter(Boolean);
    })
    .filter((arr) => arr.length === 4);
};

export default getStrategies;
