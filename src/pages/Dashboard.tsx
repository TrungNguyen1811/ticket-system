"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TicketStatusDisplay } from "@/components/shared/StatusBadge";
import {
  MessageSquare,
  TrendingUp,
  Building2,
  Eye,
  User,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useQuery } from "@tanstack/react-query";
import { ticketService } from "@/services/ticket.service";
import { DataResponse, Response } from "@/types/response";
import { Ticket } from "@/types/ticket";
import { DashboardSummary } from "@/types/dashboard";
import { dashboardService } from "@/services/dashboard.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type RoleData = {
  total: number;
  new: number;
  in_progress: number;
  complete: number;
};

type UserRoleData = {
  holder: RoleData | undefined;
  staff: RoleData | undefined;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Enhanced Stat Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  trend,
  trendValue,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
  trend?: "up" | "down";
  trendValue?: string;
}) => (
  <motion.div
    variants={itemVariants}
    className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {trend && trendValue && (
          <div className="mt-2 flex items-center gap-1">
            {trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                trend === "up" ? "text-green-500" : "text-red-500",
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className={cn("rounded-full p-3", bgColor)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
    </div>
    <div
      className={cn(
        "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-50",
        bgColor,
      )}
    />
  </motion.div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: summary } = useQuery<Response<DashboardSummary>, Error>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary(),
  });

  const getRoleData = (): RoleData | UserRoleData => {
    if (isAdmin) {
      return (
        summary?.data.as_admin || {
          total: 0,
          new: 0,
          in_progress: 0,
          complete: 0,
        }
      );
    }
    return {
      holder: summary?.data.as_holder,
      staff: summary?.data.as_staff,
    };
  };

  const roleData = getRoleData();

  const { data: recentTickets } = useQuery<
    Response<DataResponse<Ticket[]>>,
    Error
  >({
    queryKey: ["dashboard", "recent-tickets"],
    queryFn: () =>
      ticketService.getTickets({ limit: 5, page: 1, status: "new" }),
  });

  const getStats = (data: RoleData | undefined) => [
    {
      title: "Open Tickets",
      value: data?.new || 0,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "up" as const,
      // trendValue: "12% from last week"
    },
    {
      title: "In Progress",
      value: data?.in_progress || 0,
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      trend: "up" as const,
      // trendValue: "8% from last week"
    },
    {
      title: "Completed",
      value: data?.complete || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "up" as const,
      // trendValue: "15% from last week"
    },
    {
      title: "Total Tickets",
      value: data?.total || 0,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "up" as const,
      // trendValue: "10% from last week"
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 p-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.name}! Here's your ticket management overview.
        </p>
      </motion.div>

      {isAdmin ? (
        // Admin Dashboard
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {getStats(roleData as RoleData).map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Charts Section */}
          <motion.div variants={itemVariants}>
            <DashboardCharts />
          </motion.div>
        </>
      ) : (
        // User Dashboard
        <Tabs defaultValue="holder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="holder" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holder" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {getStats((roleData as UserRoleData).holder).map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            {/* Charts Section */}
            <motion.div variants={itemVariants}>
              <DashboardCharts />
            </motion.div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {getStats((roleData as UserRoleData).staff).map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            {/* Charts Section */}
            <motion.div variants={itemVariants}>
              <DashboardCharts />
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      {/* Recent Tickets */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tickets</CardTitle>
              <Button asChild variant="outline">
                <Link to="/tickets">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
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
                  {recentTickets?.data?.data.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        {ticket.title}
                      </TableCell>
                      <TableCell>{ticket.client_email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <UserAvatar
                            name={ticket.staff?.name || "Unknown"}
                            size="sm"
                          />
                          <span className="text-sm">
                            {ticket.staff?.name || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TicketStatusDisplay status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(ticket.updated_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Link to={`/tickets/${ticket.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
