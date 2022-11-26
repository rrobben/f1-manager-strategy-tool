import { Chart, color } from "./Chart";
import moment from "moment";
import React from "react";
import "./App.css";
import getStrategies from "./Strategy";
import Table, { IndeterminateCheckbox } from "./Table";
import "bootstrap/dist/css/bootstrap.min.css";

const TRACKS = ["bahrain", "saudi_arabia", "australia", "emilia_romagna", "miami"];

function App() {
  const chartRef = React.useRef();
  const [strategies, setStrategies] = React.useState([]);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [track, setTrack] = React.useState("bahrain");

  React.useEffect(() => {
    setStrategies(getStrategies(track));
  }, [track]);

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
          title: {
            display: true,
            text: "Chart.js Line Chart",
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
              }}
            />
          </div>
        ),
      },
      {
        header: "strategy",
        accessorFn: (row) => row[0],
      },
      {
        header: "time",
        accessorFn: (row) => row[1],
        cell: ({ getValue }) =>
          moment(getValue() * 1000)
            .utc()
            .format("H:mm:ss"),
      },
      {
        header: "pit laps",
        accessorFn: (row) => {
          let total = 0;
          return row[2].map((r) => (total += r));
        },
      },
    ],
    []
  );

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-2">
          <select className="form-select my-2" value={track} onChange={(e) => setTrack(e.target.value)}>
            {TRACKS.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <Table data={strategies} columns={columns} defaultSort={[{ id: "time", desc: false }]} setSelectedRows={setSelectedRows} />
        </div>
        <div className="col-10">
          <canvas id="chart"></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
