import { useUser } from "@clerk/clerk-react";
import { useMutation, useConvexAuth } from "convex/react";
import { useEffect, useState, useRef } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
    const { isLoaded, user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.storeUser);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [lastSyncedId, setLastSyncedId] = useState<string | null>(null);
    const retryCountRef = useRef(0);
    const maxRetries = 5;

    useEffect(() => {
        let isStopped = false;
        let timeoutId: NodeJS.Timeout;

        async function syncWithRetry() {
            // Only sync if we have all required conditions
            if (!isLoaded || !user || !isAuthenticated) {
                return;
            }

            // Skip if already synced for this user
            if (lastSyncedId === user.id && syncStatus === 'synced') {
                return;
            }

            // Prevent excessive retries
            if (retryCountRef.current >= maxRetries) {
                console.error("Max retry attempts reached for user sync");
                setSyncStatus('error');
                return;
            }

            try {
                setSyncStatus('syncing');

                // Progressive delay: wait longer on each retry
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));

                if (isStopped) return;

                console.log(`[UserSync] Attempting to sync user (attempt ${retryCountRef.current + 1}/${maxRetries})...`);

                await storeUser();

                if (isStopped) return;

                console.log("[UserSync] ✓ User synced successfully");
                setLastSyncedId(user.id);
                setSyncStatus('synced');
                retryCountRef.current = 0; // Reset retry count on success

            } catch (err: any) {
                if (isStopped) return;

                console.error(`[UserSync] Sync failed (attempt ${retryCountRef.current + 1}):`, err?.message || err);

                retryCountRef.current++;

                // Retry with exponential backoff
                if (retryCountRef.current < maxRetries) {
                    const retryDelay = Math.min(2000 * Math.pow(2, retryCountRef.current), 10000);
                    console.log(`[UserSync] Retrying in ${retryDelay}ms...`);

                    timeoutId = setTimeout(() => {
                        if (!isStopped) {
                            syncWithRetry();
                        }
                    }, retryDelay);
                } else {
                    setSyncStatus('error');
                }
            }
        }

        syncWithRetry();

        return () => {
            isStopped = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isLoaded, user?.id, isAuthenticated, storeUser, lastSyncedId, syncStatus]);

    // Expose sync status for debugging (optional)
    useEffect(() => {
        if (syncStatus === 'synced') {
            console.log("[UserSync] Status: Ready ✓");
        }
    }, [syncStatus]);

    return null;
}
