import api from "@/lib/axios";
import {
  DataComment,
  DataUpdateComment,
  ParamsComment,
  CommentFormData,
} from "@/types/comment";
import { Response, DataResponse } from "@/types/reponse";
import { Comment } from "@/types/comment";

class CommentService {
  async getCommentsTicket(
    ticketId: string,
    params?: ParamsComment,
  ): Promise<Response<DataResponse<Comment[]>>> {
    try {
      const response = await api.get(`/tickets/${ticketId}/comments`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createComment(
    ticketId: string,
    formData: CommentFormData,
  ): Promise<Response<Comment>> {
    try {
      const response = await api.post(
        `/tickets/${ticketId}/comments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateComment(
    commentId: string,
    formData: CommentFormData,
  ): Promise<Response<Comment>> {
    try {
      const response = await api.post(`/comments/${commentId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteComment(
    commentId: string,
  ): Promise<Response<DataResponse<Comment>>> {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const commentService = new CommentService();
