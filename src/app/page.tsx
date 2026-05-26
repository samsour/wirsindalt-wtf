import Link from "next/link";
import { auth, signIn } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <>
      <section className="mx-auto max-w-[1120px] grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-20 px-12 pt-24 pb-20 items-center">
        <div>
          <div className="eyebrow mb-7 inline-flex items-center gap-2.5">
            <span className="w-6 h-px bg-ink-muted inline-block" />
            Group scheduling, minus the chaos
          </div>
          <h1 className="font-serif font-normal text-[clamp(48px,6vw,84px)] leading-none tracking-[-0.035em] mb-7">
            Find the <em className="italic text-accent font-medium">when</em><br />
            in everyone&apos;s<br />
            calendar.
          </h1>
          <p className="text-lg text-ink-muted max-w-[460px] mb-10 leading-relaxed">
            Connect your calendars privately. See the overlap, not the details. Stop polling your friends in group chats — let the math do it.
          </p>
          <div className="flex gap-3 items-center">
            {session?.user ? (
              <Link href="/dashboard" className="btn-primary">
                Create a group <span>→</span>
              </Link>
            ) : (
              <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
                <button type="submit" className="btn-primary">Create a group →</button>
              </form>
            )}
            <button className="btn-secondary">See how it works</button>
          </div>
        </div>
        <HeroVisual />
      </section>

      <section className="border-y border-line px-12 py-12">
        <div className="mx-auto max-w-[1120px] grid grid-cols-1 md:grid-cols-3 gap-16">
          <FeatureItem
            num="01"
            title="Private by design"
            body="We only see busy/free time — never event titles, locations, or details. Your calendar stays yours."
          />
          <FeatureItem
            num="02"
            title="One link, no polling"
            body="Share an invite. Friends connect their calendar. The overlap renders itself. No spreadsheets, no group chats."
          />
          <FeatureItem
            num="03"
            title="Find the maybes"
            body="Surface near-misses where only one person is busy. Sometimes a small ask unlocks the whole evening."
          />
        </div>
      </section>
    </>
  );
}

function FeatureItem({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div>
      <div className="font-serif italic text-[32px] text-accent leading-none mb-5">{num}</div>
      <h3 className="font-serif font-medium text-[19px] mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative aspect-square max-w-[480px] ml-auto">
      <div className="absolute top-[8%] left-[8%] w-[60%] h-[60%] rounded-full border-[1.5px] border-ink bg-accent-soft mix-blend-multiply" />
      <div className="absolute top-[8%] right-[8%] w-[60%] h-[60%] rounded-full border-[1.5px] border-ink bg-warm-soft mix-blend-multiply" />
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] rounded-full border-[1.5px] border-ink bg-[#F5F0DD] mix-blend-multiply" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] text-center">
        <div className="font-serif italic text-[28px] text-ink">when?</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mt-1">the overlap</div>
      </div>
    </div>
  );
}
