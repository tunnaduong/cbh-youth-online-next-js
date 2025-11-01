"use client";

import Link from "next/link";

export default function ParticipantsList({ participants }) {
  const getAvatarInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return "#gray";
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#6366f1",
      "#14b8a6",
      "#64748b",
      "#f97316",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Chưa có người tham gia
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {participants.map((participant, index) => {
        const displayName =
          participant.profile_name || participant.username || "Ẩn danh";
        const avatarInitial = getAvatarInitial(displayName);
        const avatarColor = getAvatarColor(displayName);
        const isGuest = participant.is_guest;
        // Check if user is online (last_activity within 5 minutes)
        // Use is_online from backend, or calculate from last_activity if not provided
        let isOnline = false;
        if (!isGuest && participant.last_activity) {
          if (participant.is_online !== undefined) {
            // Use is_online from backend if available
            isOnline = participant.is_online;
          } else {
            // Calculate from last_activity as fallback
            const lastActivity = new Date(participant.last_activity);
            const now = new Date();
            const diffMinutes = (now - lastActivity) / (1000 * 60);
            isOnline = diffMinutes <= 5;
          }
        }

        return (
          <div
            key={participant.id || `guest-${index}`}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition"
          >
            {/* Avatar */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: avatarColor }}
            >
              {participant.avatar_url ? (
                <img
                  src={participant.avatar_url}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>

            {/* Username */}
            {!isGuest && participant.username ? (
              <Link
                href={`/${participant.username}`}
                className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {displayName}
              </Link>
            ) : (
              <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </span>
            )}

            {/* Online Indicator */}
            {!isGuest && isOnline && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </div>
        );
      })}
    </div>
  );
}

