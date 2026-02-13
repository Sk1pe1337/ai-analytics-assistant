import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { User } from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    const token = m?.[1];

    if (!token) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    const payload = verifyToken(token);

    await dbConnect();
    const user = await User.findById(payload.userId).lean();

    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    return NextResponse.json(
      {
        ok: true,
        user: { id: String(user._id), email: user.email, name: user.name ?? "" },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
}
