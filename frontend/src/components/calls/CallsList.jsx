import { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import CallItem from "./CallItem";
import { PhoneMissedIcon } from "lucide-react";

function CallsList() {
  const { calls, isCallsLoading, fetchCallHistory, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    // Only fetch if we don't have cached results yet
    if (calls.length === 0) fetchCallHistory();
  }, [fetchCallHistory]);

  if (isCallsLoading) {
    return (
      <div className="flex flex-col gap-2 px-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-high)] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--surface-high)] rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-[var(--surface-high)] rounded w-1/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-10">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-high)] flex items-center justify-center mb-4 text-[var(--primary)]">
          <PhoneMissedIcon className="w-8 h-8" />
        </div>
        <h3 className="text-[var(--on-surface)] font-semibold mb-1">No recent calls yet</h3>
        <p className="text-[var(--on-surface-variant)] text-sm">
          Your call history will appear here once you make or receive calls.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {calls.map((call) => (
        <CallItem
          key={call._id}
          call={call}
          authUser={authUser}
          onClick={(user) => setSelectedUser(user)}
        />
      ))}
    </div>
  );
}

export default CallsList;
