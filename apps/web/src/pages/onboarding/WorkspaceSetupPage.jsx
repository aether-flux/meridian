import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Globe,
} from "lucide-react";
import { Input } from "../../ui/components/Input.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { useAppStore } from "../../store/useAppStore.js";
import { api } from "../../services/api.js";

export default function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);

  const [name, setName] = useState("Engineering Team");
  const [slug, setSlug] = useState("engineering-team");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate slug from workspace name
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);

    if (!isSlugManuallyEdited) {
      const generated = newName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSlugChange = (e) => {
    setIsSlugManuallyEdited(true);
    // Sanitize user typed slug: lowercase, letters, numbers, hyphens
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a workspace name.");
      return;
    }

    if (!slug.trim()) {
      setError("Please enter a valid URL slug.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/workspaces", {
        name: name.trim(),
        slug: slug.trim(),
      });
      const workspace = {
        ...response.workspace,
        role: "OWNER",
        memberCount: response.workspace.members?.length || 1,
        description: `${response.workspace.name} workspace`,
      };
      localStorage.setItem("meridian_workspace_id", workspace.id);
      localStorage.setItem("meridian_workspace_slug", workspace.slug);
      localStorage.setItem("meridian_active_workspace", JSON.stringify(workspace));
      useAppStore.setState((state) => ({
        workspaces: [
          workspace,
          ...state.workspaces.filter((item) => item.id !== workspace.id),
        ],
        activeWorkspace: workspace,
      }));
      setIsLoading(false);
      navigate("/onboarding/invite");
    } catch (requestError) {
      setError(requestError.message || "Unable to create workspace.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="w-full max-w-lg text-center mb-6">
        <div className="inline-flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center font-mono font-bold text-white text-sm">
            M
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
            Meridian
          </span>
        </div>
      </div>

      {/* Onboarding Progress Steps */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-3 text-xs font-medium text-[#888]">
          <span className="flex items-center gap-1.5 text-[#1a1a1a] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[11px]">
              1
            </span>
            Workspace Details
          </span>
          <span className="h-px flex-1 mx-4 bg-[#e8e5e0]" />
          <span className="flex items-center gap-1.5 text-[#888]">
            <span className="w-5 h-5 rounded-full bg-[#e8e5e0] text-[#888] flex items-center justify-center text-[11px]">
              2
            </span>
            Invite Members
          </span>
        </div>
      </div>

      {/* Main Setup Card */}
      <div className="w-full max-w-lg bg-white border border-[#e8e5e0] rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#f5f2ef] border border-[#e8e5e0] flex items-center justify-center text-[#555] mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1a1a1a]">
            Create Your Workspace
          </h2>
          <p className="text-sm text-[#555] mt-1">
            Workspaces organize projects, tasks, sprints, and terminal
            configurations for your team.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="workspaceName"
            label="Workspace Name"
            type="text"
            placeholder="e.g. Engineering Team, Acme Labs"
            value={name}
            onChange={handleNameChange}
            required
            helperText="The public name of your organization or engineering group."
          />

          <Input
            id="workspaceSlug"
            label="URL Slug (Auto-Generated)"
            type="text"
            placeholder="engineering-team"
            value={slug}
            onChange={handleSlugChange}
            prefix="meridian.app/w/"
            mono
            required
            helperText="Auto-generates as lowercase with hyphens, but remains fully customizable."
          />

          {/* Real-time URL & Terminal preview box */}
          <div className="p-3.5 rounded-lg bg-[#f5f2ef] border border-[#e8e5e0] text-xs space-y-2">
            <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#555]" />
              Live Workspace Endpoint
            </div>
            <div className="font-mono text-[#1a1a1a] truncate">
              https://meridian.app/w/
              <span className="text-[#1a1a1a] font-semibold">
                {slug || "..."}
              </span>
            </div>
            <div className="p-2.5 mt-1 rounded-lg bg-[#1a1a1a] flex items-center gap-2 font-mono text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-[#888]">$</span>
              <span className="text-[#ccc]">meridian workspace switch {slug || "your-slug"}</span>
            </div>
          </div>

          {/* Owner Role Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-800">
            <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              As creator, <strong>{user?.displayName || "You"}</strong> will be
              assigned the <strong className="text-amber-700">OWNER</strong>{" "}
              role with full administration rights.
            </span>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Creating workspace..." : "Continue to Invite Members"}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
