import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
} from 'chart.js'

let registered = false

export const ensureChartJsRegistered = () => {
  if (registered) return
  registered = true
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadarController,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
  )
}
