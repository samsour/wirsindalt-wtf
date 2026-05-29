import { auth, signIn } from "@/lib/auth";

export async function Footer() {
  const session = await auth();

  return (
    <footer className="border-t border-line mt-16 px-8 py-6 flex justify-center">
      {!session?.user ? (
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
          <button type="submit" className="font-mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink-muted transition">
            Wenn du coden kannst, kannst du hier gerne drauf klicken.
          </button>
        </form>
      ) : null}
    </footer>
  );
}
