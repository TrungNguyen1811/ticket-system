"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Building2, Eye, MessageCircle } from "lucide-react"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { mockClients, mockTickets } from "@/mock/data"
import { formatDate } from "@/lib/utils"


export default function ClientDetail() {
  const { id } = useParams()
  const client = mockClients.find((client) => client.id === id)
  console.log(client)
  const tickets = mockTickets.filter((ticket) => ticket.client_id === client?.id)

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
          <p className="text-gray-600 text-sm">{tickets.length} tickets</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
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
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {ticket.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <UserAvatar
                      name={ticket.assignee_id}
                      size="sm"
                    />
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
                        <Button variant="outline" size="sm" className="hover:bg-indigo-600 hover:text-white">
                          <MessageCircle className="h-4 w-4" />
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
