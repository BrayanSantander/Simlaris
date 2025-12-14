import { Card, CardContent } from "@/components/ui/card"
import { Factory, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface FleetStatsProps {
  totalMachines: number
  operational: number
  warning: number
  critical: number
  avgEfficiency: number
}

export function FleetStats({ totalMachines, operational, warning, critical, avgEfficiency }: FleetStatsProps) {
  const stats = [
    {
      label: "Total Máquinas",
      value: totalMachines,
      icon: Factory,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Operacionales",
      value: operational,
      icon: CheckCircle2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "En Advertencia",
      value: warning,
      icon: AlertTriangle,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Críticas",
      value: critical,
      icon: AlertTriangle,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
    {
      label: "Eficiencia Promedio",
      value: `${avgEfficiency}%`,
      icon: TrendingUp,
      color: avgEfficiency > 70 ? "text-chart-3" : "text-chart-4",
      bgColor: avgEfficiency > 70 ? "bg-chart-3/10" : "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <Icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
