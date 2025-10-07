import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/20/solid";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { copy } from "../content/copy";

const homeCopy = copy.home;
const featureCards = homeCopy.features.cards.map((card, index) => {
  const icons = [SparklesIcon, Squares2X2Icon, ChatBubbleBottomCenterTextIcon];
  return { ...card, icon: icons[index] ?? SparklesIcon };
});
const steps = homeCopy.steps.items;
const styleShowcase = homeCopy.styles.cards;
const testimonials = homeCopy.testimonials.cards;
const planVariantClasses: Record<
  string,
  { card: string; button: string }
> = {
  outline: {
    card:
      "flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-lg transition hover:border-white/20 hover:bg-white/10",
    button:
      "mt-auto inline-flex w-full justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/10",
  },
  primary: {
    card:
      "flex h-full flex-col rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-left shadow-lg",
    button:
      "mt-auto inline-flex w-full justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-slate-100",
  },
  accent: {
    card:
      "flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-lg transition hover:border-white/20 hover:bg-white/10",
    button:
      "mt-auto inline-flex w-full justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="flex w-full flex-col gap-24 pb-32 pt-16">
        <section
          id="product"
          className="relative isolate flex w-full flex-col items-center overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 py-20 shadow-2xl sm:py-24"
        >
          <div className="absolute inset-y-0 right-[10%] hidden h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-400/30 via-transparent to-transparent blur-3xl lg:block" />
          <div className="absolute inset-y-0 left-[6%] hidden h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/20 via-transparent to-transparent blur-3xl lg:block" />
          <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 lg:px-0">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {homeCopy.hero.badge}
                </span>
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {homeCopy.hero.title}
                </h1>
                <p className="text-base text-slate-300 sm:text-lg">
                  {homeCopy.hero.description}
                </p>
                <Link
                  href="/dream"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-10 py-5 text-lg font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  {homeCopy.hero.cta}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <div className="relative flex flex-col gap-6">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg backdrop-blur">
                  <Image
                    src="/original-pic.jpg"
                    alt="Original room"
                    width={420}
                    height={320}
                    className="h-64 w-full object-cover"
                  />
                  <div className="border-t border-white/10">
                    <Image
                      src="/generated-pic-2.jpg"
                      alt="RoomGPT redesign"
                      width={420}
                      height={320}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-300 lg:text-left">
                  {homeCopy.hero.comparisonCaption}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-32 px-4 sm:px-6">
          <section id="features" className="space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                {homeCopy.features.title}
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
                {homeCopy.features.subtitle}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-lg transition hover:border-white/20 hover:bg-white/10"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-emerald-300" />
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                {homeCopy.steps.title}
              </h2>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                {homeCopy.steps.description}
              </p>
              <ul className="space-y-5">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-300">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
              <Image
                src="/original-pic.jpg"
                alt="Room comparison"
                width={500}
                height={600}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-slate-100 backdrop-blur">
                {homeCopy.steps.overlayText}
              </div>
            </div>
          </section>

          <section id="styles" className="space-y-8">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                {homeCopy.styles.title}
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
                {homeCopy.styles.subtitle}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {styleShowcase.map((style) => (
                <figure
                  key={style.label}
                  className="group flex flex-col rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={style.image}
                      alt={style.label}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="mt-4 text-sm font-semibold text-white">
                    {style.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section id="pricing" className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                {homeCopy.pricing.title}
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                {homeCopy.pricing.subtitle}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {homeCopy.pricing.plans.map((plan) => {
                const variantClasses =
                  planVariantClasses[plan.variant ?? "outline"] ??
                  planVariantClasses.outline;
                return (
                  <div key={plan.title} className={variantClasses.card}>
                    <h3 className="text-lg font-semibold text-white">{plan.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {plan.description}
                    </p>
                    {plan.price ? (
                      <p className="mt-6 text-3xl font-semibold text-white">{plan.price}</p>
                    ) : null}
                    {plan.cadence ? (
                      <p className="text-xs text-slate-400">{plan.cadence}</p>
                    ) : null}
                    {plan.bullets ? (
                      <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                        {plan.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {plan.footnote ? (
                      <p className={`mt-6 text-xs ${plan.variant === "primary" ? "text-emerald-200" : "text-slate-400"}`}>
                        {plan.footnote}
                      </p>
                    ) : null}
                    <button className={variantClasses.button}>
                      {plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                {homeCopy.testimonials.title}
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                {homeCopy.testimonials.subtitle}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((testimonial, index) => {
                const isHighlight = index % 3 === 1;
                return (
                  <figure
                    key={`${testimonial.name}-${index}`}
                    className={`relative rounded-[28px] border bg-white/5 p-6 text-left shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                      isHighlight
                        ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-slate-900/60 to-slate-950"
                        : "border-white/10 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="absolute -top-10 left-6 h-20 w-20 rotate-6 rounded-3xl border border-white/10 bg-white/10 blur-2xl" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-emerald-300">
                        {Array.from({ length: 5 }).map((_, star) => (
                          <StarIcon key={star} className="h-4 w-4" />
                        ))}
                      </div>
                      <span className="text-4xl font-semibold text-white/10">“</span>
                    </div>
                    <blockquote className="mt-4 space-y-4">
                      <p className="text-sm leading-6 text-slate-200">“{testimonial.quote}”</p>
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-white/20">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                        <p className="text-xs text-slate-400">{testimonial.role}</p>
                      </div>
                    </figcaption>
                    <div className="pointer-events-none absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-10 bottom-0 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
                  </figure>
                );
              })}
            </div>
          </section>
        </div>

        <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-500 px-6 py-16 text-center">
          <div className="relative space-y-4">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              {homeCopy.cta.title}
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-white/80 sm:text-base">
              {homeCopy.cta.description}
            </p>
            <Link
              href="/dream"
              className="inline-flex items-center justify-center rounded-full bg-emerald-900/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {homeCopy.cta.button}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
