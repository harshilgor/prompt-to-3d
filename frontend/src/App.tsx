import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import { StlViewer } from "./components/StlViewer";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Pattern = "solid" | "slots" | "honeycomb";
type Shape = "cylinder" | "box" | "sphere";
type Strategy = "llm" | "template";

type GenerateResponse = {
  job_id: string;
  stl_path: string;
  scad_source: string;
  parameters: {
    shape: Shape;
    height_mm: number;
    width_mm: number;
    depth_mm: number;
    wall_thickness_mm: number;
    pattern: Pattern;
    hollow: boolean;
  };
  strategy: Strategy;
};

function App() {
  const [prompt, setPrompt] = useState(
    "Tall cylindrical pencil holder with hex vents and angled base",
  );
  const [shape, setShape] = useState<Shape>("cylinder");
  const [pattern, setPattern] = useState<Pattern>("slots");
  const [strategy, setStrategy] = useState<Strategy>("llm");
  const [height, setHeight] = useState("120");
  const [width, setWidth] = useState("70");
  const [depth, setDepth] = useState("70");
  const [wall, setWall] = useState("3");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<(GenerateResponse & { stlUrl: string }) | null>(null);

  const strategyCopy: Record<Strategy, { title: string; caption: string }> = {
    llm: {
      title: "LLM composer",
      caption: "OpenAI-powered complex geometry",
    },
    template: {
      title: "Template rig",
      caption: "Deterministic primitives + patterns",
    },
  };

  const statusLabel = useMemo(() => {
    switch (status) {
      case "loading":
        return "Generating model...";
      case "ready":
        return "Model ready";
      case "error":
        return "Something went wrong";
      default:
        return "Idle";
    }
  }, [status]);

  const parseNumber = (value: string) => (value ? Number(value) : undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Enter a prompt first.");
      return;
    }
    setError("");
    setStatus("loading");

    try {
      const payload = {
        prompt,
        target_shape: shape,
        height_mm: parseNumber(height),
        width_mm: parseNumber(width),
        depth_mm: parseNumber(depth),
        wall_thickness_mm: parseNumber(wall),
        pattern,
        strategy,
      };
      const { data } = await axios.post<GenerateResponse>(`${API_BASE}/api/v1/generate`, payload);
      const stlUrl = `${API_BASE}${data.stl_path}?t=${Date.now()}`;
      setResult({ ...data, stlUrl });
      setStatus("ready");
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : "Unknown error";
      setError(detail);
      setStatus("error");
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p>Prompt-to-print playground</p>
        <h1>Generate printable 3D models with OpenSCAD</h1>
        <p>
          Describe an object, choose the compiler (LLM or deterministic templates), and preview the STL
          instantly.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Model prompt</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="prompt">Prompt</label>
              <textarea
                id="prompt"
                name="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g. Helical vase with twisting ribs"
              />
            </div>

            <div className="field">
              <label htmlFor="shape">Shape</label>
              <select
                id="shape"
                name="shape"
                value={shape}
                onChange={(event) => setShape(event.target.value as Shape)}
              >
                <option value="cylinder">Cylinder</option>
                <option value="box">Box</option>
                <option value="sphere">Sphere</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="pattern">Pattern</label>
              <select
                id="pattern"
                name="pattern"
                value={pattern}
                onChange={(event) => setPattern(event.target.value as Pattern)}
              >
                <option value="solid">Solid shell</option>
                <option value="slots">Radial slots</option>
                <option value="honeycomb">Honeycomb shell</option>
              </select>
            </div>

            <div className="field">
              <label>Generation mode</label>
              <div className="strategy-toggle">
                {(Object.keys(strategyCopy) as Strategy[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="strategy-option"
                    data-active={strategy === value}
                    onClick={() => setStrategy(value)}
                  >
                    <span>{strategyCopy[value].title}</span>
                    <small>{strategyCopy[value].caption}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Dimensions (mm)</label>
              <div className="layout" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <input
                  type="number"
                  min="10"
                  placeholder="Height"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                />
                <input
                  type="number"
                  min="10"
                  placeholder="Width"
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                />
                <input
                  type="number"
                  min="10"
                  placeholder="Depth"
                  value={depth}
                  onChange={(event) => setDepth(event.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="wall">Wall thickness (mm)</label>
              <input
                id="wall"
                type="number"
                min="1"
                step="0.5"
                value={wall}
                onChange={(event) => setWall(event.target.value)}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Generating..." : "Generate model"}
              </button>
              <span className="status-pill">{statusLabel}</span>
            </div>
          </form>
        </section>

        <section className="panel viewer-wrapper">
          <h2>Preview</h2>
          <StlViewer url={result?.stlUrl} />

          {result && (
            <div className="result-meta">
              <div>
                <strong>Download</strong>
                <p>
                  <a className="download-link" href={result.stlUrl} target="_blank" rel="noreferrer">
                    STL file
                  </a>
                </p>
              </div>
              <div>
                <strong>Parameters</strong>
                <p>
                  {Math.round(result.parameters.height_mm)}  {Math.round(result.parameters.width_mm)} 
                  {" "}
                  {Math.round(result.parameters.depth_mm)} mm  pattern {result.parameters.pattern}
                </p>
              </div>
              <div>
                <strong>Compiler</strong>
                <p>{result.strategy === "llm" ? "LLM (OpenAI)" : "Template engine"}</p>
              </div>
              <div>
                <strong>OpenSCAD source</strong>
                <pre>{result.scad_source}</pre>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
