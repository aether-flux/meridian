import { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { Button } from "../../ui/components/Button.jsx";
import { Input } from "../../ui/components/Input.jsx";
import { Modal } from "../../ui/components/Modal.jsx";
import ProjectEmojiPicker from "./ProjectEmojiPicker.jsx";

export default function ProjectSettingsModal({ project, onClose, onUpdated }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [icon, setIcon] = useState(project?.icon || "📁");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(project?.name || "");
    setDescription(project?.description || "");
    setIcon(project?.icon || "📁");
    setError("");
  }, [project]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await api.patch(`/projects/${encodeURIComponent(project.id)}`, {
        name: name.trim(),
        description: description.trim() || null,
        icon,
      });
      onUpdated(response.project);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Unable to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(project)} onClose={onClose} title="Project Settings" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        <Input id="editProjectName" label="Project title" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
        <div className="space-y-1.5">
          <label htmlFor="editProjectDescription" className="text-xs font-medium text-[#555]">Description</label>
          <textarea id="editProjectDescription" rows={4} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-[#e8e5e0] bg-white p-2.5 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none" />
        </div>
        <div className="space-y-2">
          <span className="block text-xs font-medium text-[#555]">Project icon</span>
          <ProjectEmojiPicker value={icon} onChange={setIcon} />
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e8e5e0] pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving || !name.trim()}>{isSaving ? "Saving..." : "Save project"}</Button>
        </div>
      </form>
    </Modal>
  );
}