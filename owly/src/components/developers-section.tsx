"use client";

import { useState, useEffect, useRef } from "react";

const codeExamples = [
  {
    label: "CLI",
    code: `# Install and run
npx @moonpay/owl terminal --wallet main

# Start MCP server
npx @moonpay/owl mcp

# Create a sharing tunnel
owl tunnel create -w main -n my-tunnel`,
  },
  {
    label: "MCP",
    code: `// claude_desktop_config.json
{
  "mcpServers": {
    "owl": {
      "command": "npx",
      "args": ["@moonpay/owl", "mcp"]
    }
  }
}`,
  },
  {
    label: "Tools",
    code: `// 15 available owl_* MCP tools
owl_tunnel_create({ wallet, name })
owl_tunnel_propose({ tunnel, operation })
owl_tunnel_policy_set({ tunnel, peer })
owl_alert_add({ token, chain, condition })
owl_alert_channels_set({ telegram_token })
owl_terminal_status()`,
  },
];

const features = [
  { title: "15 MCP tools", description: "Tunnel, alerts, and terminal coverage." },
  { title: "MoonPay proxy", description: "All mp tools proxied transparently." },
  { title: "10 chains", description: "Solana, Ethereum, Base, BNB, and more." },
  { title: "Policy engine", description: "Daily limits, whitelists, auto-approve." },
];

export function DevelopersSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="developers"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-foreground/40 mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              For developers
            </span>
            <h2 className="text-4xl lg:text-6xl font-sentient tracking-tight mb-8">
              Built for agents.
              <br />
              <span className="text-foreground/40">Works with MoonPay.</span>
            </h2>
            <p className="text-xl text-foreground/50 mb-12 leading-relaxed">
              Drop into any MCP-compatible client in minutes. One command starts
              the server. All MoonPay tools plus 15 OWL tools in a single gateway.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-foreground/50">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`lg:sticky lg:top-32 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              <div className="flex items-center border-b border-foreground/10">
                {codeExamples.map((example, idx) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-6 py-4 text-sm font-mono transition-colors relative ${
                      activeTab === idx
                        ? "text-foreground"
                        : "text-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {example.label}
                    {activeTab === idx && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                    )}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-4 text-foreground/40 hover:text-foreground transition-colors font-mono text-xs"
                  aria-label="Copy code"
                >
                  {copied ? "done" : "copy"}
                </button>
              </div>

              <div className="p-8 font-mono text-sm bg-foreground/[0.01] min-h-[220px]">
                <pre className="text-foreground/70">
                  {codeExamples[activeTab].code.split("\n").map((line, lineIndex) => (
                    <div
                      key={`${activeTab}-${lineIndex}`}
                      className="leading-loose dev-code-line"
                      style={{ animationDelay: `${lineIndex * 80}ms` }}
                    >
                      <span className="inline-flex">
                        {line.split("").map((char, charIndex) => (
                          <span
                            key={`${activeTab}-${lineIndex}-${charIndex}`}
                            className="dev-code-char"
                            style={{
                              animationDelay: `${lineIndex * 80 + charIndex * 15}ms`,
                            }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm">
              <a
                href="/docs"
                className="text-foreground hover:underline underline-offset-4"
              >
                Read the docs
              </a>
              <span className="text-foreground/20">|</span>
              <a
                href="/docs/mcp"
                className="text-foreground/40 hover:text-foreground"
              >
                MCP Tools Reference
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
