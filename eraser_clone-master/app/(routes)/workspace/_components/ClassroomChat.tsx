'use client';

import { useState, useEffect } from 'react';
import { ChatRoom } from './ChatRoom';
import { Plus, Trash2, User2, ChevronRight, Shield, Users, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface Room {
  id: string;
  name: string;
  participantCount: number;
}

// Create default rooms with numbered groups
const createDefaultRooms = () => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `room-${i}`,
    name: `Chat Group ${i}`,
    participantCount: 0
  }));
};

export function ClassroomChat() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [view, setView] = useState<'student' | 'admin'>('student');
  const [userRole, setUserRole] = useState<'admin' | 'follower'>('follower');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const savedRooms = localStorage.getItem('chatRooms');
      return savedRooms ? JSON.parse(savedRooms) : createDefaultRooms();
    } catch {
      return createDefaultRooms();
    }
  });

  // Update userRole when view changes
  useEffect(() => {
    setUserRole(view === 'admin' ? 'admin' : 'follower');
  }, [view]);

  useEffect(() => {
    localStorage.setItem('chatRooms', JSON.stringify(rooms));
  }, [rooms]);

  const handleCreateRoom = () => {
    const nextGroupNumber = rooms.length;
    const newRoom = {
      id: `room-${Date.now()}`,
      name: `Chat Group ${nextGroupNumber}`,
      participantCount: 0,
      participants: []
    };
    setRooms([...rooms, newRoom]);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRoomToDelete(roomId);
  };

  const confirmDeleteRoom = (roomId: string) => {
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    // Rename remaining rooms to maintain sequential numbering
    const renamedRooms = updatedRooms.map((room, index) => ({
      ...room,
      name: `Chat Group ${index}`
    }));
    setRooms(renamedRooms);
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
    }
    setRoomToDelete(null); // Close the dialog
    toast.success('Chat room deleted');
  };

  const handleJoinRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowNamePrompt(false);

    setRooms(updatedRooms);
    setSelectedRoom(room);
    setShowNamePrompt(false);
  };

  const handleRenameRoom = (roomId: string) => {
    if (!editingName.trim()) return;
    const updatedRooms = rooms.map(room => 
      room.id === roomId ? { ...room, name: editingName } : room
    );
    setRooms(updatedRooms);
    setEditingRoomId(null);
    setEditingName('');
    toast.success('Room name updated');
  };

  if (showNamePrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#3e2c1c] p-8 rounded-xl w-[480px] shadow-2xl border border-[#7c5c3e] relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowNamePrompt(false);
                setSelectedRoom(null);
              }}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-[#5c432a] transition-all text-[#7c5c3e] hover:text-[#e6d3b3] transform hover:rotate-90"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#a67c52] flex items-center justify-center mb-4">
                {view === 'admin' ? (
                  <Shield className="h-6 w-6 text-[#3e2c1c]" />
                ) : (
                  <Users className="h-6 w-6 text-[#3e2c1c]" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#e6d3b3] mb-2">Welcome to Chat</h2>
              <p className="text-[#a67c52] mb-6">Joining as {view === 'admin' ? 'Administrator' : 'Student'}</p>
              
              {/* View Selection */}
              <div className="w-full mb-6">
                <div className="flex mb-4 border border-[#7c5c3e] rounded-lg">
                  <button
                    onClick={() => setView('student')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg ${
                      view === 'student'
                        ? 'bg-[#a67c52] text-[#3e2c1c]'
                        : 'text-[#e6d3b3] hover:bg-[#5c432a]'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setView('admin')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg ${
                      view === 'admin'
                        ? 'bg-[#a67c52] text-[#3e2c1c]'
                        : 'text-[#e6d3b3] hover:bg-[#5c432a]'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div className="w-full mb-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#5c432a] text-[#e6d3b3] outline-none border-2 border-[#7c5c3e] focus:border-[#a67c52] transition-colors placeholder-[#7c5c3e]"
                  placeholder={`Enter your name (${view === 'admin' ? 'Admin' : 'Student'})`}
                  autoFocus
                />
              </div>

              {/* Group Selection */}
              <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[#e6d3b3] text-left font-medium">Select a Group:</h3>
                  {view === 'admin' && (
                    <Button
                      onClick={handleCreateRoom}
                      className="bg-[#a67c52] text-[#3e2c1c] hover:bg-[#e6d3b3] flex items-center gap-2 px-3 py-1 h-8"
                    >
                      <Plus className="w-4 h-4" />
                      Create Room
                    </Button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-[#7c5c3e] p-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full p-3 rounded-lg flex items-center justify-between ${
                        selectedRoom?.id === room.id
                          ? 'bg-[#a67c52] text-[#3e2c1c]'
                          : 'bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-sm opacity-75">
                          ({room.participantCount} {room.participantCount === 1 ? 'member' : 'members'})
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={() => {
                  if (selectedRoom) {
                    handleJoinRoom(selectedRoom);
                  } else {
                    toast.error('Please select a group');
                  }
                }}
                disabled={!userName.trim() || !selectedRoom}
                className="w-full px-4 py-3 bg-[#a67c52] text-[#3e2c1c] rounded-lg font-medium hover:bg-[#e6d3b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Join {selectedRoom ? selectedRoom.name : 'Chat'} as {view === 'admin' ? 'Admin' : 'Student'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar with rooms */}
      <div className="w-72 bg-[#3e2c1c] border-r border-[#7c5c3e] flex flex-col p-4">
        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setView('student')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg ${
              view === 'student'
                ? 'bg-[#a67c52] text-[#3e2c1c]'
                : 'text-[#e6d3b3] hover:bg-[#5c432a]'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg ${
              view === 'admin'
                ? 'bg-[#a67c52] text-[#3e2c1c]'
                : 'text-[#e6d3b3] hover:bg-[#5c432a]'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#e6d3b3]">Chat Groups</h2>
            {view === 'admin' && (
              <button
                onClick={handleCreateRoom}
                className="p-1 rounded hover:bg-[#5c432a]"
                title="Add new chat group"
              >
                <Plus className="w-5 h-5 text-[#e6d3b3]" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                  selectedRoom?.id === room.id
                    ? 'bg-[#a67c52] text-[#3e2c1c]'
                    : 'bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a]'
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <div>
                  {editingRoomId === room.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRenameRoom(room.id);
                        } else if (e.key === 'Escape') {
                          setEditingRoomId(null);
                        }
                      }}
                      className="bg-[#2a1810] text-[#e6d3b3] border border-[#7c5c3e] rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-[#a67c52]"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="font-medium">{room.name}</div>
                  )}
                  <div className="text-sm opacity-75">
                    <User2 size={16} className="inline mr-1" /> Chat Room
                  </div>
                </div>
                {view === 'admin' && (
                  <div className="flex gap-2">
                    {editingRoomId === room.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameRoom(room.id);
                        }}
                        className="p-1 rounded hover:bg-[#7c5c3e] transition-colors text-[#e6d3b3]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRoomId(room.id);
                          setEditingName(room.name);
                        }}
                        className="p-1 rounded hover:bg-[#7c5c3e] transition-colors text-[#e6d3b3]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                      }}
                      className="p-1 rounded hover:bg-[#7c5c3e] transition-colors text-[#e6d3b3]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        {selectedRoom ? (
          <ChatRoom 
            roomId={selectedRoom.id} 
            userName={userName} 
            userRole={userRole}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#e6d3b3]">
            Select a chat group to start messaging
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={roomToDelete !== null} onOpenChange={() => setRoomToDelete(null)}>
        <DialogContent className="bg-[#3e2c1c] border-[#7c5c3e]">
          <DialogHeader>
            <DialogTitle className="text-[#e6d3b3]">Delete Chat Room</DialogTitle>
          </DialogHeader>
          <div className="text-[#e6d3b3] py-4">
            Are you sure you want to delete this chat room? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoomToDelete(null)}
              className="bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a] border-[#7c5c3e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => roomToDelete && confirmDeleteRoom(roomToDelete)}
              className="bg-[#a67c52] text-[#3e2c1c] hover:bg-[#e6d3b3]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
