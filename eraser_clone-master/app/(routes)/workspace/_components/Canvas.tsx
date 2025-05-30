"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import styles from "../_styles/canvasStyles.module.css";

// Dynamically import Excalidraw for Next.js (no SSR)
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

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
  const [elements, setElements] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const previousTrigger = useRef(false);

  // Load whiteboard data from localStorage
  useEffect(() => {
    try {
      const files = JSON.parse(localStorage.getItem("files") || "[]");
      const currentFile = files.find((f: File) => f._id === fileId);
      if (currentFile?.whiteboard) {
        setElements(JSON.parse(currentFile.whiteboard));
      }
    } catch (err) {
      toast.error("Failed to load canvas data");
    }
    setIsReady(true);
  }, [fileId]);

  // Save to localStorage when triggered
  useEffect(() => {
    if (onSaveTrigger && !previousTrigger.current) {
      try {
        const files = JSON.parse(localStorage.getItem("files") || "[]");
        const updatedFiles = files.map((file: File) =>
          file._id === fileId
            ? { ...file, whiteboard: JSON.stringify(elements) }
            : file
        );
        localStorage.setItem("files", JSON.stringify(updatedFiles));
        toast.success("Canvas saved");
      } catch {
        toast.error("Failed to save canvas");
      }
    }
    previousTrigger.current = onSaveTrigger;
  }, [onSaveTrigger, elements, fileId]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full text-[#e6d3b3]">
        Loading canvas...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#7c5c3e] bg-[#4b2e19]">
        <div className="text-[#e6d3b3] text-xl font-bold">
          {fileData.fileName || "Untitled"}
        </div>
      </div>
      <div className={`${styles.canvasWrapper} flex-1`}>
        <Excalidraw
          initialData={{
            elements,
            appState: {
              viewBackgroundColor: "#6e4b2a",
              theme: "dark",
              name: fileData.fileName || "Untitled",
            },
            scrollToContent: true,
          }}
          onChange={setElements}
        />
      </div>
    </div>
  );
};

export default Canvas;
