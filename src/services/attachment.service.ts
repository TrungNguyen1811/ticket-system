import api from "@/lib/axios"
import { Response, DataResponse } from "@/types/reponse"
import { Attachment } from "@/types/ticket"

export type AttachmentFormData = FormData

class AttachmentService {

    async getAttachments(ticketId: string): Promise<Response<Attachment[]>> {
        try {
          const response = await api.get(`/tickets/${ticketId}/attachments`)
          return response.data
        } catch (error) {
          throw error
        }
    }

    async uploadAttachment(ticketId: string, formData: AttachmentFormData): Promise<Response<Attachment[]>> {
        try {
            const response = await api.post(`/tickets/${ticketId}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        } catch (error) {
            throw error
        }
    }
      
    async downloadAttachment(attachmentId: string): Promise<Blob> {
        try {
            const response = await api.get(`/attachments/${attachmentId}`, {
                responseType: 'blob'
            })
            return response.data
        } catch (error) {
            throw error
        }
    }

    async deleteAttachment(attachmentId: string): Promise<Response<DataResponse<boolean>>> {
        try {
            const response = await api.delete(`/attachments/${attachmentId}`)
            return response.data
        } catch (error) {
            throw error
        }
    }

}

export default new AttachmentService()