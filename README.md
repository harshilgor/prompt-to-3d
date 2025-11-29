# Prompt-to-3D

Generate 3D printable models from text prompts using AI and OpenSCAD.

## Features

- 🤖 AI-powered OpenSCAD code generation using OpenAI
- 🎨 Interactive 3D viewer with orbit controls
- 💬 Chat interface for natural language model generation
- 📥 Download STL files for 3D printing
- ⚡ Real-time model preview

## Architecture

- **Frontend**: React + TypeScript + Vite + Three.js
- **Backend**: Node.js + Express + Google Gemini API
- **3D Engine**: OpenSCAD for model generation

## Setup

### Prerequisites

1. **Node.js** (v18 or higher)
2. **OpenSCAD** - Download from https://openscad.org/downloads.html
3. **Google Gemini API Key** - Get one from https://makersuite.google.com/app/apikey

### Installation

1. **Clone and install frontend dependencies:**
```bash
cd frontend
npm install
```

2. **Install backend dependencies:**
```bash
cd ../backend
npm install
```

3. **Configure environment variables:**

Create `backend/.env`:
```bash
GEMINI_API_KEY=your-gemini-api-key-here
OPENSCAD_CMD=openscad
PORT=8000
```

**Note for Windows users:** You may need to specify the full path to OpenSCAD:
```
OPENSCAD_CMD="C:\\Program Files\\OpenSCAD\\openscad.exe"
```

**Note for Mac users:**
```
OPENSCAD_CMD="/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
```

## Running

### Start the backend server:

```bash
cd backend
npm run dev
```

The backend will run on http://localhost:8000

### Start the frontend:

```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:5173

## How It Works

1. **User enters a prompt** in the chat interface (e.g., "A tall cylindrical pencil holder with hex vents")
2. **Backend calls Google Gemini API** to generate OpenSCAD code based on the prompt
3. **OpenSCAD compiles** the generated code to an STL file
4. **Frontend displays** the 3D model in an interactive viewer
5. **User can download** the STL file for 3D printing

## Usage

1. Open http://localhost:5173 in your browser
2. Type a description of the 3D model you want in the chat
3. Wait for the AI to generate OpenSCAD code and compile it
4. View the 3D model in the interactive viewer on the right
5. Download the STL file when ready

## Troubleshooting

### "OpenSCAD compilation failed"
- Make sure OpenSCAD is installed
- Check that `OPENSCAD_CMD` in `.env` points to the correct OpenSCAD executable
- On Windows, use double backslashes: `"C:\\Program Files\\OpenSCAD\\openscad.exe"`

### "Gemini API key not configured"
- Make sure you've set `GEMINI_API_KEY` in `backend/.env`
- Restart the backend server after adding the key

### Frontend can't connect to backend
- Make sure the backend is running on port 8000
- Check that `VITE_API_BASE_URL` in frontend matches your backend URL (defaults to http://localhost:8000)

## Project Structure

```
prompt-to-3d-1/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── App.tsx   # Main chat interface
│   │   └── components/
│   │       └── StlViewer.tsx  # 3D model viewer
│   └── package.json
├── backend/           # Express API server
│   ├── server.js      # Main server file
│   └── output/        # Generated STL files (created automatically)
└── README.md
```

## License

MIT

