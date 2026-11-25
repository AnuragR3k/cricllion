'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export const description = 'How your seven answers compare with an average innings'

const chartConfig = {
  you: {
    label: 'You',
    color: 'var(--chart-2)',
    icon: TrendingUp,
  },
  average: {
    label: 'Average player',
    color: 'var(--chart-1)',
    icon: TrendingDown,
  },
} satisfies ChartConfig

function buildData(results: { score: number }[]) {
  let you = 0
  let average = 0
  return results.map((result, index) => {
    you += result.score
    average += 35
    return { ball: `Ball ${index + 1}`, you, average }
  })
}

export function ScoreComparisonChart({
  results,
  percentile,
}: {
  results: { score: number }[]
  percentile: number
}) {
  const data = buildData(results)
  const last = data[data.length - 1]
  const ahead = (last?.you ?? 0) > (last?.average ?? 0)

  return (
    <Card className="score-card">
      <CardHeader>
        <CardTitle>You vs the average</CardTitle>
        <CardDescription>Running score across the seven balls</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="ball"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.replace('Ball ', '')}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="average"
              type="natural"
              fill="var(--color-average)"
              fillOpacity={0.25}
              stroke="var(--color-average)"
            />
            <Area
              dataKey="you"
              type="natural"
              fill="var(--color-you)"
              fillOpacity={0.4}
              stroke="var(--color-you)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {ahead ? 'You finished ahead of the average' : 'The average finished ahead of you'}
              {ahead ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              You beat {percentile}% of players
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
