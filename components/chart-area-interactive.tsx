"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const data = [
  {
    month: "Jan",
    tests: 1200,
    successRate: 95,
  },
  {
    month: "Feb",
    tests: 1400,
    successRate: 96,
  },
  {
    month: "Mar",
    tests: 1600,
    successRate: 97,
  },
  {
    month: "Apr",
    tests: 1800,
    successRate: 97.5,
  },
  {
    month: "May",
    tests: 2000,
    successRate: 98,
  },
  {
    month: "Jun",
    tests: 2200,
    successRate: 98.2,
  },
  {
    month: "Jul",
    tests: 2400,
    successRate: 98.5,
  },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="tests"
          stroke="#2563eb"
          fillOpacity={1}
          fill="url(#colorTests)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="successRate"
          stroke="#16a34a"
          fillOpacity={1}
          fill="url(#colorSuccess)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
