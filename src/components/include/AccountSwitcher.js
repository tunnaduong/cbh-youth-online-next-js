"use client";

import { useEffect, useState } from "react";
import { Plus, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MAX_SAVED_ACCOUNTS,
  activateSavedAccount,
  getSavedAccounts,
  removeSavedAccount,
  startAddAccount,
} from "@/utils/savedAccounts";

const avatarSrc = (user) =>
  user?.avatar_url || `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${user?.username}/avatar`;

function useSavedAccounts() {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    const sync = () => setAccounts(getSavedAccounts());
    sync();
    window.addEventListener("saved-accounts-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("saved-accounts-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return accounts;
}

// Other accounts signed in on this browser, shown inside the navbar account menu.
export default function AccountSwitcher({ currentUserId, itemClassName }) {
  const accounts = useSavedAccounts();
  const others = accounts.filter((a) => a.user.id !== currentUserId);

  return (
    <div className="border-t border-gray-100 py-1 dark:border-neutral-600">
      <p className="px-4 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-neutral-400">
        Chuyển tài khoản
      </p>
      {others.map((account) => {
        const name = account.user.profile_name || account.user.username;
        return (
          <div key={account.user.id} className="group relative">
            <button
              type="button"
              onClick={() => activateSavedAccount(account)}
              className={`${itemClassName} pr-9`}
              title={`Chuyển sang @${account.user.username}`}
            >
              <Avatar className="h-7 w-7 border border-gray-200 dark:border-neutral-600">
                <AvatarImage src={avatarSrc(account.user)} alt="" className="object-cover" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate font-medium">{name}</span>
                <span className="block truncate text-xs text-gray-500 dark:text-neutral-400">
                  @{account.user.username}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeSavedAccount(account.user.id)}
              aria-label={`Gỡ @${account.user.username} khỏi thiết bị này`}
              title="Gỡ khỏi thiết bị này"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 opacity-0 transition hover:bg-gray-200 hover:text-gray-700 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-neutral-600 dark:hover:text-neutral-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      {accounts.length < MAX_SAVED_ACCOUNTS && (
        <button type="button" onClick={startAddAccount} className={itemClassName}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-600">
            <Plus className="h-4 w-4" />
          </span>
          Thêm tài khoản
        </button>
      )}
    </div>
  );
}
