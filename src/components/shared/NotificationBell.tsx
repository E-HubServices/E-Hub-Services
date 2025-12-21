import { Bell, CheckCircle2, AlertCircle, Info, Clock, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
    const navigate = useNavigate();
    const notifications = useQuery(api.notifications.getMyNotifications);
    const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const handleNotificationClick = (notification: any) => {
        markAsRead({ notificationId: notification._id });
        if (notification.serviceRequestId) {
            navigate(`/request/${notification.serviceRequestId}`);
        } else if (notification.esignRequestId) {
            navigate(`/esign/view/${notification.esignRequestId}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "status_update": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "signature_request": return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case "assignment": return <Info className="h-4 w-4 text-blue-500" />;
            default: return <Bell className="h-4 w-4 text-primary" />;
        }
    };

    const hasPriorityUnread = notifications?.some(n => !n.isRead && (n.type === "signature_request" || n.type === "esign_request"));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "relative h-10 w-10 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-primary/20 transition-all",
                        hasPriorityUnread && "ring-2 ring-red-500 animate-pulse bg-red-50"
                    )}
                >
                    <Bell className={cn("h-5 w-5 text-slate-400 group-hover:text-primary transition-colors", hasPriorityUnread && "text-red-500")} />
                    {unreadCount && unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-3xl overflow-hidden border-slate-100 shadow-2xl" align="end">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Stay updated with your requests</p>
                    </div>
                    {unreadCount && unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase text-primary hover:text-primary hover:bg-white/10"
                            onClick={() => markAllAsRead()}
                        >
                            <Check className="h-3 w-3 mr-1" /> Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    <div className="flex flex-col">
                        {notifications === undefined ? (
                            <div className="p-8 text-center">
                                <Clock className="h-8 w-8 text-slate-100 animate-spin mx-auto mb-2" />
                                <p className="text-xs text-slate-400 font-bold uppercase">Syncing...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "flex gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                                        !n.isRead && "bg-primary/5 hover:bg-primary/10"
                                    )}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs font-black text-slate-900 mb-0.5", !n.isRead && "text-primary")}>
                                            {n.title}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-1 line-clamp-2">
                                            {n.description}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                                            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <div className="mt-2 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900" disabled>
                        View older history
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
