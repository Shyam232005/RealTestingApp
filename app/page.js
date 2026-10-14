"use client"
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      By pass signup and login directly into app
      <Link href="/owner">Owner</Link>
      <Link href="/deparments">Deparments</Link>
    </div>
  );
}
