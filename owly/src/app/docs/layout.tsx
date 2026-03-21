import Link from "next/link";
import { Search } from "./search";
import "./docs.css";

const sections = [
  {
    label: "Overview",
    items: [{ title: "Getting Started", href: "/docs" }],
  },
  {
    label: "Primitives",
    items: [
      {
        title: "Terminal",
        href: "/docs/terminal",
        children: [
          { title: "owl terminal", href: "/docs/terminal#usage" },
          { title: "Agent Wizard", href: "/docs/terminal#agent-setup-wizard" },
          { title: "MCP Tools", href: "/docs/terminal#mcp-tools" },
        ],
      },
      {
        title: "Tunnel",
        href: "/docs/tunnel",
        children: [
          { title: "owl tunnel create", href: "/docs/tunnel#cli-commands" },
          { title: "owl tunnel connect", href: "/docs/tunnel#cli-commands" },
          { title: "owl tunnel list", href: "/docs/tunnel#cli-commands" },
          { title: "Authentication", href: "/docs/tunnel#authentication" },
          { title: "Policy Engine", href: "/docs/tunnel#policy-engine" },
        ],
      },
      {
        title: "Alerts",
        href: "/docs/alerts",
        children: [
          { title: "owl alert add", href: "/docs/alerts#add-an-alert" },
          { title: "owl alert daemon", href: "/docs/alerts#manage-alerts" },
          { title: "owl alert channels", href: "/docs/alerts#notification-channels" },
          { title: "Conditions", href: "/docs/alerts#condition-types" },
        ],
      },
      {
        title: "Activity Ledger",
        href: "/docs/activity-ledger",
        children: [
          { title: "CLI Commands", href: "/docs/activity-ledger#cli-commands" },
          { title: "Statistics", href: "/docs/activity-ledger#stats" },
          { title: "Export", href: "/docs/activity-ledger#export-formats" },
          { title: "MCP Tools", href: "/docs/activity-ledger#mcp-tools" },
        ],
      },
      {
        title: "Dry Run",
        href: "/docs/dryrun",
        children: [
          { title: "owl dryrun swap", href: "/docs/dryrun#swap" },
          { title: "owl dryrun transfer", href: "/docs/dryrun#transfer" },
          { title: "owl dryrun bridge", href: "/docs/dryrun#bridge" },
        ],
      },
      {
        title: "Reports",
        href: "/docs/reports",
        children: [
          { title: "Spending Reports", href: "/docs/reports#spending" },
          { title: "Portfolio View", href: "/docs/reports#portfolio" },
          { title: "MCP Tools", href: "/docs/reports#mcp-tools" },
        ],
      },
    ],
  },
  {
    label: "Reference",
    items: [
      { title: "MCP Tools", href: "/docs/mcp" },
      { title: "MoonPay Integration", href: "/docs/integration" },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <nav className="w-full border-b border-border-dim bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">
              OWL
            </Link>
            <span className="text-text-muted text-sm">/</span>
            <span className="text-text-secondary text-sm">Docs</span>
          </div>
          <div className="flex items-center gap-4">
            <Search />
            <a
              href="https://www.npmjs.com/package/moonpay-owl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-3 py-1.5 rounded-full border border-border-dim text-text-secondary hover:border-neon-cyan hover:text-neon-cyan transition-all"
            >
              moonpay-owl
            </a>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-56 shrink-0 border-r border-border-dim py-6 px-4 hidden md:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="text-[11px] font-mono uppercase tracking-widest text-text-muted mb-2 px-3">
                {section.label}
              </div>
              {section.items.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="sidebar-link"
                  >
                    {item.title}
                  </Link>
                  {"children" in item && (item as any).children && (
                    <div className="ml-4 mt-0.5 mb-1">
                      {(item as any).children.map((child: { title: string; href: string }) => (
                        <Link
                          key={child.href + child.title}
                          href={child.href}
                          className="sidebar-link text-xs !py-1 !text-text-muted hover:!text-neon-cyan"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0 px-8 py-10 max-w-4xl">{children}</main>
      </div>
    </div>
  );
}
