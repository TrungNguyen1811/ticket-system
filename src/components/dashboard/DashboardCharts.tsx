import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, BarChart, DonutChart, LineChart, Metric, Text } from "@tremor/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { 
  Calendar, 
  BarChart2, 
  LineChart as LineChartIcon, 
  PieChart, 
  Activity, 
  AreaChart as AreaChartIcon,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/dashboard.service"
import { AdminStats, DashboardSummary, UserStats } from "@/types/dashboard"
import { DataResponse, Response } from "@/types/reponse"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

interface ChartData {
  name: string
  value: number
}

interface TimeSeriesData {
  date: string
  tickets: number
  resolved: number
  inProgress: number
}

interface StaffPerformanceData {
  name: string
  "Total Tickets": number
  "Resolved": number
  "In Progress": number
  "Avg. Resolution Time": number
}

interface ActivityData {
  day: string
  hour: string
  value: number
}

export function DashboardCharts() {
  const { user } = useAuth()
  const role = user?.role || "user"
  const isAdmin = role === "admin"

  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState<"today" | "last_7_days" | "last_month" | "this_month">("last_7_days")
  const [chartType, setChartType] = useState<"area" | "line">("area")
  const [showMetrics, setShowMetrics] = useState(true)
  const [loading, setLoading] = useState(false)

  const { data: summary, isLoading: isLoadingSummary } = useQuery<Response<DataResponse<DashboardSummary>>, Error>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary(),
  })

  const { data: userStats, isLoading: isLoadingUserStats } = useQuery<Response<DataResponse<UserStats>>, Error>({
    queryKey: ["dashboard", "user-stats", timeRange],
    queryFn: () => dashboardService.getUserStats({ range: timeRange }),
  })

  const { data: adminStats, isLoading: isLoadingAdminStats } = useQuery<Response<DataResponse<AdminStats>>, Error>({
    queryKey: ["dashboard", "admin-stats", timeRange],
    queryFn: () => dashboardService.getAdminStats({ range: timeRange }),
    enabled: isAdmin, // Only fetch admin stats if user is admin
  })

  if (isLoadingSummary || isLoadingUserStats || (isAdmin && isLoadingAdminStats)) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Process data for charts based on role
  const statusData: ChartData[] = [
    { name: "New", value: summary?.data.data.as_holder.new || 0 },
    { name: "In Progress", value: summary?.data.data.as_holder.in_progress || 0 },
    { name: "Complete", value: summary?.data.data.as_holder.complete || 0 },
  ]

  const doneTickets = summary?.data.data.as_holder.complete || 0
  const totalTickets = summary?.data.data.as_holder.total || 0

  // Get time series data based on role
  const timeSeriesData: TimeSeriesData[] = isAdmin 
    ? adminStats?.data.data.time_series || []
    : userStats?.data.data.time_series || []

  // Get staff performance data only for admin
  const staffPerformanceData: StaffPerformanceData[] = isAdmin 
    ? adminStats?.data.data.staff_performance || []
    : []

  // Get activity data based on role
  const activityData: ActivityData[] = isAdmin
    ? adminStats?.data.data.activity || []
    : userStats?.data.data.activity || []

  const handleRefresh = () => {
    setLoading(true)
    // Simulate data refresh
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Data refreshed",
        description: "Dashboard data has been updated successfully.",
      })
    }, 1000)
  }

  const handleExport = (format: "csv" | "json") => {
    const data = {
      statusData,
      timeSeriesData,
      ...(isAdmin && { staffPerformanceData }),
      activityData,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dashboard-data-${new Date().toISOString()}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `Dashboard data has been exported as ${format.toUpperCase()}.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: "today" | "last_7_days" | "last_month" | "this_month") => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === "area" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("area")}
            >
              <AreaChartIcon className="h-4 w-4 mr-2" />
              Area
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
            >
              <LineChartIcon className="h-4 w-4 mr-2" />
              Line
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            {showMetrics ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Metrics
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Metrics
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {showMetrics && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <Metric>Total Tickets</Metric>
              <Text>Across all statuses</Text>
              <div className="mt-2 text-2xl font-bold text-blue-600">
                {totalTickets}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Metric>Resolution Rate</Metric>
              <Text>Last 30 days</Text>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {Math.round((doneTickets / totalTickets) * 100)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Metric>Avg. Resolution Time</Metric>
              <Text>Last 30 days</Text>
              <div className="mt-2 text-2xl font-bold text-yellow-600">
                {userStats?.data.data.as_holder.avg.avg_hms || "0h 0m"}
              </div>
            </CardContent>
          </Card>
          {isAdmin && (
            <Card>
              <CardContent className="p-6">
                <Metric>Active Staff</Metric>
                <Text>Currently assigned</Text>
                <div className="mt-2 text-2xl font-bold text-purple-600">
                  {adminStats?.data.data.active_staff || 0}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Tickets by Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Tickets by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <DonutChart
                className="h-72"
                data={statusData}
                category="value"
                index="name"
                colors={["blue", "green", "yellow"]}
                showAnimation={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ticket Volume Over Time */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Ticket Volume Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartType === "area" ? (
              <AreaChart
                className="h-72"
                data={timeSeriesData}
                index="date"
                categories={["tickets", "resolved", "inProgress"]}
                colors={["blue", "green", "yellow"]}
                showAnimation={true}
              />
            ) : (
              <LineChart
                className="h-72"
                data={timeSeriesData}
                index="date"
                categories={["tickets", "resolved", "inProgress"]}
                colors={["blue", "green", "yellow"]}
                showAnimation={true}
              />
            )}
          </CardContent>
        </Card>

        {/* Staff Performance - Only show for admin */}
        {isAdmin && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                className="h-72"
                data={staffPerformanceData}
                index="name"
                categories={["Total Tickets", "Resolved", "In Progress"]}
                colors={["blue", "green", "yellow"]}
                showAnimation={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Ticket Activity */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Ticket Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              className="h-72"
              data={activityData}
              index="hour"
              categories={["value"]}
              colors={["blue"]}
              showAnimation={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 