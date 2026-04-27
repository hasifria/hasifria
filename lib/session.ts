import { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
  pendingPhone?: string;
  pendingName?: string;
  pendingAddress?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "hasifria-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
