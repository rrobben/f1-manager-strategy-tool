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

const getPossibleStrategies = (track, laps, tires) => {
  const presetStrats = [...TRACK_PRESET[track]];
  const tireKeys = Object.keys(tires).sort().reverse();
  let strategies = [tireKeys.map((k) => [k])];

  for (let i = 1; i < 4; i++) {
    let newStrategies = [];

    strategies[i - 1].forEach((s) => {
      tireKeys.forEach((t) => {
        if (s.filter((st) => st === t).length < tires[t].length) {
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

  const isFullLength = laps === TRACK_LAPS[track];
  return strategies
    .flat()
    .filter((s) => (isFullLength ? [...new Set(s)].length > 1 : s))
    .map((s) => s.map((t, i) => `${t}.${tires[t][s.slice(0, i + 1).filter((f) => f === t).length - 1]}`));
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
    averageDeg: { h: 0.05, m: 0.084, s: 0.12 },
  },
  australia: {
    lapTime: { h: 83.229, m: 82.805, s: 82.442 },
    competitiveLaps: { h: 32, m: 23, s: 12 },
    averageDeg: { h: (0.578 / 1.5) * 0.14, m: (0.578 / 1.089) * 0.14, s: 0.14 },
  },
  emilia_romagna: {
    lapTime: { h: 79.289, m: 79.022, s: 78.741 },
    competitiveLaps: { h: 46, m: 33, s: 22 },
    averageDeg: { h: 0.032, m: 0.045, s: 0.07 },
  },
  miami: {
    lapTime: { h: 92.848, m: 92.42, s: 91.985 },
    competitiveLaps: { h: 32, m: 23, s: 15.5 },
    averageDeg: { h: 0.07, m: 0.1, s: 0.16 },
  },
};

const getStintTimes = (laps, startingDeg, laptime, averageDeg, percentageDeg, currentDeg, stintTime) => {
  let laptimes = [];
  let stintArray = [];
  let degs = [];

  for (let i = 1; i <= laps; i++) {
    if (startingDeg - percentageDeg * (i + 1) <= 0) break;

    const lapstartingDeg = Math.round(startingDeg - percentageDeg * i);
    let degFactor;

    if (lapstartingDeg === 100) {
      degFactor = 0;
    } else if (lapstartingDeg >= 90) {
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

    const newDeg = degFactor * averageDeg;
    currentDeg += newDeg;
    degs.push([lapstartingDeg, newDeg]);
    laptimes.push(laptime + currentDeg);
    stintTime += laptime + currentDeg;
    stintArray.push(stintTime);
  }

  return [laptimes, stintArray, degs];
};

const getStints = (laps, track, tires) => {
  const { lapTime, competitiveLaps, averageDeg } = TRACK_TIRE_PARAMS[track];
  const percentageDeg = { h: 70 / competitiveLaps.h, m: 70 / competitiveLaps.m, s: 70 / competitiveLaps.s };
  const startingDeg = 100;

  let lapTimes = {};
  let stintArrays = {};

  Object.keys(tires).forEach((k) => {
    const [laptimes, stintArray, degs] = getStintTimes(laps, startingDeg, lapTime[k], averageDeg[k], percentageDeg[k], 0, lapTime[k]);
    lapTimes[`${k}.${startingDeg}`] = [lapTime[k], ...laptimes];
    stintArrays[`${k}.${startingDeg}`] = [lapTime[k], ...stintArray];

    const conds = [...new Set(tires[k].filter((t) => t < 100))];

    conds.forEach((c) => {
      const startingDegIndex = degs.findIndex((d) => c >= d[0]);
      if (startingDegIndex < 0) return;

      const startingDeg = degs[startingDegIndex];
      let currentDeg =
        degs
          .slice(0, startingDegIndex - 1)
          .map((d) => d[1])
          .reduce((a, b) => a + b, 0) +
        startingDeg[1] -
        ((c - startingDeg[0]) / percentageDeg[k]) * startingDeg[1];
      let stintTime = lapTime[k] + currentDeg;

      const [laptimes2, stintArray2] = getStintTimes(laps, startingDeg[0], lapTime[k], averageDeg[k], percentageDeg[k], currentDeg, stintTime);
      lapTimes[`${k}.${c}`] = [stintTime, ...laptimes2];
      stintArrays[`${k}.${c}`] = [stintTime, ...stintArray2];
    });
  });

  return [stintArrays, lapTimes];
};

const getOptimalStint = (stints, laps, stintArrays, tires, stintIdx) => {
  const stintArray = stintArrays[stints[0]];
  if (!stintArray?.length) return [];

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
      const [restStintsTime, restStintPitLaps] = getOptimalStint(stints.slice(1), laps - i, stintArrays, tires, stintIdx + 1);
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

const getTotal = (stints, laps, stintArrays, track, tires) => {
  const pitLoss = TRACK_PIT_LOSS[track];
  let [bestTotalTime, pitLap] = getOptimalStint(stints, laps, stintArrays, tires, 0);
  bestTotalTime += pitLoss * (stints.length - 1);

  return [bestTotalTime, pitLap];
};

export const TRACK_LAPS = {
  bahrain: 57,
  saudi_arabia: 50,
  australia: 58,
  emilia_romagna: 63,
  miami: 57,
};

const getStrategies = (track, laps, tires) => {
  laps = laps || TRACK_LAPS[track];
  const [stintArrays, lapTimes] = getStints(laps, track, tires);
  return getPossibleStrategies(track, laps, tires)
    .map((s) => {
      const [totalTime, pitLap = []] = getTotal(s, laps, stintArrays, track, tires).filter(Boolean);

      return {
        id: s.map((t) => t[0].toUpperCase()).join("-"),
        strategy: s.join("-").toUpperCase(),
        time: totalTime,
        pit: pitLap,
        laptimes: s.flatMap((t, i) => (lapTimes[t] || []).slice(0, pitLap[i] || laps - pitLap.reduce((a, b) => a + b, 0))),
      };
    })
    .filter((s) => s.time);
};

export default getStrategies;
