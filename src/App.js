import { Chart, color } from "./Chart";
import moment from "moment";
import React from "react";
import "./App.css";
import getStrategies, { TRACK_LAPS } from "./Strategy";
import Table, { IndeterminateCheckbox } from "./Table";
import "./bootstrap.scss";
import update from "immutability-helper";

const TIRES_AVAILABLE = {
  s: [
    { cond: 100, available: true },
    { cond: 100, available: true },
    { cond: 100, available: false },
    { cond: 100, available: false },
    { cond: 100, available: false },
  ],
  m: [
    { cond: 100, available: true },
    { cond: 100, available: true },
    { cond: 100, available: false },
  ],
  h: [
    { cond: 100, available: true },
    { cond: 100, available: false },
  ],
};

const TRACKS = ["bahrain", "saudi_arabia", "australia", "emilia_romagna", "miami", "spain"];
const getTyreBadge = (tyre, deg) => {
  let mainColor = "secondary";

  if (tyre === "S") {
    mainColor = "danger";
  } else if (tyre === "M") {
    mainColor = "warning";
  }

  return mainColor + (deg < 100 ? " light" : "");
};

function App() {
  const chartRef = React.useRef();
  const [strategies, setStrategies] = React.useState([]);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [track, setTrack] = React.useState(new URLSearchParams(window.location.search).get("gp") || "bahrain");
  const [fastestTime, setFastestTime] = React.useState();
  const [laps, setLaps] = React.useState(TRACK_LAPS[track]);
  const [tires, setTires] = React.useState(TIRES_AVAILABLE);

  React.useEffect(() => {
    setStrategies(
      getStrategies(
        track,
        laps,
        Object.fromEntries(
          Object.keys(tires)
            .map((k) => [
              k,
              tires[k]
                .filter((t) => t.available && t.cond > 0)
                .map((t) => t.cond)
                .sort((a, b) => b - a),
            ])
            .filter((t) => t[1].length)
        )
      )
    );
  }, [track, laps, tires]);

  React.useEffect(() => {
    setFastestTime(strategies.map((s) => s.time).sort((a, b) => a - b)[0]);
  }, [strategies]);

  React.useEffect(() => {
    if (strategies.length > 0) initChart();
  }, [selectedRows, strategies]);

  const initChart = () => {
    const ctx = document.getElementById("chart");
    if (chartRef.current) chartRef.current.destroy();

    const data = {
      labels: [...Array(strategies[0].laptimes.length + 1).keys()].slice(1),
      datasets: strategies
        .filter((d) => selectedRows.includes(d.id))
        .map((d, i) => ({
          label: d.id,
          data: d.laptimes,
          backgroundColor: color(i),
          borderColor: color(i),
        })),
    };

    const config = {
      type: "line",
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: ({ dataset, raw }) =>
                `${dataset.label}: ${moment(raw * 1000)
                  .utc()
                  .format("m:ss.SSS")}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (label, index, labels) =>
                moment(label * 1000)
                  .utc()
                  .format("m:ss.SSS"),
            },
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);
  };

  const columns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler(),
              className: "vertical-align-middle",
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
                className: "vertical-align-middle",
              }}
            />
          </div>
        ),
      },
      {
        header: "Strategy",
        accessorFn: ({ strategy }) => strategy.split("-").map((s) => s.split(".")),
        cell: ({ getValue }) =>
          getValue().map((v, i) => (
            <span key={`${v[0]}.${i}`} className={`badge tyre-badge ${v[0].toLowerCase()} rounded-pill mr-1 bg-${getTyreBadge(v[0], v[1])}`}>
              {v[0]}
            </span>
          )),
      },
      {
        header: "Gap",
        id: "time",
        accessorFn: ({ time }) => (fastestTime ? time - fastestTime : 0),
        cell: ({ getValue }) =>
          moment(getValue() * 1000)
            .utc()
            .format("m:ss"),
        classes: "text-end font-family-monospace",
        headerClasses: "text-end",
      },
      {
        header: "Optimal Pit laps",
        accessorFn: ({ pit = [] }) => {
          let total = TRACK_LAPS[track] - laps;
          return pit.map((r) => (total += r));
        },
        classes: "text-end font-family-monospace",
        headerClasses: "text-end",
      },
    ],
    [fastestTime, laps, track]
  );

  const handleLapsChange = (e) => {
    setLaps(e.target.value === "" ? "" : Math.max(Math.min(TRACK_LAPS[track], e.target.value), 1));
  };

  const handleTireChange = (tyre, idx, attr, val) => {
    if (attr === "cond") {
      val = Math.max(Math.min(100, val), 1);
    }

    setTires(
      update(tires, {
        [tyre]: {
          [idx]: {
            [attr]: {
              $set: val,
            },
          },
        },
      })
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3">
          <div className="row">
            <div className="col-12 col-xl-6">
              <label className="w-100 mb-3">
                Track
                <select className="form-select" value={track} onChange={(e) => (window.location.search = `?gp=${e.target.value}`)}>
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t
                        .split("_")
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="col-12 col-xl-6">
              <label className="w-100 mb-3">
                Laps remaining
                <input type="number" min={1} max={TRACK_LAPS[track]} value={laps} onChange={handleLapsChange} className="form-control" />
              </label>
            </div>
          </div>
          <div className="row mb-3">
            {Object.keys(tires).flatMap((k) =>
              (tires[k] || []).map((t, i) => (
                <div key={`${k}.${i}`} className="col-6 col-sm-12 col-xl-6 my-1">
                  <div className="row">
                    <div className="col-6">
                      <label className="w-100 vertical-align-sub" key={`${k}.${i}`}>
                        <input
                          type="checkbox"
                          className="form-check-inline mr-1 vertical-align-middle"
                          checked={t.available}
                          onChange={(e) => handleTireChange(k, i, "available", e.target.checked)}
                        />{" "}
                        <span className={`badge tyre-badge ${k.toLowerCase()} rounded-pill mr-1 bg-${getTyreBadge(k.toUpperCase(), t.cond)}`}>{k.toUpperCase()}</span>
                      </label>
                    </div>
                    <div className="col-6">
                      <input type="number" min={1} max={100} className="form-control" value={t.cond} onChange={(e) => handleTireChange(k, i, "cond", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Table key={fastestTime} data={strategies} columns={columns} defaultSort={[{ id: "time", desc: false }]} setSelectedRows={setSelectedRows} selectedRows={selectedRows} />
        </div>
        <div className="col-12 col-sm-6 col-md-8 col-lg-9 col-xl-9">
          <h5 className="text-center mt-3">Expected lap times (ignoring pit stop time loss, fuel and track evolution)</h5>
          <canvas id="chart"></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
