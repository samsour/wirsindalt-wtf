import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

export async function Nav() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-12 py-5">
      <Link href="/" className="flex items-center gap-2 font-serif italic text-[22px] font-medium tracking-tight text-ink">
        <BrandMark />
        Vennwhen
      </Link>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <Link href="/dashboard" className="label hover:text-ink">Dashboard</Link>
            <span className="text-sm text-ink-muted">{session.user.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="btn-secondary">Sign out</button>
            </form>
          </>
        ) : (
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
            <button type="submit" className="btn-primary">Sign in with Google →</button>
          </form>
        )}
      </div>
    </nav>
  );
}

function BrandMark() {
  return (
    <span className="relative inline-block w-[22px] h-[14px]">
      <span className="absolute left-0 top-0 w-[14px] h-[14px] rounded-full border-[1.5px] border-ink" />
      <span className="absolute right-0 top-0 w-[14px] h-[14px] rounded-full border-[1.5px] border-ink bg-ink/10" />
    </span>
  );
}
