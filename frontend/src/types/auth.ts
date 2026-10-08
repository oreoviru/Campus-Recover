/**
 * Campus Recover — Auth Type Definitions
 */

import { UserRole } from "./common";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student_id?: string;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  student_id?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TokenPayload {
  sub: string;
  role: UserRole;
  exp: number;
}
