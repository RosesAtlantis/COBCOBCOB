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
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ left: -10, right: 8, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(230,233,240,0.64)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(230,233,240,0.64)", fontSize: 12 }}
                width={80}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.12)" }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(16, 22, 36, 0.95)",
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
                      radius={[10, 10, 2, 2]}
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
