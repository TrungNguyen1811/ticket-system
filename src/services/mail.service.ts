import api from "@/lib/axios"
import { DataResponse, Response } from "@/types/reponse"
import { Mail, MailFormData } from "@/types/mail"

class MailService {
    async getMails(ticketId: string): Promise<Response<DataResponse<Mail[]>>> {  
        const response = await api.get(`/tickets/${ticketId}/mails`)
        return response.data
    }

    async createMail(ticketId: string, formData: MailFormData): Promise<Response<Mail>> {
        const response = await api.post(`/tickets/${ticketId}/mails`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }

}

export const mailService = new MailService()    