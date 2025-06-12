"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/dashboard.service"
import type { AdminStats, DashboardSummary, UserStats, StaffPerformance } from "@/types/dashboard"
import { useAuth } from "@/contexts/AuthContext"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { DataResponse, Response } from "@/types/reponse"
import { AreaChart, BarChart, DonutChart, Title, LineChart, Metric, Text } from "@tremor/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Download, RefreshCw, BarChartIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AreaChartIcon, LineChartIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "../ui/use-toast"
import { ticketService } from "@/services/ticket.service"
import { Ticket } from "@/types/ticket"
import { userService } from "@/services/user.service"
import { User } from "@/types/user"

interface ChartData {
  name: string
  value: number
}

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_month", label: "Last Month" },
  { value: "this_month", label: "This Month" }
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function DashboardCharts() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [timeRange, setTimeRange] = useState("last_7_days")
  const [chartType, setChartType] = useState("area")
  const [showMetrics, setShowMetrics] = useState(true)
  const [loading, setLoading] = useState(false)

  const { data: summary, isLoading: isLoadingSummary } = useQuery<Response<DashboardSummary>, Error>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary(),
  })

  const { data: adminStats, isLoading: isLoadingAdminStats } = useQuery<Response<AdminStats>, Error>({
    queryKey: ["dashboard", "admin-stats", timeRange],
    queryFn: () => dashboardService.getAdminStats({ range: timeRange as "today" | "last_7_days" | "last_month" | "this_month" }),
    enabled: isAdmin,
  })

  const { data: userStats, isLoading: isLoadingUserStats } = useQuery<Response<UserStats>, Error>({
    queryKey: ["dashboard", "user-stats", timeRange],
    queryFn: () => dashboardService.getUserStats({ range: timeRange as "today" | "last_7_days" | "last_month" | "this_month" }),
    enabled: !isAdmin,
  })

  const { data: tickets, isLoading: isLoadingTickets } = useQuery<Response<DataResponse<Ticket[]>>, Error>({
    queryKey: ["dashboard", "tickets"],
    queryFn: () => ticketService.getTickets(),
  })

  const { data: users, isLoading: isLoadingUsers } = useQuery<Response<DataResponse<User[]>>, Error>({
    queryKey: ["dashboard", "users"],
    queryFn: () => userService.getUsers({
      isPaginate: false,
    }),
    enabled: isAdmin,
  })

  if (isLoadingSummary || isLoadingAdminStats || isLoadingUserStats || isLoadingTickets || isLoadingUsers) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-4 w-[120px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Get data based on user role
  const getRoleData = () => {
    if (isAdmin) {
      return summary?.data.as_admin
    }
    return summary?.data.as_holder
  }

  const roleData = getRoleData()

  const statusData: ChartData[] = [
    { name: "New", value: roleData?.new || 0 },
    { name: "In Progress", value: roleData?.in_progress || 0 },
    { name: "Complete", value: roleData?.complete || 0 },
  ]

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
    // TODO: Implement export functionality
    toast({
      title: "Export not implemented",
      description: `Export as ${format.toUpperCase()} is not implemented yet.`,
    })
  }

  // Transform staff performance data for the chart
  const staffPerformanceData = adminStats?.data.staff_performance?.map((staff: StaffPerformance[0]) => ({
    name: staff.name,
    "Total Tickets": staff.total_tickets,
    "Resolved": staff.resolved,
    "In Progress": staff.in_progress
  })) || []

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))} 
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

      <h2 className="text-2xl font-bold">Key Metrics</h2>
      {showMetrics && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <Metric>Total Tickets</Metric>
              <Text>Across all statuses</Text>
              <div className="mt-2 text-2xl font-bold text-blue-600">
                {roleData?.total}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Metric>Resolution Rate</Metric>
              <Text>Last 30 days</Text>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {Math.round((roleData?.complete || 0) / (roleData?.total || 1) * 100)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Metric>Avg. Resolution Time</Metric>
              <Text>Last 30 days</Text>
              <div className="mt-2 text-2xl font-bold text-yellow-600">
                {isAdmin ? adminStats?.data.avg.avg_hms : userStats?.data.as_holder.avg.avg_hms}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Metric>Total Resolution Time</Metric>
              <Text>Last 30 days</Text>
              <div className="mt-2 text-2xl font-bold text-yellow-600">
                {isAdmin ? adminStats?.data.avg.avg_seconds : userStats?.data.as_holder.avg.avg_seconds}
              </div>
            </CardContent>
          </Card>
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
            <DonutChart
              className="h-72"
              data={statusData}
              category="value"
              index="name"
              colors={["blue", "yellow", "green"]}
              showAnimation={true}
            />
          </CardContent>
        </Card>

        {/* Ticket Volume Over Time */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AreaChartIcon className="h-5 w-5 mr-2" />
              Ticket Volume Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartType === "area" ? (
              <AreaChart
                className="h-72"
                data={isAdmin ? adminStats?.data.stat || [] : userStats?.data.as_holder.stat || []}
                index="date"
                categories={["total", "new", "in_progress", "complete"]}
                colors={["blue", "green", "yellow", "red"]}
                showAnimation={true}
              />
            ) : (
              <LineChart
                className="h-72"
                data={isAdmin ? adminStats?.data.stat || [] : userStats?.data.as_holder.stat || []}
                index="date"
                categories={["total", "new", "in_progress", "complete"]}
                colors={["blue", "green", "yellow", "red"]}
                showAnimation={true}
              />
            )}
          </CardContent>
        </Card>

        {/* Staff Performance - Only show for admin */}
        {isAdmin && staffPerformanceData.length > 0 && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="h-5 w-5 mr-2" />
                Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={staffPerformanceData}
                index="name"
                categories={["Total Tickets", "Resolved", "In Progress"]}
                colors={["blue", "green", "yellow"]}
                showAnimation={true}
                className="h-72"
              />
            </CardContent>
          </Card>
        )}

        {/* <Card className="col-span-full">
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
        </Card> */}
      </div>
    </div>
  )
} 