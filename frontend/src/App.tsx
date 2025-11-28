import { FormEvent, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';
import { StlViewer } from './components/StlViewer';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type Pattern = 'solid' | 'slots' | 'honeycomb';
type Shape = 'cylinder' | 'box' | 'sphere';

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
};

function App() {
  const [prompt, setPrompt] = useState('Tall cylindrical pencil holder with hex vents');
  const [shape, setShape] = useState<Shape>('cylinder');
  const [pattern, setPattern] = useState<Pattern>('slots');
  const [height, setHeight] = useState('120');
  const [width, setWidth] = useState('70');
  const [depth, setDepth] = useState('70');
  const [wall, setWall] = useState('3');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<(GenerateResponse & { stlUrl: string }) | null>(
    null,
  );

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'loading':
        return 'Generating model...';
      case 'ready':
        return 'Model ready';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Idle';
    }
  }, [status]);

  const parseNumber = (value: string) => (value ? Number(value) : undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError('Enter a prompt first.');
      return;
    }
    setError('');
    setStatus('loading');

    try {
      const payload = {
        prompt,
        target_shape: shape,
        height_mm: parseNumber(height),
        width_mm: parseNumber(width),
        depth_mm: parseNumber(depth),
        wall_thickness_mm: parseNumber(wall),
        pattern,
      };
      const { data } = await axios.post<GenerateResponse>(`${API_BASE}/api/v1/generate`, payload);
      const stlUrl = `${API_BASE}${data.stl_path}?t=${Date.now()}`;
      setResult({ ...data, stlUrl });
      setStatus('ready');
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : 'Unknown error';
      setError(detail);
      setStatus('error');
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p>Prompt-to-print playground</p>
        <h1>Generate printable 3D models with OpenSCAD</h1>
        <p>Describe an object, tweak dimensions, and preview the STL instantly.</p>
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
                placeholder="e.g. Cylindrical desk organizer with honeycomb vents"
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
              <label>Dimensions (mm)</label>
              <div className="layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
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
              <button className="primary-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Generating...' : 'Generate model'}
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
                  {Math.round(result.parameters.height_mm)}  {Math.round(result.parameters.width_mm)} {' '}
                  {Math.round(result.parameters.depth_mm)} mm  pattern {result.parameters.pattern}
                </p>
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
