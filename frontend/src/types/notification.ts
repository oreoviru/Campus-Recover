/**
 * Campus Recover — Notification Type Definitions
 */

import { NotificationType } from "./common";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_item_id?: string;
  related_match_id?: string;
  read: boolean;
  created_at: string;
}
