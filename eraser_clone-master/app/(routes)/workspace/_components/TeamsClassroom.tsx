import { useState, useEffect } from 'react';
import { getTeamsContext, getChannels, getTeamMembers, sendChannelMessage } from '@/lib/teams-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as microsoftTeams from "@microsoft/teams-js";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

interface Channel {
  id: string;
  displayName: string;
  description?: string;
}

interface TeamMember {
  id: string;
  displayName: string;
  email: string;
}

export function TeamsClassroom() {
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string>('');

  useEffect(() => {
    const initTeams = async () => {
      try {
        const context = await getTeamsContext();
        if (context?.team?.internalId) {
          setTeamId(context.team.internalId);
          const channelsData = await getChannels(context.team.internalId);
          setChannels(channelsData.value);
          
          if (context?.channel?.id) {
            setSelectedChannel(context.channel.id);
          }
        }
      } catch (error) {
        console.error('Error initializing Teams:', error);
      } finally {
        setLoading(false);
      }
    };

    initTeams();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!teamId) return;
      
      try {
        const membersData = await getTeamMembers(teamId);
        setMembers(membersData.value);
      } catch (error) {
        console.error('Error loading members:', error);
      }
    };

    loadMembers();
  }, [teamId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChannel || !teamId) return;

    try {
      await sendChannelMessage(selectedChannel, message);
      setMessage('');
      
      // Add the message to the local state immediately for better UX
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: message,
        sender: 'You',
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-[#e6d3b3]">Loading channels...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Channels List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#e6d3b3] mb-4">Channels</h3>
        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-3 rounded-lg cursor-pointer ${
                selectedChannel === channel.id
                  ? 'bg-[#a67c52] text-[#3e2c1c]'
                  : 'bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a]'
              }`}
              onClick={() => setSelectedChannel(channel.id)}
            >
              <h4 className="font-medium">{channel.displayName}</h4>
              {channel.description && (
                <p className="text-sm opacity-75">{channel.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChannel && (
        <div className="flex-[2] border-t border-[#7c5c3e] bg-[#4b2e19]">
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
      )}

      {/* Members List */}
      {selectedChannel && (
        <div className="w-64 border-l border-[#7c5c3e] p-4 bg-[#3e2c1c]">
          <h3 className="text-lg font-semibold text-[#e6d3b3] mb-4">Members</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 text-[#e6d3b3]"
              >
                <div className="w-8 h-8 rounded-full bg-[#a67c52] flex items-center justify-center">
                  {member.displayName[0]}
                </div>
                <div>
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-xs opacity-75">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
