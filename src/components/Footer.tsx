import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function Footer() {
  const session = await auth();
  const isAdmin = !!ADMIN_EMAIL && session?.user?.email === ADMIN_EMAIL;

  return (
    <footer className="border-t border-line mt-16 px-8 py-6 flex justify-center gap-6">
      {isAdmin ? (
        <>
          <Link
            href="/dashboard"
            className="font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent/70 transition"
          >
            Admin-Modus · Dashboard →
          </Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button type="submit" className="font-mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink-muted transition">
              Abmelden
            </button>
          </form>
        </>
      ) : (
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
          <button type="submit" className="font-mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink-muted transition">
            Wenn du coden kannst, kannst du hier gerne drauf klicken.
          </button>
        </form>
      )}
    </footer>
  );
}
