import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await dbConnect();

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });

    const token = signToken({ userId: String(user._id), email: user.email });

    const res = NextResponse.json(
      { ok: true, user: { id: String(user._id), email: user.email, name: user.name } },
      { status: 201 }
    );

    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
    } catch (e: any) {
    console.error("REGISTER_ERROR", e);

    // Частые кейсы:
    if (e?.code === 11000) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    if (e?.name === "MongoServerSelectionError") {
      return NextResponse.json({ error: "DB connection failed (check Atlas Network Access / URI)" }, { status: 500 });
    }

    if (e?.message?.toLowerCase?.().includes("jwt")) {
      return NextResponse.json({ error: "JWT error (check JWT_SECRET env var)" }, { status: 500 });
    }

    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }

}
