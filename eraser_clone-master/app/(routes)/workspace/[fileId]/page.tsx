"use client";
import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkSpaceHeader from "../_components/WorkSpaceHeader";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { TeamsClassroom } from "../_components/TeamsClassroom";

interface File {
  _id: string;
  fileName: string;
  content?: string;
  document?: string;
  whiteboard?: string;
}

const Editor = dynamic(() => import("../_components/Editor"), {
  ssr: false,
});

const Canvas = dynamic(() => import("../_components/Canvas"), {
  ssr: false,
});

const Workspace = ({ params }: any) => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [triggerSave, setTriggerSave] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarView, setSidebarView] = useState<'admin' | 'student'>('student');

  // Load files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('files');
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles);
      setFiles(parsedFiles);
    }
  }, []); // Only run on mount

  // Handle file selection when params.fileId changes
  useEffect(() => {
    if (params.fileId && files.length > 0) {
      const fileToSelect = files.find((f: File) => f._id === params.fileId);
      if (fileToSelect) {
        setSelectedFileId(params.fileId);
        setCurrentFileName(fileToSelect.fileName);
      }
    }
  }, [params.fileId, files]);

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setCurrentFileName(files.find((file) => file._id === fileId)?.fileName || "");
  };

  const handleSaveFile = React.useCallback(() => {
    if (!selectedFileId) {
      toast.error('No file selected');
      return;
    }
    
    try {
      // Load current files to get the latest content
      const currentFiles = JSON.parse(localStorage.getItem('files') || '[]');
      const currentFile = currentFiles.find((f: File) => f._id === selectedFileId);
      
      if (!currentFile) {
        toast.error('File not found');
        return;
      }

      // Keep existing content/whiteboard data and update the filename if changed
      const updatedFiles = currentFiles.map((file: File) => 
        file._id === selectedFileId 
          ? { 
              ...file,
              fileName: currentFileName || file.fileName
            }
          : file
      );

      setFiles(updatedFiles);
      localStorage.setItem('files', JSON.stringify(updatedFiles));
      
      // Trigger save on Editor and Canvas components
      setTriggerSave(prev => !prev);
      toast.success('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Error saving file');
    }
  }, [selectedFileId, currentFileName]);

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file._id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem('files', JSON.stringify(updatedFiles));
    
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
      setCurrentFileName("");
    }
  };

  const handleRenameFile = () => {
    if (!selectedFileId) return;

    const newName = prompt("Enter new file name", currentFileName);
    if (!newName || newName.trim() === "") return;

    const updatedFiles = files.map(file => 
      file._id === selectedFileId 
        ? { ...file, fileName: newName }
        : file
    );
    
    setFiles(updatedFiles);
    setCurrentFileName(newName);
    localStorage.setItem('files', JSON.stringify(updatedFiles));
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;

    const newFile = {
      _id: Date.now().toString(), // Simple unique ID generation
      fileName: newFileName,
      content: ""
    };

    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    localStorage.setItem('files', JSON.stringify(updatedFiles));
    setNewFileName("");
    setShowNewFileModal(false);
  };

  const Tabs = [
    {
      name: "Document",
    },
    {
      name: "Classroom",
    },
    {
      name: "Canvas",
    },
  ];

  const [activeTab, setActiveTab] = useState(Tabs[2].name); // Set Canvas as default

  return (
    <div className="overflow-hidden w-full bg-[#4b2e19]">
      <WorkSpaceHeader
        Tabs={Tabs}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        onSave={() => setTriggerSave(!triggerSave)}
        file={files.find((f) => f._id === selectedFileId)}
      />
      {activeTab === "Document" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
            background: "#6e4b2a",
          }}
        >
          <div className="flex h-full w-full">
            {/* Sidebar for file list */}
            <div className="w-72 bg-[#3e2c1c] border-r border-[#7c5c3e] flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#e6d3b3]">My Files</h2>
                <button
                  className="bg-[#a67c52] text-[#3e2c1c] rounded px-2 py-1 text-xs font-bold hover:bg-[#e6d3b3] transition"
                  onClick={() => setShowNewFileModal(true)}
                >
                  + New
                </button>
              </div>
              <ul className="flex-1 overflow-y-auto space-y-2">
                {files.map((file, idx) => (
                  <li
                    key={file._id}
                    className={`p-2 rounded cursor-pointer flex items-center justify-between group ${
                      selectedFileId === file._id
                        ? "bg-[#a67c52] text-[#3e2c1c]"
                        : "hover:bg-[#5c432a] text-[#e6d3b3]"
                    }`}
                    onClick={() => handleSelectFile(file._id)}
                  >
                    <span className="truncate max-w-[120px]">{file.fileName}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        className="text-xs text-[#e6d3b3] hover:text-blue-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFile(file._id);
                          setActiveTab("Canvas");
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="text-xs text-[#e6d3b3] hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file._id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main editor area */}
            <div className="flex-1 flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#7c5c3e] bg-[#4b2e19]">
                <input
                  className="bg-transparent text-[#e6d3b3] text-xl font-bold outline-none border-b border-transparent focus:border-[#a67c52] transition w-1/2"
                  value={currentFileName}
                  onChange={(e) => setCurrentFileName(e.target.value)}
                  placeholder="Untitled File"
                  disabled={!selectedFileId}
                />
                <div className="flex gap-2">
                  <button
                    className="bg-[#a67c52] text-[#3e2c1c] rounded px-4 py-1 font-semibold hover:bg-[#e6d3b3] transition disabled:opacity-50"
                    onClick={handleSaveFile}
                    disabled={!selectedFileId}
                  >
                    Save
                  </button>
                  <button
                    className="bg-[#5c432a] text-[#e6d3b3] rounded px-4 py-1 font-semibold hover:bg-[#a67c52] transition"
                    onClick={handleRenameFile}
                    disabled={!selectedFileId}
                  >
                    Rename
                  </button>
                  <button
                    className="bg-[#5c432a] text-[#e6d3b3] rounded px-4 py-1 font-semibold hover:bg-[#a67c52] transition"
                    onClick={() => setActiveTab("Canvas")}
                    disabled={!selectedFileId}
                  >
                    Open in Canvas
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#6e4b2a]">
                {selectedFileId ? (
                  <Editor
                    onSaveTrigger={triggerSave}
                    fileId={selectedFileId}
                    fileData={files.find((f) => f._id === selectedFileId)!}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
                    Select or create a file to start editing.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New File Modal */}
          {showNewFileModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-[#3e2c1c] p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-lg font-semibold text-[#e6d3b3] mb-4">
                  Create New File
                </h3>
                <input
                  className="w-full p-2 rounded bg-[#5c432a] text-[#e6d3b3] mb-4 outline-none border border-[#7c5c3e] focus:border-[#a67c52]"
                  placeholder="File name"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-1 rounded bg-[#a67c52] text-[#3e2c1c] font-semibold hover:bg-[#e6d3b3]"
                    onClick={handleCreateFile}
                    disabled={!newFileName.trim()}
                  >
                    Create
                  </button>
                  <button
                    className="px-4 py-1 rounded bg-[#5c432a] text-[#e6d3b3] font-semibold hover:bg-[#a67c52]"
                    onClick={() => setShowNewFileModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "Both" ? (
        <ResizablePanelGroup
          style={{
            height: "calc(100vh - 3rem)",
            background: "#6e4b2a",
          }}
          direction="horizontal"
        >
          <ResizablePanel defaultSize={50} minSize={40} collapsible={false}>
            {selectedFileId && files.find((f) => f._id === selectedFileId) ? (
              <Editor
                onSaveTrigger={triggerSave}
                fileId={selectedFileId}
                fileData={files.find((f) => f._id === selectedFileId)!}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
                Select or create a file to start editing.
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle className="bg-[#7c5c3e]" />
          <ResizablePanel defaultSize={50} minSize={45}>
            {selectedFileId && files.find((f) => f._id === selectedFileId) ? (
              <Canvas
                onSaveTrigger={triggerSave}
                fileId={selectedFileId}
                fileData={files.find((f) => f._id === selectedFileId)!}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
                Select or create a file to start editing.
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : activeTab === "Canvas" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
            background: "#6e4b2a",
          }}
        >
          {selectedFileId && files.find((f) => f._id === selectedFileId) ? (
            <Canvas
              onSaveTrigger={triggerSave}
              fileId={selectedFileId}
              fileData={files.find((f) => f._id === selectedFileId)!}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
              Select or create a file to start editing.
            </div>
          )}
        </div>
      ) : activeTab === "Classroom" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
            background: "#6e4b2a",
          }}
          className="flex"
        >
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-t-[#e6d3b3] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <p className="text-[#e6d3b3] text-sm">Loading classroom...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar with tabs */}
              <div className="w-72 bg-[#3e2c1c] border-r border-[#7c5c3e] flex flex-col p-4">
                {/* View switcher tabs */}
                <div className="flex mb-4 border border-[#7c5c3e] rounded-lg">
                  <button
                    onClick={() => setSidebarView('student')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg ${
                      sidebarView === 'student'
                        ? 'bg-[#a67c52] text-[#3e2c1c]'
                        : 'text-[#e6d3b3] hover:bg-[#5c432a]'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setSidebarView('admin')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg ${
                      sidebarView === 'admin'
                        ? 'bg-[#a67c52] text-[#3e2c1c]'
                        : 'text-[#e6d3b3] hover:bg-[#5c432a]'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* Content based on selected view */}
                <h2 className="text-lg font-semibold text-[#e6d3b3] mb-4">
                  {sidebarView === 'admin' ? 'Manage Rooms' : 'Available Rooms'}
                </h2>
                <ul className="flex-1 overflow-y-auto space-y-2">
                  {sidebarView === 'admin' ? (
                    <>
                      {Array.from({ length: 3 }, (_, idx) => (
                        <li
                          key={idx}
                          className="p-2 rounded cursor-pointer bg-[#5c432a] hover:bg-[#a67c52] text-[#e6d3b3] flex justify-between items-center"
                        >
                          <span>Admin Room {idx + 1}</span>
                          <div className="flex gap-2 text-xs">
                            <button className="hover:text-blue-400">Edit</button>
                            <button className="hover:text-red-400">Delete</button>
                          </div>
                        </li>
                      ))}
                      <button className="w-full mt-2 p-2 rounded bg-[#a67c52] text-[#3e2c1c] hover:bg-[#e6d3b3] transition text-sm font-medium">
                        + Create Room
                      </button>
                    </>
                  ) : (
                    Array.from({ length: 5 }, (_, idx) => (
                      <li
                        key={idx}
                        className="p-2 rounded cursor-pointer bg-[#5c432a] hover:bg-[#a67c52] text-[#e6d3b3] flex justify-between items-center"
                      >
                        <span>Room {idx + 1}</span>
                        <span className="text-xs text-[#a67c52]">12 online</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Main chat area */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-6 py-3 border-b border-[#7c5c3e] bg-[#4b2e19]">
                  <h2 className="text-xl font-bold text-[#e6d3b3]">
                    {sidebarView === 'admin' ? 'Classroom Management' : 'Welcome to the Classroom'}
                  </h2>
                </div>
                <div className="flex-1 bg-[#6e4b2a] p-4 overflow-y-auto">
                  <p className="text-[#e6d3b3]">
                    {sidebarView === 'admin' 
                      ? 'Select a room to manage or create a new one.'
                      : 'Select a room to start chatting.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Workspace;
