import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";

const NotificationTracker = () => {
    const notifications = useQuery(api.notifications.getUnreadNotifications);
    const markAsRead = useMutation(api.notifications.markAsRead);

    useEffect(() => {
        if (notifications && notifications.length > 0) {
            notifications.forEach((notification) => {
                const getIcon = (type: string) => {
                    switch (type) {
                        case "status_update": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
                        case "signature_request": return <AlertCircle className="h-5 w-5 text-orange-500" />;
                        case "assignment": return <Info className="h-5 w-5 text-blue-500" />;
                        default: return <Bell className="h-5 w-5 text-primary" />;
                    }
                };

                toast(notification.title, {
                    description: notification.description,
                    icon: getIcon(notification.type),
                    duration: 5000,
                });

                // Mark as read after showing the toast
                markAsRead({ notificationId: notification._id });
            });
        }
    }, [notifications, markAsRead]);

    return null;
};

export default NotificationTracker;
