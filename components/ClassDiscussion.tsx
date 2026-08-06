"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Pin, Search, MoreHorizontal } from "lucide-react";

interface DiscussionMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  isPinned: boolean;
  isTeacher: boolean;
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
}

interface ClassDiscussionProps {
  classId: string;
  userId: string;
  isTeacher: boolean;
}

export function ClassDiscussion({ classId, userId, isTeacher }: ClassDiscussionProps) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<DiscussionMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [classId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/classes/${classId}/discussions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/classes/${classId}/discussions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          replyToId: replyTo?.id,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        setReplyTo(null);
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/classes/${classId}/discussions/${messageId}/pin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to pin message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/classes/${classId}/discussions/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedMessages = filteredMessages.filter((msg) => msg.isPinned);
  const regularMessages = filteredMessages.filter((msg) => !msg.isPinned);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Nu";
    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffHours < 24) return `${diffHours}u geleden`;
    if (diffDays < 7) return `${diffDays}d geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Klas Discussie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Klas Discussie
            </CardTitle>
            <Badge variant="secondary">{messages.length} berichten</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek berichten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {pinnedMessages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Pin className="w-4 h-4" />
              Vastgepinde Berichten
            </div>
            {pinnedMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                isTeacher={isTeacher}
                userId={userId}
                onReply={setReplyTo}
                onPin={() => handlePinMessage(message.id)}
                onDelete={() => handleDeleteMessage(message.id)}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {regularMessages.length > 0 && pinnedMessages.length > 0 && (
            <div className="border-t pt-3" />
          )}
          {regularMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              isTeacher={isTeacher}
              userId={userId}
              onReply={setReplyTo}
              onPin={() => handlePinMessage(message.id)}
              onDelete={() => handleDeleteMessage(message.id)}
              formatTime={formatTime}
            />
          ))}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Reageert op {replyTo.authorName}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyTo(null)}
              >
                Annuleren
              </Button>
            </div>
            <div className="text-sm text-muted-foreground p-2 rounded bg-background">
              {replyTo.content}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Typ je bericht..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MessageCardProps {
  message: DiscussionMessage;
  isTeacher: boolean;
  userId: string;
  onReply: (message: DiscussionMessage) => void;
  onPin: () => void;
  onDelete: () => void;
  formatTime: (date: string) => string;
}

function MessageCard({ message, isTeacher, userId, onReply, onPin, onDelete, formatTime }: MessageCardProps) {
  const isOwnMessage = message.authorId === userId;
  const canModerate = isTeacher;

  return (
    <Card className={`${isOwnMessage ? "bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.authorAvatar} />
            <AvatarFallback>{message.authorName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{message.authorName}</span>
              {message.isTeacher && (
                <Badge variant="secondary" className="text-xs">Docent</Badge>
              )}
              {message.isPinned && (
                <Pin className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
              {canModerate && (
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={onPin}
                  >
                    <Pin className="w-3 h-3" />
                  </Button>
                  {(isOwnMessage || canModerate) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={onDelete}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {message.replyTo && (
              <div className="text-sm text-muted-foreground mb-2 p-2 rounded bg-muted/50">
                <span className="font-medium">{message.replyTo.authorName}:</span> {message.replyTo.content}
              </div>
            )}
            
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => onReply(message)}
              >
                Reageren
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
