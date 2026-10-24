import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/30"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${maxWidth} rounded-xl bg-white border border-[#e8e5e0] shadow-lg z-10 overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e5e0]">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-[#1a1a1a] hover:bg-[#f0ede8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
