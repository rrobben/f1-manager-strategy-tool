import {
  Chart,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  TimeScale,
  Tooltip,
} from "chart.js";
// import "chartjs-adapter-moment";

Chart.register(ArcElement, BarController, BarElement, CategoryScale, Legend, LinearScale, LineController, LineElement, PieController, PointElement, TimeScale, Tooltip);

const COLORS = ["#4dc9f6", "#f67019", "#f53794", "#537bc4", "#acc236", "#166a8f", "#00a950", "#58595b", "#8549ba"];

const color = (index) => {
  return COLORS[index % COLORS.length];
};

export { Chart, color };
