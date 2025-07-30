import { TrendingUp, Phone, PercentCircle, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Sample data for the chart
const callsData = [
  { month: "Jan", calls: 120 },
  { month: "Feb", calls: 145 },
  { month: "Mar", calls: 190 },
  { month: "Apr", calls: 235 },
  { month: "May", calls: 280 },
  { month: "Jun", calls: 320 },
  { month: "Jul", calls: 380 },
  { month: "Aug", calls: 420 },
  { month: "Sep", calls: 465 },
  { month: "Oct", calls: 510 },
  { month: "Nov", calls: 580 },
  { month: "Dec", calls: 650 },
]

const statsCards = [
  {
    title: "Total Calls",
    value: "12,459",
    change: "+23%",
    changeType: "positive" as const,
    icon: Phone,
    description: "from last month",
  },
  {
    title: "Resolution Rate",
    value: "89.5%",
    change: "+5.2%",
    changeType: "positive" as const,
    icon: PercentCircle,
    description: "successful resolutions",
  },
  {
    title: "ROI",
    value: "285%",
    change: "+12%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "return on investment",
  },
]

export function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-foreground">Dashboard</h1>
        <p className="text-body text-muted-foreground mt-2">
          Monitor your voice AI agent performance and key metrics.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 text-foreground">{stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-body-sm font-medium ${
                    stat.changeType === "positive"
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Calls Over Time
          </CardTitle>
          <CardDescription className="text-body">
            Monthly voice agent call volume showing consistent growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={callsData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  className="text-sm text-muted-foreground"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-sm text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{
                    fill: "hsl(var(--primary))",
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}