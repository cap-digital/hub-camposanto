"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useHubReady } from "@/components/core/preloader";
import { SplitHeading } from "@/components/core/split-heading";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  tone: "dusk" | "copper" | "amber";
  image?: "none";
  kpis?: ReactNode;
  children?: ReactNode;
}

const TONES: Record<PageHeroProps["tone"], { text: string; rgb: string; glow: string }> = {
  dusk: { text: "var(--dusk-2, #7EA1D4)", rgb: "61,103,159", glow: "126,161,212" },
  copper: { text: "var(--copper, #C9694C)", rgb: "168,82,56", glow: "201,105,76" },
  amber: { text: "var(--amber, #E3A467)", rgb: "201,138,79", glow: "227,164,103" },
};

const PAGE_HERO_CSS = `
@keyframes hub-mesh-a{0%{transform:translate3d(-10%,-6%,0) scale(1)}100%{transform:translate3d(12%,10%,0) scale(1.22)}}
@keyframes hub-mesh-b{0%{transform:translate3d(8%,12%,0) scale(1.12)}100%{transform:translate3d(-12%,-6%,0) scale(.9)}}
@keyframes hub-mesh-c{0%{transform:translate3d(0,8%,0) scale(.95)}100%{transform:translate3d(-6%,-10%,0) scale(1.15)}}
.hub-mesh-a{animation:hub-mesh-a 19s ease-in-out infinite alternate}
.hub-mesh-b{animation:hub-mesh-b 23s ease-in-out infinite alternate}
.hub-mesh-c{animation:hub-mesh-c 27s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){.hub-mesh-a,.hub-mesh-b,.hub-mesh-c{animation:none}}
`;

const MONO = "font-[family-name:var(--font-mono)]";
const DISPLAY = "font-[family-name:var(--font-display)]";

/**
 * Inner-page hero: giant SplitHeading title over an animated gradient mesh
 * (cobre, terracota e um azul discreto), with an eyebrow, description, KPI row
 * slot and optional children (export button).
 */
export function PageHero({ eyebrow, title, description, tone, kpis, children }: PageHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const ready = useHubReady();
  const palette = TONES[tone];

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-page-hero-parallax]", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-page-hero-content]", {
          yPercent: -6,
          autoAlpha: 0.15,
          ease: "none",
          scrollTrigger: { trigger: root, start: "35% top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!ready) return;
      const root = rootRef.current;
      if (!root) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-page-hero-item]", root);
      const glow = root.querySelector<HTMLElement>("[data-page-hero-glow]");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: "power2.out" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          items,
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1.3, ease: "expo.out", stagger: 0.1, delay: 0.42 },
        );
        if (glow) {
          gsap.fromTo(glow, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2.2, ease: "expo.out" });
        }
      });
    },
    { scope: rootRef, dependencies: [ready] },
  );

  const toneVars = {
    "--tone": palette.text,
    "--tone-rgb": palette.rgb,
    "--tone-glow": palette.glow,
  } as CSSProperties;

  return (
    <section
      ref={rootRef}
      data-tone={tone}
      data-hero
      className="relative isolate flex min-h-[85svh] flex-col justify-end overflow-hidden bg-[var(--ink)] pb-[clamp(40px,6vw,80px)] pt-[clamp(150px,24vh,240px)] text-[var(--text)]"
      style={toneVars}
    >
      <style href="hub-page-hero" precedence="default">
        {PAGE_HERO_CSS}
      </style>

      {/* ---- background ---- */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div data-page-hero-parallax className="absolute inset-0">
          <div className="absolute inset-0">
            <div
              className="hub-mesh-a absolute left-[10%] top-[-10%] h-[70vh] w-[70vh] rounded-full opacity-60 blur-[90px]"
              style={{ background: `radial-gradient(circle, rgba(var(--tone-glow),.55) 0%, rgba(var(--tone-glow),0) 70%)` }}
            />
            <div
              className="hub-mesh-b absolute right-[-10%] top-[10%] h-[60vh] w-[60vh] rounded-full opacity-50 blur-[100px]"
              style={{ background: "radial-gradient(circle, rgba(201,105,76,.42) 0%, rgba(201,105,76,0) 70%)" }}
            />
            <div
              className="hub-mesh-c absolute bottom-[-20%] left-[35%] h-[55vh] w-[55vh] rounded-full opacity-40 blur-[110px]"
              style={{ background: "radial-gradient(circle, rgba(126,161,212,.28) 0%, rgba(126,161,212,0) 70%)" }}
            />
          </div>
        </div>

        {/* tone tint → ink */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(21,18,15,.25) 0%, rgba(21,18,15,.6) 60%, var(--ink,#15120F) 100%)`,
          }}
        />

        {/* dot grid */}
        <div
          className="dot-grid absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(247,240,222,.12) 1px, transparent 1.2px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(75% 70% at 50% 60%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(75% 70% at 50% 60%, #000 30%, transparent 100%)",
          }}
        />

        {/* tone radial glow */}
        <div
          data-page-hero-glow
          className="absolute left-1/2 top-[55%] h-[90vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
          style={{
            background: `radial-gradient(closest-side, rgba(var(--tone-glow),.32) 0%, rgba(var(--tone-glow),.10) 40%, rgba(var(--tone-glow),0) 100%)`,
          }}
        />
      </div>

      {/* ---- content ---- */}
      <div
        data-page-hero-content
        className="container-hub relative z-10 mx-auto w-full max-w-[1440px] px-[clamp(20px,5vw,80px)]"
      >
        <p
          data-page-hero-item
          className={cn("eyebrow", MONO, "text-[11px] uppercase tracking-[0.18em] text-[var(--tone)] md:text-[12px]")}
          style={{ opacity: 0 }}
        >
          {eyebrow}
        </p>

        <SplitHeading
          as="h1"
          type="chars"
          trigger="ready"
          delay={0.2}
          className={cn(
            "display",
            DISPLAY,
            "mt-[clamp(14px,2vw,26px)] max-w-[14ch] text-[clamp(3.5rem,9vw,9.5rem)] font-medium leading-[0.92] tracking-[-0.035em] text-[var(--text)]",
            "[&_em]:font-[family-name:var(--font-serif)] [&_em]:font-normal [&_em]:italic [&_em]:text-[var(--tone)]",
          )}
        >
          {title}
        </SplitHeading>

        {description ? (
          <p
            data-page-hero-item
            className="mt-[clamp(20px,2.6vw,36px)] max-w-[52ch] text-[15px] leading-[1.55] text-[var(--text-2)] md:text-[17px]"
            style={{ opacity: 0 }}
          >
            {description}
          </p>
        ) : null}

        {kpis ? (
          <div
            data-page-hero-item
            className="mt-[clamp(36px,5vw,72px)] border-t border-[var(--line)] pt-[clamp(20px,3vw,36px)]"
            style={{ opacity: 0 }}
          >
            {kpis}
          </div>
        ) : null}

        {children ? (
          <div data-page-hero-item className="mt-[clamp(20px,3vw,32px)]" style={{ opacity: 0 }}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PageHero;
