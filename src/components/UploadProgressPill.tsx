"use client";

import { UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import { useUploadQueue } from "./UploadQueueContext";

/** Floating upload progress pill. Visible whenever the background queue has
 *  items and the upload modal is closed, so uploads keep running while the
 *  user works elsewhere in the app. Clicking reopens the full queue modal. */
export default function UploadProgressPill() {
  const {
    items,
    activeCount,
    doneCount,
    totalProgress,
    isModalOpen,
    openModal,
    clearFinished,
  } = useUploadQueue();

  if (items.length === 0 || isModalOpen) return null;

  const allDone = activeCount === 0;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 animate-fade-in">
      <div className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-neutral-800 shadow-2xl shadow-black/80 min-w-[240px] max-w-[320px]">
        <button
          onClick={openModal}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          title="Open upload queue"
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            {allDone ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {allDone
                ? `${doneCount} upload${doneCount > 1 ? "s" : ""} complete`
                : `${activeCount} uploading… ${totalProgress}%`}
            </div>
            {!allDone && (
              <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            )}
            {allDone && (
              <div className="text-[10px] text-neutral-400 mt-0.5">
                Tap to view queue
              </div>
            )}
          </div>
        </button>
        {allDone && (
          <button
            onClick={clearFinished}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition shrink-0"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!allDone && (
          <div className="shrink-0 pr-1">
            <UploadCloud className="w-4 h-4 text-neutral-500" />
          </div>
        )}
      </div>
    </div>
  );
}
