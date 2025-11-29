import { type FormEvent, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Workspace.css";
import { CurvyViewer } from "../components/CurvyViewer";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
};

type GenerateResponse = {
  job_id: string;
  stl_path: string;
  scad_source: string;
  file_size?: number;
  parameters: {
    shape?: string;
    prompt?: string;
  };
  strategy: string;
  error?: string;
  hint?: string;
};

export function Workspace() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your 3D model generator. Describe what you'd like to create, or attach a reference image for inspiration.\n\nTry prompts like:\n• \"Create a sphere with radius 20mm\"\n• \"Make a hollow cube with 50mm sides\"\n• \"Design a simple vase\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [stlUrl, setStlUrl] = useState<string | undefined>(undefined);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [, setAttachedImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setAttachedImage(base64);
      setAttachedImageFile(file);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  }, [handleImageSelect]);

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt && !attachedImage) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt || "Generate a 3D model based on this image",
      timestamp: new Date(),
      image: attachedImage || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError("");
    setStatus("loading");
    setStlUrl(undefined);

    const imageToSend = attachedImage;
    removeAttachedImage();

    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: imageToSend 
        ? "🔄 Analyzing your reference image and generating 3D model..."
        : "🔄 Generating your 3D model...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const requestBody: { prompt: string; image?: string } = { 
        prompt: prompt || "Create a 3D model based on the provided reference image" 
      };
      
      if (imageToSend) {
        const base64Data = imageToSend.split(',')[1];
        requestBody.image = base64Data;
      }
      
      const { data } = await axios.post<GenerateResponse>(
        `${API_BASE}/api/v1/generate`, 
        requestBody,
        { timeout: 180000 }
      );
      
      if (data.stl_path) {
        const fullStlUrl = `${API_BASE}${data.stl_path}?t=${Date.now()}`;
        setStlUrl(fullStlUrl);
        setResult(data);
        setStatus("ready");

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: `✅ Model generated successfully!\n\n**OpenSCAD Code:**\n\`\`\`openscad\n${data.scad_source}\n\`\`\`\n\n${data.file_size ? `📦 File size: ${(data.file_size / 1024).toFixed(1)} KB` : ''}\n\nYour 3D model is ready! Rotate, zoom, and pan to inspect it.`,
            };
          }
          return updated;
        });
      } else {
        throw new Error(data.error || 'Server did not return STL file');
      }
      
    } catch (err) {
      let detail = "Unknown error";
      let scadSource = "";
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          detail = "Cannot connect to backend server. Make sure the backend is running on http://localhost:8000";
        } else if (err.response) {
          detail = err.response.data?.error || err.response.data?.detail || err.message;
          scadSource = err.response.data?.scad_source || "";
          if (err.response.data?.hint) {
            detail += `\n\n💡 ${err.response.data.hint}`;
          }
        } else {
          detail = err.message || "Network error occurred";
        }
      } else if (err instanceof Error) {
        detail = err.message;
      }
      
      setError(detail);
      setStatus("error");

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === "assistant") {
          let errorContent = `❌ ${detail}`;
          if (scadSource) {
            errorContent += `\n\n**Generated code (may have errors):**\n\`\`\`openscad\n${scadSource}\n\`\`\``;
          }
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: errorContent,
          };
        }
        return updated;
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div 
      className="workspace"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay" onDragLeave={handleDragLeave}>
          <div className="drop-overlay-content">
            <div className="drop-overlay-icon">🖼️</div>
            <div className="drop-overlay-text">Drop your reference image here</div>
            <div className="drop-overlay-hint">The AI will analyze it and generate a 3D model</div>
          </div>
        </div>
      )}

      {/* Left Panel - Chat Interface */}
      <div className="chat-panel">
        <div className="chat-header">
          <Link to="/dashboard" className="back-btn">←</Link>
          <div className="chat-header-text">
            <h1>Curvy</h1>
            <p>AI-powered 3D generation</p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message message-${message.role}`}>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">{message.role === "user" ? "You" : "AI"}</span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                {message.image && (
                  <div className="message-image" style={{ marginBottom: '0.75rem' }}>
                    <img 
                      src={message.image} 
                      alt="Reference" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }} 
                    />
                  </div>
                )}
                <div className="message-text">
                  {(() => {
                    const content = message.content;
                    const codeMatch = content.match(/```openscad\n([\s\S]*?)```/);
                    if (codeMatch) {
                      const beforeCode = content.substring(0, content.indexOf('```openscad'));
                      const code = codeMatch[1];
                      const afterCodeStart = content.indexOf('```', content.indexOf('```openscad') + 12);
                      const afterCode = afterCodeStart !== -1 ? content.substring(afterCodeStart + 3).trim() : '';
                      
                      return (
                        <>
                          {beforeCode && <div style={{whiteSpace: 'pre-wrap'}}>{beforeCode.trim()}</div>}
                          <pre className="code-block">
                            <code>{code}</code>
                          </pre>
                          {afterCode && <div style={{whiteSpace: 'pre-wrap', marginTop: '0.75rem'}}>{afterCode}</div>}
                        </>
                      );
                    }
                    return <div style={{whiteSpace: 'pre-wrap'}}>{content}</div>;
                  })()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-container" onSubmit={handleSubmit}>
          <div className="chat-input-wrapper">
            {attachedImage && (
              <div className="image-preview-container">
                <div className="image-preview">
                  <img src={attachedImage} alt="Attached" />
                  <button 
                    type="button" 
                    className="image-preview-remove"
                    onClick={removeAttachedImage}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            <div className="input-row">
              <div className="input-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className={`action-btn ${attachedImage ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach reference image"
                >
                  📎
                </button>
              </div>
              
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder={attachedImage ? "Describe what to create from this image..." : "Describe the 3D model you want to create..."}
                rows={1}
                disabled={status === "loading"}
              />
              
              <button
                type="submit"
                className="send-button"
                disabled={status === "loading" || (!input.trim() && !attachedImage)}
              >
                {status === "loading" ? <span className="loading-spinner" /> : "→"}
              </button>
            </div>
            
            <div className="chat-status">
              {status === "loading" && <span className="status-indicator loading">Generating model...</span>}
              {status === "ready" && <span className="status-indicator success">Ready</span>}
              {status === "error" && <span className="status-indicator error">Error</span>}
            </div>
          </div>
        </form>
      </div>

      {/* Right Panel - 3D Viewer */}
      <div className="viewer-panel">
        <div className="viewer-header">
          <h2>3D Preview</h2>
          {stlUrl && (
            <div className="viewer-actions">
              <a href={stlUrl} download={`model_${result?.job_id || 'generated'}.stl`} className="download-btn">
                ⬇ Download STL
              </a>
            </div>
          )}
        </div>
        <div className="viewer-content">
          <CurvyViewer url={stlUrl} />
        </div>
      </div>
    </div>
  );
}

export default Workspace;

