import { useState } from "react";
import { Users, KeyRound, Copy, Check, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore.js";
import { Button } from "../../ui/components/Button.jsx";
import { Input } from "../../ui/components/Input.jsx";
import { Avatar } from "../../ui/components/Avatar.jsx";
import { RoleBadge } from "../../ui/components/Badge.jsx";
import { MOCK_USERS } from "../../data/mockData.js";

export default function TeamSettingsPage() {
  const invites = useAppStore((state) => state.invites);
  const createInvite = useAppStore((state) => state.createInvite);
  const deleteInvite = useAppStore((state) => state.deleteInvite);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [copiedId, setCopiedId] = useState(null);
  const [justGenerated, setJustGenerated] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    const newInv = createInvite({ email, role });
    setJustGenerated(newInv);
    setEmail("");
  };

  const handleCopy = (token, id) => {
    const fullUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-[#e8e5e0]">
        <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-[#555]" />
          Workspace Members & Token Invites
        </h1>
        <p className="text-xs text-[#888] mt-1">
          Manage member permissions and generate shareable token invite links
          without third-party mail servers.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
          <KeyRound className="w-4 h-4 text-[#555]" />
          Generate New Token Invite Link
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleGenerate}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <Input
              id="teamInviteEmail"
              label="Teammate Email"
              type="email"
              placeholder="developer@team.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#555]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-[42px] px-3 rounded-lg border border-[#e8e5e0] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 focus:border-[#1a1a1a]"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <Button type="submit" variant="primary" className="h-[42px]">
            <Plus className="w-4 h-4 mr-1" />
            Generate Link
          </Button>
        </form>

        {justGenerated && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-emerald-800">
              <span>Token link ready for {justGenerated.email}</span>
              <RoleBadge role={justGenerated.role} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#1a1a1a] px-3 py-1.5 rounded-lg font-mono text-[#e8e5e0] text-xs truncate">
                {window.location.origin}/invite/{justGenerated.token}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCopy(justGenerated.token, "just_gen")}
              >
                {copiedId === "just_gen" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#888]">
          Pending Token Invites ({invites.length})
        </h3>

        <div className="space-y-2">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 rounded-xl bg-white border border-[#e8e5e0] shadow-sm flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] text-[#555] bg-[#f5f2ef] px-2 py-0.5 rounded border border-[#e8e5e0]">
                  {inv.token}
                </span>
                <span className="text-[#1a1a1a] truncate font-medium">
                  {inv.email}
                </span>
                <RoleBadge role={inv.role} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(inv.token, inv.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#f5f2ef] hover:bg-[#f0ede8] text-[#555] border border-[#e8e5e0] flex items-center gap-1.5 transition-colors font-mono text-[11px]"
                >
                  {copiedId === inv.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Link
                    </>
                  )}
                </button>

                <button
                  onClick={() => deleteInvite(inv.id)}
                  className="p-1.5 rounded-lg text-[#888] hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Revoke Token"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#888]">
          Active Workspace Members ({MOCK_USERS.length})
        </h3>

        <div className="rounded-xl border border-[#e8e5e0] bg-white shadow-sm overflow-hidden divide-y divide-[#e8e5e0]">
          {MOCK_USERS.map((member) => (
            <div
              key={member.id}
              className="p-4 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={member.avatarUrl}
                  name={member.displayName}
                  initials={member.initials}
                  size="sm"
                  status="active"
                />
                <div>
                  <div className="font-semibold text-[#1a1a1a]">
                    {member.displayName}
                  </div>
                  <div className="text-[#888] text-[11px] font-mono">
                    {member.email}
                  </div>
                </div>
              </div>

              <RoleBadge role={member.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
