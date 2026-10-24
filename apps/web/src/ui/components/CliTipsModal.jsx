import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { Copy, Check } from "lucide-react";

export function CliTipsModal({ isOpen, onClose }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const commands = [
    {
      label: "Authenticate CLI",
      cmd: "meridian auth login --token tok_alex_dev_99",
      desc: "Connect your terminal to your Meridian account.",
    },
    {
      label: "List active tasks",
      cmd: "meridian task list --project ENG --status IN_PROGRESS",
      desc: "Filter and display tasks in a terminal table.",
    },
    {
      label: "Create a new task",
      cmd: 'meridian task create --title "Fix memory leak" --priority HIGH',
      desc: "Prints a human-readable identifier like ENG-46.",
    },
    {
      label: "Move task status",
      cmd: "meridian task move ENG-42 --status DONE",
      desc: "Syncs instantly to the web Tasks view.",
    },
    {
      label: "View sprint progress",
      cmd: "meridian sprint status --current",
      desc: "Sprint burndown and completion stats in terminal.",
    },
    {
      label: "Generate an invite link",
      cmd: "meridian invite create --email dev@team.io --role MEMBER",
      desc: "Token invite URL without SMTP.",
    },
  ];

  const handleCopy = (cmd, index) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meridian CLI Quick Reference"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3">
        <p className="text-xs text-[#888]">
          Web app + CLI share one REST API. No sync, no drift.
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {commands.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-[#e8e5e0] bg-[#f8f6f3]"
            >
              <div className="flex items-center justify-between text-xs text-[#888] mb-1.5">
                <span className="font-medium text-[#555]">{item.label}</span>
                <span>{item.desc}</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-[#1a1a1a] font-mono text-xs text-[#e8e5e0]">
                <span className="truncate select-all">{item.cmd}</span>
                <button
                  onClick={() => handleCopy(item.cmd, idx)}
                  className="p-1 rounded text-[#888] hover:text-white flex-shrink-0 transition-colors"
                  title="Copy command"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
