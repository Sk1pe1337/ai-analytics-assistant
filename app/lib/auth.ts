import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

export type TokenPayload = {
  userId: string;
  email: string;
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }

  const payload = decoded as JwtPayload & Partial<TokenPayload>;

  if (!payload.userId || !payload.email) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: String(payload.userId),
    email: String(payload.email),
  };
}
