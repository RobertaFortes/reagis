import type { Option } from "@/types/results";
import "@/styles/VerticalBarChart.css";

const BAR_COLORS = [
  "#D85A30",
  "#5B7FFF",
  "#4CAF7D",
  "#C86DD7",
  "#E8A838",
  "#3ECFCF",
];

interface VerticalBarChartProps {
  options: Option[];
}

const VerticalBarChart = ({ options }: VerticalBarChartProps) => {
  const maxVotes = Math.max(...options.map((o) => o.votes), 1);

  return (
    <div className="vertical-chart">
      <div className="vertical-chart__bars">
        {options.map((opt, i) => {
          const pct = (opt.votes / maxVotes) * 100;

          return (
            <div className="vertical-chart__column" key={opt.label}>
              <span className="vertical-chart__count">{opt.votes}</span>
              <div className="vertical-chart__bar-track">
                <div
                  className="vertical-chart__bar-fill"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
              <span className="vertical-chart__label" title={opt.label}>
                {opt.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerticalBarChart;
