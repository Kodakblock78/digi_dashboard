import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TeamsClassroom() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading messages
    setTimeout(() => {
      setMessages([
        {
          id: '1',
          content: 'Welcome to the class!',
          sender: 'Teacher',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          content: 'Please complete the assignment by Friday.',
          sender: 'Teacher',
          timestamp: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Here you would usually send the message to the server
    // For this example, we'll just add it to the local state

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: message,
        sender: 'You',
        timestamp: new Date().toISOString(),
      },
    ]);
    setMessage('');
  };

  if (loading) return <div className="flex items-center justify-center h-full text-[#e6d3b3]">Loading messages...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Area */}
      <div className="flex-1 border-t border-[#7c5c3e] bg-[#4b2e19]">
        {/* Messages */}
        <div className="h-[calc(100%-80px)] overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-[#5c432a] rounded-lg p-3 text-[#e6d3b3]"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{msg.sender}</span>
                <span className="text-xs opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1">{msg.content}</p>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="h-20 border-t border-[#7c5c3e] p-4 flex gap-2">
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
