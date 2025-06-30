import { Attachment } from "./ticket";

export interface Mail {
  id: string;
  from_name: string;
  from_email: string;
  subject: string;
  body: string;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

export type MailFormData = FormData;
