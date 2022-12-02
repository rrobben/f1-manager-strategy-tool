import { Chart, color } from "./Chart";
import moment from "moment";
import React from "react";
import "./App.css";
import getStrategies from "./Strategy";
import Table, { IndeterminateCheckbox } from "./Table";
import "bootstrap/dist/css/bootstrap.min.css";

const TRACKS = ["bahrain", "saudi_arabia", "australia", "emilia_romagna", "miami"];
const getTyreBadge = (tyre) => {
  if (tyre === "S") return "danger";
  if (tyre === "M") return "warning";
  return "secondary";
};

function App() {
  const chartRef = React.useRef();
  const [strategies, setStrategies] = React.useState([]);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [track, setTrack] = React.useState(new URLSearchParams(window.location.search).get("gp") || "bahrain");
  const [fastestTime, setFastestTime] = React.useState();

  React.useEffect(() => {
    setStrategies(getStrategies(track));
  }, [track]);

  React.useEffect(() => {
    setFastestTime(strategies.map((s) => s[1]).sort()[0]);
  }, [strategies]);

  React.useEffect(() => {
    if (strategies.length > 0) initChart();
  }, [selectedRows, strategies]);

  const initChart = () => {
    const ctx = document.getElementById("chart");
    if (chartRef.current) chartRef.current.destroy();

    const data = {
      labels: [...Array(strategies[0][3].length + 1).keys()].slice(1),
      datasets: strategies
        .filter((d, i) => selectedRows.includes(i))
        .map((d, i) => ({
          label: d[0],
          data: d[3],
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
        accessorFn: (row) => row[0],
        cell: ({ getValue }) =>
          getValue()
            .split("-")
            .map((v, i) => (
              <span key={`${v}.${i}`} className={`badge tyre-badge ${v.toLowerCase()} rounded-pill mr-1 bg-${getTyreBadge(v)}`}>
                {v}
              </span>
            )),
      },
      {
        header: "Gap",
        id: "time",
        accessorFn: (row) => (fastestTime ? row[1] - fastestTime : 0),
        cell: ({ getValue }) =>
          moment(getValue() * 1000)
            .utc()
            .format("m:ss"),
        classes: "text-end font-family-monospace",
        headerClasses: "text-end",
      },
      {
        header: "Optimal Pit laps",
        accessorFn: (row) => {
          let total = 0;
          return row[2].map((r) => (total += r));
        },
        classes: "text-end font-family-monospace",
        headerClasses: "text-end",
      },
    ],
    [fastestTime]
  );

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 col-lg-4 col-xl-3">
          <select className="form-select my-2" value={track} onChange={(e) => (window.location.search = `?gp=${e.target.value}`)}>
            {TRACKS.map((t) => (
              <option key={t} value={t}>
                {t
                  .split("_")
                  .map((w) => w[0].toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
          <Table key={fastestTime} data={strategies} columns={columns} defaultSort={[{ id: "time", desc: false }]} setSelectedRows={setSelectedRows} />
        </div>
        <div className="col-12 col-lg-8 col-xl-9">
          <h4 className="text-center">Expected lap times (ignoring pit stop time loss, fuel and track evolution)</h4>
          <canvas id="chart"></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
