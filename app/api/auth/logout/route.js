import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // 1. Delete standard session cookies
    cookieStore.delete("crown_session");
    cookieStore.delete("fineops_role");
    cookieStore.delete("fineops_user_id");

    // 2. Clear all other cookies in the request
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name);
      cookieStore.set({
        name: cookie.name,
        value: "",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // 3. Explicitly overwrite crown_session with maxAge: 0 and expired date
    cookieStore.set({
      name: "crown_session",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    cookieStore.set({
      name: "fineops_role",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    cookieStore.set({
      name: "fineops_user_id",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully. All browser session data cleared.",
      },
      { status: 200 }
    );

    // Standard W3C header instructing browser to wipe storage, cookies & cache
    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
