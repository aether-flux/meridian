import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "../../ui/components/Button.jsx";
import { RoleBadge } from "../../ui/components/Badge.jsx";
import { api } from "../../services/api.js";

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    api
      .get(`/invites/${encodeURIComponent(token)}`)
      .then((response) => {
        if (isCurrent) setInvite(response);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.message || "Unable to verify this invitation.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const handleContinue = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center font-mono font-bold text-white text-sm">
            M
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
            Meridian
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white border border-[#e8e5e0] rounded-xl p-6 sm:p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-[#f5f2ef] border border-[#e8e5e0] flex items-center justify-center text-[#555] mx-auto mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-[#1a1a1a]">
          {isLoading ? "Verifying Invitation" : error ? "Invitation Unavailable" : "You've Been Invited!"}
        </h2>
        {isLoading ? (
          <p className="text-sm text-[#555] mt-2">Checking this invite token...</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>
        ) : (
          <p className="text-sm text-[#555] mt-2">
            You were invited to collaborate in{" "}
            <strong className="text-[#1a1a1a]">{invite.workspace.name}</strong>.
          </p>
        )}

        {/* Token details */}
        {invite && <div className="my-6 p-4 rounded-lg bg-[#f8f6f3] border border-[#e8e5e0] text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888]">Workspace</span>
            <span className="font-semibold text-[#1a1a1a] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#555]" />
              {invite.workspace.name} <span className="text-[#888]">({invite.workspace.slug})</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888]">Target Email</span>
            <span className="font-mono text-[#1a1a1a]">
              {invite.invite.email}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888]">Assigned Role</span>
            <RoleBadge role={invite.invite.role} />
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e8e5e0]">
            <span className="text-[#888]">Invite Token</span>
            <span className="font-mono text-emerald-600 text-[11px]">
              {token}
            </span>
          </div>
        </div>}

        {invite && (
          <Button onClick={handleContinue} size="lg" className="w-full">
            Continue to sign in
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}

        <div className="mt-4 text-[11px] text-[#aaa] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#aaa]" />
          <span>
            Token-based secure authentication • No email link tracking
          </span>
        </div>
      </div>
    </div>
  );
}
