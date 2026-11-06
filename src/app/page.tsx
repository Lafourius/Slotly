import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  MessageSquareOff,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Globe2,
    title: "A booking page that feels like you",
    body: "Your services, your hours, your link. Customers book in under a minute without downloading anything.",
  },
  {
    icon: Clock3,
    title: "Availability that actually holds",
    body: "Working hours, breaks and buffer time are checked on the server. No double bookings, even when two people tap at once.",
  },
  {
    icon: BadgeCheck,
    title: "You decide how bookings land",
    body: "Take bookings automatically, or review each request before it becomes an appointment.",
  },
  {
    icon: Users,
    title: "Customer history, without a CRM",
    body: "See who booked before, what’s coming up and how often they visit — all in one simple list.",
  },
  {
    icon: CalendarDays,
    title: "Day, week and list views",
    body: "Run your day from the calendar, or scan the week when you plan ahead. Same data, no spreadsheets.",
  },
  {
    icon: Smartphone,
    title: "Designed for the phone in your hand",
    body: "Every screen is built mobile-first, because that’s where your customers and your day actually happen.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
        <div className="page-shell flex h-16 items-center justify-between">
          <Brand />
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-ink">
              Features
            </a>
            <a href="#tutors" className="transition-colors hover:text-ink">
              For tutors
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/register">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-4 size-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(22,166,160,0.14),transparent_65%)]"
          />
          <div className="page-shell grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-24">
            <div className="animate-in-up">
              <Badge tone="accent" className="mb-5">
                <Sparkles className="size-3" aria-hidden="true" />
                Built for independent businesses
              </Badge>
              <h1 className="max-w-[560px] text-[38px] font-semibold leading-[1.06] tracking-[-0.035em] text-navy sm:text-[52px]">
                One link.
                <br />
                Every booking.
                <span className="text-accent"> No back-and-forth.</span>
              </h1>
              <p className="mt-5 max-w-[480px] text-[15px] leading-7 text-muted sm:text-[16px]">
                Slotly gives tutors and small businesses a professional booking
                page and one calm dashboard. Customers pick a time, you get the
                booking. No account needed on their side.
              </p>
              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Create your booking page
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted">
                {[
                  "Free during the pilot",
                  "No customer app",
                  "No payment gateway needed",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-[440px] lg:mx-0">
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-8 h-[92%] rounded-[28px] border border-line bg-white/55"
              />
              <div className="relative rounded-[22px] border border-line bg-surface p-5 shadow-float sm:p-6">
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <div className="grid size-10 place-items-center rounded-xl bg-navy text-[13px] font-bold text-white">
                    BT
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-navy">
                      Bright Tuition
                    </p>
                    <p className="text-[11.5px] text-muted">
                      Mathematics &amp; science tutoring · Bengaluru
                    </p>
                  </div>
                  <span className="ml-auto hidden rounded-full bg-success-soft px-2 py-1 text-[10px] font-semibold text-success sm:block">
                    Taking bookings
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft/60 p-3">
                  <p className="text-[12.5px] font-semibold text-navy">
                    Mathematics consultation
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    30 min · ₹499 · Online or in person
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Choose a date
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {[
                      { day: "Fri", date: "9" },
                      { day: "Sat", date: "10", active: true },
                      { day: "Sun", date: "11" },
                      { day: "Mon", date: "12" },
                    ].map((item) => (
                      <div
                        key={item.date}
                        className={
                          item.active
                            ? "rounded-lg border border-navy bg-navy py-2 text-center text-white"
                            : "rounded-lg border border-line bg-surface py-2 text-center text-muted"
                        }
                      >
                        <p className="text-[10px] font-medium">{item.day}</p>
                        <p className="text-[14px] font-semibold">{item.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Available times
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {["9:00 am", "9:30 am", "10:00 am", "10:30 am", "11:00 am"].map(
                      (time) => (
                        <div
                          key={time}
                          className={
                            time === "10:00 am"
                              ? "rounded-lg border border-accent bg-accent py-2 text-center text-[11.5px] font-semibold text-white"
                              : "rounded-lg border border-line bg-surface py-2 text-center text-[11.5px] font-medium text-muted"
                          }
                        >
                          {time}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-3 py-2.5">
                  <p className="text-[11px] text-muted">Selected</p>
                  <p className="text-[11.5px] font-semibold text-ink">
                    Sat 10 Jan · 10:00 am
                  </p>
                </div>
                <div className="mt-2 flex h-10 items-center justify-center rounded-lg bg-navy text-[12.5px] font-semibold text-white">
                  Confirm booking
                </div>
              </div>

              <div className="absolute -left-3 bottom-16 hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-float sm:flex">
                <span className="grid size-7 place-items-center rounded-full bg-success-soft text-success">
                  <CalendarCheck2 className="size-3.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    Booking confirmed
                  </p>
                  <p className="text-[10px] text-muted">Added to your calendar</p>
                </div>
              </div>
              <p className="mt-4 text-center text-[10.5px] text-muted lg:text-left">
                Illustrative product preview
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="page-shell grid gap-6 py-10 sm:grid-cols-3">
            {[
              {
                icon: MessageSquareOff,
                title: "Stop chasing messages",
                body: "No more “is 4pm still free?” threads across three apps.",
              },
              {
                icon: ShieldCheck,
                title: "Never double-book",
                body: "Every slot is checked against your real calendar before it’s offered.",
              },
              {
                icon: Sparkles,
                title: "Look established",
                body: "A clean booking page that makes a one-person business feel professional.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-accent-strong">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-semibold text-navy">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-5 text-muted">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="page-shell scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
              How it works
            </p>
            <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-navy sm:text-[36px]">
              Set up once. Book all week.
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-muted">
              Fifteen minutes of setup, then your calendar runs itself. No new
              tools to learn and nothing for your customers to install.
            </p>
          </div>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Describe your business",
                body: "Name, services, durations and prices. Slotly turns it into a booking page at a link you choose.",
              },
              {
                step: "02",
                title: "Set your real hours",
                body: "Working days, breaks and time off. Add buffer time between appointments if you need a breather.",
              },
              {
                step: "03",
                title: "Share one link",
                body: "Post it on WhatsApp, Instagram or your website. Customers pick a time and you manage it from the dashboard.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="rounded-card border border-line bg-surface p-6 shadow-card"
              >
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-navy px-2 text-[11px] font-bold tracking-wide text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="scroll-mt-20 bg-surface py-16 sm:py-20">
          <div className="page-shell">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
                Everything you need
              </p>
              <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-navy sm:text-[36px]">
                A small product, deliberately.
              </h2>
              <p className="mt-3 text-[14px] leading-7 text-muted">
                No payments, no marketplace, no feature bloat. Just the parts
                that help you take and manage bookings reliably.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-card border border-line bg-canvas/60 p-5"
                >
                  <span className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-accent-strong">
                    <feature.icon className="size-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3.5 text-[14px] font-semibold text-navy">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-6 text-muted">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tutors" className="page-shell scroll-mt-20 py-16 sm:py-20">
          <div className="overflow-hidden rounded-[24px] bg-navy px-6 py-10 text-white sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Starting with tutors
              </p>
              <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.03em] sm:text-[32px]">
                Built around how tutoring actually works.
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-7 text-white/65">
                Trial classes, back-to-back sessions, cancelled lessons and
                parents booking on their phone at 10pm. Slotly handles the
                scheduling so you can focus on teaching.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Button size="lg" variant="accent" asChild>
                  <Link href="/register">
                    Start with your first service
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
              {[
                "30, 45 or 60-minute lessons",
                "Buffer between back-to-back classes",
                "Approve requests before confirming",
                "Keep parent contact details in one place",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[12.5px] text-white/80"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="page-shell flex flex-col items-center gap-5 py-14 text-center sm:py-16">
            <h2 className="max-w-xl text-[26px] font-semibold tracking-[-0.03em] text-navy sm:text-[32px]">
              Your next booking could come from a link, not a chat.
            </h2>
            <p className="max-w-lg text-[13.5px] leading-6 text-muted">
              Create your booking page today and share it with one customer.
              That’s the whole setup.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Create your free booking page
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-canvas">
        <div className="page-shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="text-[12px] text-muted">
              Simple booking for small businesses.
            </span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-muted">
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-ink">
              Create account
            </Link>
            <span>Made for India first</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
