import api from "@/lib/axios"
import { Response, DataResponse } from "@/types/reponse"
import { Attachment } from "@/types/ticket"

class AttachmentService {

    async getAttachments(ticketId: string): Promise<Response<Attachment[]>> {
        try {
          const response = await api.get(`/tickets/${ticketId}/attachments`)
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