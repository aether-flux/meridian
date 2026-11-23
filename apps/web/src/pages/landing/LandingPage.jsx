import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "../../ui/components/Button.jsx";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("create");
  const [copiedInstall, setCopiedInstall] = useState(false);

  const installCmd = "curl -fsSL https://meridian.sh/install.sh | bash";

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const terminalSnippets = {
    create: {
      input:
        'meridian task create --title "Build OAuth token validator" --priority URGENT --project ENG',
      output: [
        '✓ Created task ENG-46: "Build OAuth token validator"',
        "  Status:    TODO",
        "  Priority:  URGENT",
        "  Assignee:  alex@meridian.dev",
        "  URL:       https://meridian.app/w/meridian-core/tasks/ENG-46",
      ],
    },
    board: {
      input: "meridian board --project ENG --status IN_PROGRESS",
      output: [
        "ID       PRIORITY  ASSIGNEE      TITLE",
        "ENG-42   URGENT    alex@mrd.dev  Implement token-based invite generator",
        "ENG-45   URGENT    sarah@mrd.dev Kanban columns with interactive drawers",
        "3 tasks active in sprint 24 (65% completed)",
      ],
    },
    invite: {
      input: "meridian invite create --email newdev@team.io --role MEMBER",
      output: [
        "✓ Generated secure token invite for newdev@team.io",
        "  Role:      MEMBER",
        "  Link:      https://meridian.app/invite/tok_mrd_9f82a1b",
        "  Expires:   7 days (no external email server required)",
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#1a1a1a] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e8e5e0] bg-[#f8f6f3]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center font-mono font-bold text-white text-sm">
              M
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1a1a1a]">
              Meridian
            </span>
            <span className="text-xs text-[#888] font-mono hidden sm:inline-block">
              v0.9
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm text-[#555] hover:text-[#1a1a1a] transition-colors">
              Features
            </a>
            <span className="text-sm text-[#555] hover:text-[#1a1a1a] transition-colors cursor-default">
              CLI
            </span>
            <span className="text-sm text-[#555] hover:text-[#1a1a1a] transition-colors cursor-default">
              App
            </span>
          </nav>

          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Start free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0ede8] border border-[#e8e5e0] text-xs text-[#555] mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Open source · MIT</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1a1a1a] leading-tight sm:leading-tight">
                Track work at the speed of the keyboard.
              </h1>

              <p className="mt-6 text-base text-[#555] leading-relaxed max-w-lg">
                Meridian pairs a precise web app with a first-class CLI.
                Same REST API, same data, two ways to drive your team&apos;s work.
              </p>

              {/* Call to Actions */}
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
                <Link to="/register">
                  <Button size="lg" className="px-6">
                    Start free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f0ede8] border border-[#e8e5e0] font-mono text-sm text-[#1a1a1a]">
                  <span className="text-[#888]">$</span>
                  <span>npx meridian init</span>
                </div>
              </div>
            </div>

            {/* Right side — terminal mockup */}
            <div>
              <div className="rounded-xl bg-[#1a1a1a] border border-[#333] shadow-lg overflow-hidden">
                {/* Terminal chrome */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#555]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#555]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#555]" />
                    <span className="ml-2 text-xs font-mono text-[#888]">
                      ~/meridian — zsh
                    </span>
                  </div>

                  {/* Terminal command tabs */}
                  <div className="flex items-center gap-1 bg-[#111] p-1 rounded-lg border border-[#333] text-xs">
                    <button
                      onClick={() => setActiveTab("create")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        activeTab === "create"
                          ? "bg-[#333] text-white font-medium"
                          : "text-[#888] hover:text-[#ccc]"
                      }`}
                    >
                      Create Task
                    </button>
                    <button
                      onClick={() => setActiveTab("board")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        activeTab === "board"
                          ? "bg-[#333] text-white font-medium"
                          : "text-[#888] hover:text-[#ccc]"
                      }`}
                    >
                      Board Status
                    </button>
                    <button
                      onClick={() => setActiveTab("invite")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        activeTab === "invite"
                          ? "bg-[#333] text-white font-medium"
                          : "text-[#888] hover:text-[#ccc]"
                      }`}
                    >
                      Token Invites
                    </button>
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-5 font-mono text-sm space-y-3 text-left">
                  <div className="flex items-start gap-2 text-[#ccc]">
                    <span className="text-emerald-400 font-bold shrink-0">❯</span>
                    <span>
                      <span className="font-bold text-white">meridian</span>{" "}
                      <span className="text-[#ccc]">
                        {terminalSnippets[activeTab].input.replace("meridian ", "")}
                      </span>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#333]/60 space-y-1 text-xs sm:text-sm">
                    {terminalSnippets[activeTab].output.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.startsWith("✓")
                            ? "text-emerald-400"
                            : line.startsWith("ID")
                              ? "text-[#666] font-semibold"
                              : line.includes("URGENT")
                                ? "text-amber-400"
                                : "text-[#ccc]"
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CLI note below terminal */}
              <p className="mt-4 text-xs text-[#888] font-mono italic text-center">
                Web app + CLI share one REST API. No sync, no drift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Install Strip */}
      <div className="flex items-center justify-center pb-16">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#f0ede8] border border-[#e8e5e0] text-xs font-mono text-[#555]">
          <span className="text-[#1a1a1a] font-bold">$</span>
          <span className="select-all text-[#1a1a1a]">{installCmd}</span>
          <button
            onClick={handleCopyInstall}
            className="p-1 hover:text-[#1a1a1a] transition-colors"
            title="Copy install command"
          >
            {copiedInstall ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Core Feature Highlights */}
      <section id="features" className="py-20 bg-[#f0ede8]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              Built for the way developers actually work
            </h2>
            <span className="text-xs font-mono text-[#aaa] hidden sm:inline-block">
              (4) features
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] hover:shadow-sm transition-shadow">
              <span className="text-xs font-mono text-[#888] mb-3 block">git</span>
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">
                Human-Readable IDs
              </h3>
              <p className="text-xs text-[#555] leading-relaxed">
                Projects define custom prefixes (like{" "}
                <span className="font-mono text-[#1a1a1a]">ENG</span> or{" "}
                <span className="font-mono text-[#1a1a1a]">CLI</span>). Tasks
                auto-increment into identifiers like{" "}
                <span className="font-mono text-amber-700">ENG-42</span> for
                effortless Git branch names.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] hover:shadow-sm transition-shadow">
              <span className="text-xs font-mono text-[#888] mb-3 block">token</span>
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">
                Token-Based Invites
              </h3>
              <p className="text-xs text-[#555] leading-relaxed">
                Add workspace members via one-click cryptographic links (e.g.{" "}
                <span className="font-mono text-[#1a1a1a]">/invite/tok_abc</span>
                ) without requiring SMTP or third-party email providers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] hover:shadow-sm transition-shadow">
              <span className="text-xs font-mono text-[#888] mb-3 block">status</span>
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">
                Tasks & Sprints
              </h3>
              <p className="text-xs text-[#555] leading-relaxed">
                Visual column status flows (Todo, In Progress, In Review, Done)
                with quick drawers, sub-tasks, and sprint progress tracking.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] hover:shadow-sm transition-shadow">
              <span className="text-xs font-mono text-[#888] mb-3 block">⌘K</span>
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">
                Role-Based Workspaces
              </h3>
              <p className="text-xs text-[#555] leading-relaxed">
                Granular hierarchy with Owner, Admin, Member, and Viewer
                permissions. Clean workspace URL slugs like{" "}
                <span className="font-mono text-[#1a1a1a]">/w/engineering</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#e8e5e0] py-8 text-xs text-[#888]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-white font-mono">
              M
            </div>
            <span className="font-semibold text-[#1a1a1a]">
              Meridian Open Source
            </span>
            <span>— Dual CLI & Web Project Management</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#1a1a1a] transition-colors">
              Log In
            </Link>
            <Link to="/register" className="hover:text-[#1a1a1a] transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
