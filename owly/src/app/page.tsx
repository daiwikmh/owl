import Link from "next/link";
import "./landing.css";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { OwlCanvas } from "@/components/owl-canvas";
import { HowItWorksSection } from "@/components/how-it-works";
import { DevelopersSection } from "@/components/developers-section";


export default function Home() {
  return (
    <>
      <Header />

      <div className="flex flex-col min-h-svh justify-center items-center pt-28 pb-16 gap-10">
        <OwlCanvas className="rounded-xl" />

        <div className="text-center relative">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient text-white">
            OWL on MoonPay
          </h1>
          <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-6 max-w-[520px] mx-auto leading-relaxed">
            Terminal, Tunnel, and Alerts for MoonPay wallets.
            <br />
            Infrastructure that lets AI agents coordinate on-chain.
          </p>

          <div className="flex items-center justify-center gap-4 mt-14">
            <Link className="contents" href="/docs">
              <Button>[Get Started]</Button>
            </Link>
          </div>

          <div className="mt-8 font-mono text-sm text-foreground/40">
            <span className="text-neon-green">$</span> npx @moonpay/owl
          </div>
        </div>
      </div>

      <HowItWorksSection />
      <DevelopersSection />

      <footer className="w-full border-t border-border-dim py-8 mt-auto">
        <div className="container max-w-6xl mx-auto flex items-center justify-between text-xs text-text-muted">
          <span>OWL - CC0 License</span>
          <div className="flex gap-4">
            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neon-cyan transition-colors"
            >
              OWS
            </a>
            <a
              href="https://www.moonpay.com/agents"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neon-cyan transition-colors"
            >
              MoonPay Agents
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
