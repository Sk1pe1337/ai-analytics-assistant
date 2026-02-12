import { NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    return NextResponse.json({
      userId: payload.userId,
      email: payload.email
    });

  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
