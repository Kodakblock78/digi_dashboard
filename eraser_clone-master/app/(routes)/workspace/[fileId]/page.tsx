"use client";
import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkSpaceHeader from "../_components/WorkSpaceHeader";
import dynamic from "next/dynamic";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FILE } from "../../dashboard/_components/DashboardTable";

const Editor = dynamic(() => import("../_components/Editor"), {
  ssr: false,
});

const Canvas = dynamic(() => import("../_components/Canvas"), {
  ssr: false,
});

const Workspace = ({ params }: any) => {
  const convex = useConvex();

  const [fileData, setfileData] = useState<FILE>();
  const [files, setFiles] = useState<FILE[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [triggerSave, setTriggerSave] = useState(false);

  useEffect(() => {
    params.fileId && getFileData();
  }, []);

  const getFileData = async () => {
    const file = await convex.query(api.files.getFilebyId, {
      _id: params.fileId,
    });

    setfileData(file);
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setCurrentFileName(files.find((file) => file.id === fileId)?.name || "");
  };

  const handleSaveFile = async () => {
    if (!selectedFileId) return;

    await convex.mutation(api.files.updateFile, {
      _id: selectedFileId,
      name: currentFileName,
      content: "", // Add content here if needed
    });

    setTriggerSave(!triggerSave);
  };

  const handleDeleteFile = async (fileId: string) => {
    await convex.mutation(api.files.deleteFile, { _id: fileId });

    setFiles(files.filter((file) => file.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
      setCurrentFileName("");
    }
  };

  const handleRenameFile = async () => {
    if (!selectedFileId) return;

    const newName = prompt("Enter new file name", currentFileName);
    if (!newName || newName.trim() === "") return;

    await convex.mutation(api.files.updateFile, {
      _id: selectedFileId,
      name: newName,
      content: "", // Add content here if needed
    });

    setCurrentFileName(newName);
    setTriggerSave(!triggerSave);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    const newFile = await convex.mutation(api.files.createFile, {
      name: newFileName,
      content: "", // Add default content here if needed
    });

    setFiles([...files, newFile]);
    setNewFileName("");
    setShowNewFileModal(false);
  };

  const Tabs = [
    {
      name: "Document",
    },
    {
      name: "AI",
    },
    {
      name: "Canvas",
    },
  ];

  const [activeTab, setActiveTab] = useState(Tabs[1].name);

  return (
    <div className="overflow-hidden w-full bg-[#4b2e19]">
      <WorkSpaceHeader
        Tabs={Tabs}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        onSave={() => setTriggerSave(!triggerSave)}
        file={fileData}
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
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#6e4b2a]">
                {selectedFileId ? (
                  <Editor
                    onSaveTrigger={triggerSave}
                    fileId={selectedFileId}
                    fileData={
                      files.find((f) => f._id === selectedFileId) || fileData!
                    }
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
            <Editor
              onSaveTrigger={triggerSave}
              fileId={params.fileId}
              fileData={fileData!}
            />
          </ResizablePanel>
          <ResizableHandle className="bg-[#7c5c3e]" />
          <ResizablePanel defaultSize={50} minSize={45}>
            <Canvas
              onSaveTrigger={triggerSave}
              fileId={params.fileId}
              fileData={fileData!}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : activeTab === "Canvas" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
            background: "#6e4b2a",
          }}
        >
          <Canvas
            onSaveTrigger={triggerSave}
            fileId={params.fileId}
            fileData={fileData!}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Workspace;
