import api from "@/lib/axios"
import { DataComment, DataUpdateComment, ParamsComment } from "@/types/comment"
import { Response, DataResponse } from "@/types/reponse"
import { Comment } from "@/types/comment"

class CommentService {

async getCommentsTicket (ticketId: string, params?: ParamsComment): Promise<Response<DataResponse<Comment[]>>> {
    try {
        const response = await api.get(`/tickets/${ticketId}/comments`, { params })
        return response.data
    } catch (error) {
        throw error
    }
}


async createComment (ticketId: string, DataComment: DataComment): Promise<Response<DataResponse<Comment>>> {
        try {
            const formData = new FormData()
            formData.append("content", DataComment.content || "")

            if (DataComment.attachments) {
                DataComment.attachments.forEach((attachment) => {
                    // Sửa ở đây
                    formData.append("attachments", attachment)
                })
            }
            const response = await api.post(`/tickets/${ticketId}/comments`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            return response.data
        } catch (error) {
            throw error
        }
    } 
    
async updateComment (commentId: string, DataUpdateComment: DataUpdateComment): Promise<Response<DataResponse<Comment>>> {
    try {
        const response = await api.post(`/comments/${commentId}`, DataUpdateComment)
        return response.data
    } catch (error) {
        throw error
    }
}

async deleteComment (commentId: string): Promise<Response<DataResponse<Comment>>> {
    try {
        const response = await api.delete(`/comments/${commentId}`)
        return response.data
    } catch (error) {
        throw error
    }
}
}

export default new CommentService()