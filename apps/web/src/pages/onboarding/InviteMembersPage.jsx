import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Input } from "../../ui/components/Input.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { RoleBadge } from "../../ui/components/Badge.jsx";
import { useAppStore } from "../../store/useAppStore.js";
import { api } from "../../services/api.js";

export default function InviteMembersPage() {
  const navigate = useNavigate();
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [copiedId, setCopiedId] = useState(null);
  const [justGeneratedToken, setJustGeneratedToken] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid teammate email address.");
      return;
    }

    setIsLoading(true);
    try {
      const workspaceSlug =
        localStorage.getItem("meridian_workspace_slug") || activeWorkspace?.slug;
      if (!workspaceSlug) {
        throw new Error("Create a workspace before inviting members.");
      }
      const response = await api.post(
        `/workspaces/${encodeURIComponent(workspaceSlug)}/invites`,
        { email, role },
      );
      setJustGeneratedToken(response.invite);
      setEmail("");
    } catch (requestError) {
      setError(requestError.message || "Unable to generate the invite link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (token, id) => {
    const fullUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2200);
      })
      .catch(() => setError("Unable to copy the link. Please copy it manually."));
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="w-full max-w-xl text-center mb-6">
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
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between mb-3 text-xs font-medium text-[#888]">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            1. Workspace Created
          </span>
          <span className="h-px flex-1 mx-4 bg-emerald-300" />
          <span className="flex items-center gap-1.5 text-[#1a1a1a] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[11px]">
              2
            </span>
            Invite Members
          </span>
        </div>
      </div>

      {/* Main Invite Card */}
      <div className="w-full max-w-xl bg-white border border-[#e8e5e0] rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f5f2ef] border border-[#e8e5e0] flex items-center justify-center text-[#555] mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1a1a1a]">
              Invite Team Members
            </h2>
            <p className="text-sm text-[#555] mt-1">
              Add members to{" "}
              <span className="text-[#1a1a1a] font-medium">
                {activeWorkspace?.name || "your workspace"}
              </span>{" "}
              using token links. No external email server required.
            </p>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#f5f2ef] text-[#555] border border-[#e8e5e0]">
            /w/{activeWorkspace?.slug || "engineering"}
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Generate Invite Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                id="memberEmail"
                label="Teammate Email"
                type="email"
                placeholder="colleague@meridian.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<Users className="w-4 h-4 text-[#888]" />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="roleSelect"
                className="text-xs font-medium uppercase tracking-wider text-[#888]"
              >
                Member Role
              </label>
              <select
                id="roleSelect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-[42px] px-3 rounded-lg border border-[#e8e5e0] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20"
              >
                <option value="MEMBER">Member (Default)</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
            <KeyRound className="w-4 h-4 mr-1 text-[#555]" />
            {isLoading ? "Generating invite..." : "Generate Shareable Token Link"}
          </Button>
        </form>

        {/* Recently generated token highlight banner */}
        {justGeneratedToken && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Invite link generated for {justGeneratedToken.email}
              </span>
              <RoleBadge role={justGeneratedToken.role} />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-[#f5f2ef] px-3 py-2 rounded-lg border border-[#e8e5e0] font-mono text-xs text-[#1a1a1a] truncate select-all">
                {window.location.origin}/invite/{justGeneratedToken.token}
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  handleCopyLink(justGeneratedToken.token, "just_gen")
                }
                className="flex-shrink-0"
              >
                {copiedId === "just_gen" ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Role Permissions Legend */}
        <div className="mt-5 p-3 rounded-lg bg-[#f8f6f3] border border-[#e8e5e0] text-[11px] text-[#555] space-y-1.5">
          <div className="font-medium text-[#1a1a1a] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#555]" />
            Roles Overview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[#1a1a1a] font-semibold">Admin:</span>{" "}
              Manage projects, create sprints, invite members.
            </div>
            <div>
              <span className="text-[#1a1a1a] font-semibold">Member:</span>{" "}
              Create and assign tasks, comment, update status.
            </div>
            <div>
              <span className="text-[#888] font-semibold">Viewer:</span>{" "}
              Read-only view of boards and sprint goals.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#e8e5e0]">
          <button
            type="button"
            onClick={handleFinish}
            className="text-sm text-[#888] hover:text-[#555] transition-colors py-2 px-3"
          >
            Skip for now →
          </button>

          <Button
            onClick={handleFinish}
            size="lg"
            className="w-full sm:w-auto px-6"
          >
            Go to Workspace Dashboard
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
