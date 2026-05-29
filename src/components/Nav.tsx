import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function Nav() {
  const session = await auth();
  const isAdmin = !!ADMIN_EMAIL && session?.user?.email === ADMIN_EMAIL;

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-8 py-4">
      <Link href="/" className="font-serif italic text-[20px] font-medium tracking-tight text-ink">
        wirsindalt<span className="text-accent">.wtf</span>
      </Link>
      <div className="flex items-center gap-3">
        {isAdmin ? (
          <>
            <Link href="/dashboard" className="label hover:text-ink">Admin</Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="btn-secondary">Abmelden</button>
            </form>
          </>
        ) : (
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
            <button type="submit" className="label text-ink-muted hover:text-ink transition">
              Admin →
            </button>
          </form>
        )}
      </div>
    </nav>
  );
}
