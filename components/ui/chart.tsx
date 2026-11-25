'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error('useChart must be used within a <ChartContainer />')
  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn("[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-none", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.color)
  if (!colorConfig.length) return null
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, cfg]) => `  --color-${key}: ${cfg.color};`)
          .join('\n')}\n}`,
      }}
    />
  )
}

function ChartTooltip({ ...props }: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return <RechartsPrimitive.Tooltip {...props} />
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string; payload?: Record<string, unknown> }>
  className?: string
  indicator?: 'line' | 'dot' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: React.ReactNode
  labelFormatter?: (value: React.ReactNode, payload: unknown[]) => React.ReactNode
  formatter?: (value: number, name: string, item: unknown, index: number, payload: unknown) => React.ReactNode
  labelClassName?: string
  color?: string
  nameKey?: string
  labelKey?: string
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null

  const labelNode = labelFormatter
    ? labelFormatter(label ?? '', payload)
    : label

  return (
    <div className={cn('grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl', className)}>
      {!hideLabel && labelNode != null ? (
        <div className={cn('font-medium', labelClassName)}>{labelNode}</div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = nameKey ? String(item.payload?.[nameKey] ?? item.name ?? item.dataKey) : String(item.name ?? item.dataKey)
          const itemConfig = config[key]
          const itemColor = color ?? item.color ?? itemConfig?.color
          return (
            <div key={key ?? index} className="flex w-full items-center gap-2">
              {!hideIndicator ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: itemColor }}
                />
              ) : null}
              <span className="text-muted-foreground">{itemConfig?.label ?? key}</span>
              <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                {formatter ? formatter(item.value ?? 0, key, item, index, payload) : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend({ ...props }: React.ComponentProps<typeof RechartsPrimitive.Legend>) {
  return <RechartsPrimitive.Legend {...props} />
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: {
  className?: string
  hideIcon?: boolean
  payload?: Array<{ value?: string; color?: string; dataKey?: string }>
  verticalAlign?: 'top' | 'bottom'
  nameKey?: string
}) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className={cn('flex items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}>
      {payload.map((item) => {
        const key = nameKey ? String(item.value ?? item.dataKey) : String(item.value ?? item.dataKey)
        const itemConfig = config[key]
        return (
          <div key={key} className="flex items-center gap-2">
            {!hideIcon && itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            )}
            {itemConfig?.label ?? key}
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  useChart,
}
