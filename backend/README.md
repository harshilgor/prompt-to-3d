# Prompt-to-3D Backend

Backend API server that generates 3D models from text prompts using AI and OpenSCAD.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

3. Install OpenSCAD:
- **Windows**: Download from https://openscad.org/downloads.html
- **Mac**: `brew install openscad` or download from website
- **Linux**: `sudo apt-get install openscad` or `sudo yum install openscad`

4. Update OpenSCAD path in `.env` if needed (especially on Windows):
```
OPENSCAD_CMD="C:\\Program Files\\OpenSCAD\\openscad.exe"
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on http://localhost:8000

## API Endpoints

### POST /api/v1/generate
Generates a 3D model from a text prompt.

**Request:**
```json
{
  "prompt": "A tall cylindrical pencil holder with hex vents and angled base"
}
```

**Response:**
```json
{
  "job_id": "job_1234567890_abc123",
  "stl_path": "/output/job_1234567890_abc123.stl",
  "scad_source": "difference() { ... }",
  "parameters": { ... },
  "strategy": "llm"
}
```

### GET /api/v1/health
Health check endpoint.

## How It Works

1. User sends a text prompt
2. Backend calls OpenAI API to generate OpenSCAD code
3. OpenSCAD code is saved to a `.scad` file
4. OpenSCAD compiles the `.scad` file to `.stl`
5. STL file is served and returned to the frontend

