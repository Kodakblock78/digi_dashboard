"use client";
import React, { useEffect, useState } from "react";
import { Excalidraw, THEME } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";
import { toast } from "sonner";

interface File {
  _id: string;
  fileName: string;
  whiteboard?: string;
}

interface CanvasProps {
  onSaveTrigger: boolean;
  fileId: string;
  fileData: File;
}

const Canvas = ({ onSaveTrigger, fileId, fileData }: CanvasProps) => {
  const [whiteBoard, setWhiteBoard] = useState<readonly ExcalidrawElement[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const shouldSave = whiteBoard.length > 0;
    if (shouldSave) {
      saveWhiteboard();
    }
  }, [onSaveTrigger]);

  useEffect(() => {
    if (fileData?.whiteboard) {
      try {
        const parsedData = JSON.parse(fileData.whiteboard);
        if (JSON.stringify(parsedData) !== JSON.stringify(whiteBoard)) {
          setWhiteBoard(parsedData);
        }
      } catch (error) {
        const errorMessage = 'Error loading canvas data';
        console.error(errorMessage, error);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } else {
      setWhiteBoard([]);
    }
  }, [fileData?.whiteboard]);

  const saveWhiteboard = () => {
    if (!fileId) return;

    try {
      const files = JSON.parse(localStorage.getItem('files') || '[]');
      const currentFile = files.find((f: File) => f._id === fileId);
      
      if (!currentFile) {
        throw new Error("File not found");
      }

      const updatedFiles = files.map((file: File) => 
        file._id === fileId 
          ? { ...file, whiteboard: JSON.stringify(whiteBoard) }
          : file
      );
      
      localStorage.setItem('files', JSON.stringify(updatedFiles));
      toast.success("Canvas saved successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error saving canvas";
      console.error('Error saving canvas:', error);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 underline hover:text-red-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#e6d3b3]">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#7c5c3e] bg-[#4b2e19]">
        <div className="text-[#e6d3b3] text-xl font-bold">
          {fileData.fileName || "Untitled"}
        </div>
      </div>

      {/* Canvas container with adjusted height */}
      <div className="flex-1 bg-[#6e4b2a]">
        <Excalidraw
          theme={THEME.DARK}
          initialData={{
            elements: whiteBoard.length > 0 ? whiteBoard : [],
            appState: {
              viewBackgroundColor: "#6e4b2a",
              theme: THEME.DARK,
              name: fileData.fileName || "Untitled"
            },
            scrollToContent: true
          }}
          onChange={(elements) => {
            setWhiteBoard(elements);
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              saveAsImage: true,
              toggleTheme: true
            },
            dockedSidebarBreakpoint: 0
          }}
        />
      </div>
    </div>
  );
};

export default Canvas;
