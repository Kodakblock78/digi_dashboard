"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type?: 'message' | 'system';
}

interface ChatRoomProps {
  roomId: string;
}

let ws: WebSocket;

export function ChatRoom({ roomId }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useKindeBrowserClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(`ws://localhost:3000/api/socket`);

        ws.onopen = () => {
          console.log('Connected to WebSocket server');
          if (isMounted) {
            setIsConnected(true);
            reconnectAttempts = 0;
            // Rejoin room if we were in one before reconnecting
            if (roomCode && user?.given_name) {
              ws.send(JSON.stringify({
                type: 'join',
                room: roomCode,
                username: user.given_name
              }));
            }
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;

          const message = JSON.parse(event.data);
          console.log('Message received:', message);

          if (message.type === 'system') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              content: message.content,
              sender: 'System',
              timestamp: new Date(message.timestamp),
              type: 'system'
            }]);
          } else {
            setMessages(prev => [...prev, {
              ...message,
              timestamp: new Date(message.timestamp)
            }]);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (isMounted) {
            setIsConnected(false);
            // Attempt to reconnect if not at max attempts
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
              setTimeout(connectWebSocket, 1000 * reconnectAttempts);
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted) setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        if (isMounted) setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (ws) {
        ws.close();
      }
    };
  }, [roomCode, user?.given_name]);

  const joinRoom = (code: string) => {
    if (!code.trim() || !user?.given_name) {
      toast({
        title: "Error",
        description: "Please enter a room code and make sure you're signed in",
        variant: "destructive"
      });
      return;
    }

    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join',
          room: code,
          username: user.given_name
        }));
        setRoomCode(code);
        setShowJoinDialog(false);
        
        // Add initial system message
        setMessages([{
          id: Date.now().toString(),
          content: `Welcome to room ${code}`,
          sender: 'System',
          timestamp: new Date(),
          type: 'system'
        }]);
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join the room. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user?.given_name || !roomCode) {
      toast({
        title: "Error",
        description: "Please enter a message and make sure you're in a room",
        variant: "destructive"
      });
      return;
    }

    try {
      if (ws.readyState === WebSocket.OPEN) {
        // Add message to local state immediately for better UX
        const newMessage = {
          id: Date.now().toString(),
          content: message,
          sender: user.given_name,
          timestamp: new Date(),
          type: 'message'
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Send to server
        ws.send(JSON.stringify({
          type: 'message',
          room: roomCode,
          content: message,
          username: user.given_name
        }));

        setMessage('');
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full text-[#e6d3b3]">
        Connecting to chat server...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#4b2e19]">
      <Dialog 
        open={showJoinDialog} 
        onOpenChange={setShowJoinDialog}
        modal={true}
      >
        <DialogContent className="bg-[#3e2c1c] border-[#7c5c3e]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[#e6d3b3]">Join Classroom</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter classroom code"
              className="bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3] placeholder:text-[#a67c52]"
            />
            <Button
              onClick={() => joinRoom(roomCode)}
              className="w-full bg-[#a67c52] text-[#3e2c1c] hover:bg-[#e6d3b3]"
              disabled={!roomCode.trim()}
            >
              Join
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender === 'System'
                ? 'bg-[#5c432a] text-[#a67c52] italic text-center'
                : msg.sender === user?.given_name
                ? 'bg-[#a67c52] text-[#3e2c1c] ml-auto'
                : 'bg-[#5c432a] text-[#e6d3b3]'
            } max-w-[80%]`}
          >
            {msg.sender !== 'System' && (
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{msg.sender}</span>
                <span className="text-xs opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
            <p className={msg.sender === 'System' ? 'text-sm' : ''}>
              {msg.content}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#7c5c3e]">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3] placeholder:text-[#a67c52]"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-[#a67c52] text-[#3e2c1c] hover:bg-[#e6d3b3]"
            disabled={!message.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}