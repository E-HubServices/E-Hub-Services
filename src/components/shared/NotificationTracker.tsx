import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";

const NotificationTracker = () => {
    const notifications = useQuery(api.notifications.getNewNotificationsForToast);
    const markAsToastShown = useMutation(api.notifications.markAsToastShown);

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
                    duration: 4000, // Short duration for pop-up
                });

                // Mark as toast shown immediately so it doesn't repeat
                markAsToastShown({ notificationId: notification._id });
            });
        }
    }, [notifications, markAsToastShown]);

    return null;
};

export default NotificationTracker;
