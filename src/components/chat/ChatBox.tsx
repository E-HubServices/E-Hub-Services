import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatBoxProps {
    serviceRequestId?: Id<"service_requests">;
    esignRequestId?: Id<"esign_requests">;
    currentUserRole: "customer" | "shop_owner" | "authorized_signatory";
}

const ChatBox = ({ serviceRequestId, esignRequestId, currentUserRole }: ChatBoxProps) => {
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const messages = useQuery(api.messages.getMessages, {
        serviceRequestId,
        esignRequestId
    });

    const sendMessage = useMutation(api.messages.sendMessage);
    const markAsRead = useMutation(api.messages.markAsRead);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        // Mark as read when messages update
        if (messages && messages.length > 0) {
            markAsRead({ serviceRequestId, esignRequestId });
        }
    }, [messages, serviceRequestId, esignRequestId, markAsRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage({
                serviceRequestId,
                esignRequestId,
                text: newMessage,
                messageType: "text",
            });
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{esignRequestId ? "E-Sign Chat" : "Service Chat"}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Direct support channel</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-slate-50">
                <div className="space-y-4">
                    {!messages ? (
                        <div className="flex justify-center p-8">
                            <Clock className="h-6 w-6 text-slate-300 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                                <MessageSquare className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 px-8">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderRole === currentUserRole;
                            return (
                                <div
                                    key={msg._id}
                                    className={cn(
                                        "flex flex-col max-w-[85%] space-y-1",
                                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl text-sm font-medium shadow-sm",
                                            isMe
                                                ? "bg-primary text-slate-950 rounded-tr-none"
                                                : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-1">
                                        <span className="text-[10px] text-slate-400 font-black uppercase">
                                            {isMe ? "You" : msg.senderName} • {format(msg._creationTime || Date.now(), "h:mm a")}
                                        </span>
                                        {isMe && msg.isRead && (
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border-slate-200 font-medium placeholder:text-slate-400"
                />
                <Button type="submit" size="icon" className="bg-slate-900 hover:bg-primary transition-all shadow-lg active:scale-90">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
};

export default ChatBox;
