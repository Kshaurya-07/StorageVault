import { FolderOpen, Sparkles, Star, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40">
      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-black/40 transition min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
