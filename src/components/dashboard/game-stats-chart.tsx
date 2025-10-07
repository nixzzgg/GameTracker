"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import type { GameState } from "@/hooks/use-game-store"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  completed: {
    label: "Completados",
    color: "hsl(var(--chart-1))",
  },
  playing: {
    label: "Jugando",
    color: "hsl(var(--chart-2))",
  },
  wishlist: {
    label: "Wishlist",
    color: "hsl(var(--chart-3))",
  },
  dropped: {
    label: "Abandonados",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

interface GameStatsChartProps {
  data: GameState;
}

export default function GameStatsChart({ data }: GameStatsChartProps) {
  const chartData = [
    {
      status: 'games',
      completed: data.completed.length,
      playing: data.playing.length,
      wishlist: data.wishlist.length,
      dropped: data.dropped.length,
    },
  ];

  const totalGames = chartData[0].completed + chartData[0].playing + chartData[0].wishlist + chartData[0].dropped;

  if (totalGames === 0) {
    return null;
  }

  const dataKeys = Object.keys(chartConfig) as (keyof typeof chartConfig)[];
  const visibleBars = dataKeys.filter(key => chartData[0][key] > 0);

  const legendData = dataKeys
    .map(key => ({
        key,
        label: chartConfig[key].label,
        color: chartConfig[key].color,
        value: chartData[0][key],
        percentage: totalGames > 0 ? Math.round((chartData[0][key] / totalGames) * 100) : 0,
    }))
    .filter(item => item.value > 0);

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={chartConfig} className="h-10 w-full">
        <BarChart
          layout="vertical"
          data={chartData}
          stackOffset="expand"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide domain={[0, 1]} />
          <YAxis type="category" dataKey="status" hide />
          {visibleBars.map((key, index) => {
            const isFirst = index === 0;
            const isLast = index === visibleBars.length - 1;
            let radius: [number, number, number, number] | undefined = undefined;

            if (isFirst && isLast) {
              radius = [4, 4, 4, 4];
            } else if (isFirst) {
              radius = [4, 0, 0, 4];
            } else if (isLast) {
              radius = [0, 4, 4, 0];
            }

            return (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                stackId="a"
                radius={radius}
              />
            );
          })}
        </BarChart>
      </ChartContainer>
      <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:items-center sm:gap-x-6 sm:gap-y-2">
        {legendData.map(item => (
            <div key={item.key} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium">{item.label} <span className="text-foreground">{item.percentage}%</span></span>
            </div>
        ))}
      </div>
    </div>
  )
}
