import { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Bell, CheckCircle2, AlertCircle, Info, ShieldAlert } from "lucide-react";

const NotificationTracker = () => {
    const notifications = useQuery(api.notifications.getNewNotificationsForToast);
    const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);
    const markAsToastShown = useMutation(api.notifications.markAsToastShown);

    const showReminder = useCallback(() => {
        if (unreadCount && unreadCount > 0) {
            toast("Finish Your Pending Tasks", {
                description: `You have ${unreadCount} unread notification(s) and pending work. Please complete them to avoid delays.`,
                icon: <Bell className="h-5 w-5 text-primary" />,
                duration: 6000,
                action: {
                    label: "View All",
                    onClick: () => {
                        // The user can open the bell popover manually, 
                        // but this just gives them a nudge.
                    }
                }
            });
        }
    }, [unreadCount]);

    // Handle new notifications
    useEffect(() => {
        if (notifications && notifications.length > 0) {
            notifications.forEach((notification) => {
                const isPriority = notification.type === "signature_request" || notification.type === "esign_request";

                const getIcon = (type: string) => {
                    switch (type) {
                        case "status_update": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
                        case "signature_request": return <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />;
                        case "esign_request": return <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />;
                        case "assignment": return <Info className="h-5 w-5 text-blue-500" />;
                        default: return <Bell className="h-5 w-5 text-primary" />;
                    }
                };

                if (isPriority) {
                    // High priority instant reaction toast
                    toast.error(notification.title, {
                        description: notification.description + " ACTION REQUIRED IMMEDIATELY.",
                        icon: getIcon(notification.type),
                        duration: Infinity, // Persistent until closed
                    });
                } else {
                    toast(notification.title, {
                        description: notification.description,
                        icon: getIcon(notification.type),
                        duration: 5000,
                    });
                }

                // Mark as toast shown immediately so it doesn't repeat
                markAsToastShown({ notificationId: notification._id });
            });
        }
    }, [notifications, markAsToastShown]);

    // Periodic Reminder (Every 15 minutes)
    useEffect(() => {
        const REMINDER_INTERVAL = 15 * 60 * 1000; // 15 minutes

        const intervalId = setInterval(() => {
            showReminder();
        }, REMINDER_INTERVAL);

        return () => clearInterval(intervalId);
    }, [showReminder]);

    return null;
};

export default NotificationTracker;
