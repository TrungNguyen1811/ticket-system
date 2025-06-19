"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Building2, Eye, MessageCircle, Loader2 } from "lucide-react"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { mockClients, mockTickets } from "@/mock/data"
import { formatDate } from "@/lib/utils"
import { userService } from "@/services/user.service"
import { useQuery } from "@tanstack/react-query"


export default function ClientDetail() {
  const { id } = useParams()
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => userService.getClients(),
  })

  const client = clients?.data?.data?.find((client) => client.id === id)
  console.log("client", client)

  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["tickets", id],
    queryFn: () => userService.getTicketsClient(id || ""),
  })

  if (isLoading || isLoadingTickets) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <UserAvatar
            name={client?.name || ""}
            size="xl"
          />
          <div>
            <p className="text-gray-600 text-lg font-bold ">{client?.name}</p>
            <p className="text-gray-600 text-sm">{client?.email}</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 text-sm">{tickets?.data?.data?.length} tickets</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Holder</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.data?.data?.map((ticket) => (
                <TableRow key={ticket.id}>
                  <Link to={`/tickets/${ticket.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{ticket.title}</div>
                          <div className="text-gray-600 text-sm">{ticket.id}</div>
                        </div>
                      </div>
                    </TableCell>
                  </Link>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {ticket.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                    <UserAvatar
                      name={ticket.holder?.name || ""}
                      size="sm"
                      />
                      <p className="text-gray-600 text-sm">{ticket.holder?.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(ticket.created_at)}
                  </TableCell>
                  <TableCell>
                    {formatDate(ticket.updated_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link to={`/tickets/${ticket.id}`} className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="hover:bg-indigo-600 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/communication/conversation/${ticket.id}`} className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 hover:text-indigo-600" />
                        </Button>
                      </Link>
                    </div>
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
