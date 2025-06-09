"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockTickets, mockUsers, mockClients } from "@/mock/data"
import { formatDate } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Ticket, TrendingUp, Building2, Eye } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardCharts } from "@/components/dashboard/DashboardCharts"

export default function Dashboard() {
  const { user } = useAuth()
  const openTickets = mockTickets.filter((t) => t.status === "Open").length
  const inProgressTickets = mockTickets.filter((t) => t.status === "In Progress").length
  const doneTickets = mockTickets.filter((t) => t.status === "Done").length
  const recentTickets = mockTickets.slice(0, 5)

  const stats = [
    {
      title: "Open Tickets",
      value: openTickets,
      icon: Ticket,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "In Progress",
      value: inProgressTickets,
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Completed",
      value: doneTickets,
      icon: Ticket,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Clients",
      value: mockClients.length,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const getUserName = (userId: string) => {
    return mockUsers.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getClientName = (clientId: string) => {
    return mockClients.find((c) => c.id === clientId)?.name || "Unknown"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.name}! Here's your ticket management overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tickets</CardTitle>
            <Button asChild variant="outline">
              <Link to="/tickets">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>{getClientName(ticket.client_id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <UserAvatar name={getUserName(ticket.staff_id)} size="sm" />
                      <span className="text-sm">{getUserName(ticket.staff_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(ticket.updated_at)}</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/tickets/${ticket.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
