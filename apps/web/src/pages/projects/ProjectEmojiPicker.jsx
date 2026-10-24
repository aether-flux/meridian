const projectEmojis = [
  "🚀", "⚡", "🛠️", "⌨️", "💻", "🖥️", "📱", "🌐", "🔌", "🧩", "⚙️", "🔧",
  "🧪", "🔬", "📊", "📈", "📉", "🗂️", "📁", "📝", "📚", "📦", "🏗️", "🧱",
  "🎨", "🖌️", "✨", "💡", "🔒", "🛡️", "🔑", "🧠", "🤖", "🛰️", "☁️", "🌱",
  "🎯", "🏁", "🏆", "✅", "🔔", "📣", "🧭", "🗺️", "🧰", "🪄", "🎮", "🎧",
  "💬", "🤝", "👥", "🧑‍💻", "🧵", "🔗", "💾", "🗃️", "🧮", "🕹️", "🧹", "🪴",
];

export default function ProjectEmojiPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-[#e8e5e0] bg-[#faf9f7] p-2 sm:grid-cols-10">
      {projectEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-label={`Choose ${emoji} project icon`}
          aria-pressed={value === emoji}
          className={`aspect-square rounded-md border text-xl transition-colors hover:bg-white ${value === emoji ? "border-[#1a1a1a] bg-white" : "border-transparent"}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}