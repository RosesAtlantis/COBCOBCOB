"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";

interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  data: object[];
  xKey: string;
  series: ChartSeries[];
  variant?: "line" | "bar" | "area";
  height?: number;
}

const DEFAULT_CHART_WIDTH = 720;

function formatTooltipValue(value: number) {
  return value > 1000 ? formatCurrency(value) : formatNumber(value);
}

export function ChartCard({
  title,
  description,
  data,
  xKey,
  series,
  variant = "line",
  height = 280,
}: ChartCardProps) {
  const ChartComponent =
    variant === "bar" ? BarChart : variant === "area" ? AreaChart : LineChart;

  return (
    <Card className="dashboard-surface">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description ? (
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {series.map((item) => (
              <Badge
                key={item.key}
                variant="outline"
                className="rounded-md border-border/80 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground"
              >
                <span
                  className="mr-2 inline-block size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: DEFAULT_CHART_WIDTH, height }}
          >
            <ChartComponent data={data} margin={{ left: -10, right: 8, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(148,163,184,0.78)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(148,163,184,0.78)", fontSize: 12 }}
                width={80}
              />
              <Tooltip
                cursor={{ stroke: "rgba(148,163,184,0.18)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.15)",
                  background: "rgba(15, 23, 42, 0.94)",
                }}
                formatter={(value) =>
                  formatTooltipValue(typeof value === "number" ? value : 0)
                }
              />
              {series.map((item) => {
                if (variant === "bar") {
                  return (
                    <Bar
                      key={item.key}
                      dataKey={item.key}
                      fill={item.color}
                      radius={[8, 8, 2, 2]}
                    />
                  );
                }

                if (variant === "area") {
                  return (
                    <Area
                      key={item.key}
                      dataKey={item.key}
                      type="monotone"
                      stroke={item.color}
                      fill={item.color}
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                    />
                  );
                }

                return (
                  <Line
                    key={item.key}
                    dataKey={item.key}
                    type="monotone"
                    stroke={item.color}
                    dot={false}
                    strokeWidth={2.5}
                  />
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
