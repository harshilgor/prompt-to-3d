import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// Serve static files (STL files)
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(outputDir);
app.use('/output', express.static(outputDir));

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyDlM_i20ZrdWAMcxBbXzXTxa6PFUuL2j90';
const genAI = new GoogleGenerativeAI(geminiApiKey);

// OpenSCAD command - adjust path based on your OS
const OPENSCAD_CMD = process.env.OPENSCAD_CMD || 'C:\\Program Files\\OpenSCAD\\openscad.exe';

// System prompt for generating OpenSCAD code
const SYSTEM_PROMPT = `You are an expert OpenSCAD programmer. Generate valid OpenSCAD code based on user descriptions or reference images.

CRITICAL RULES:
1. Return ONLY valid OpenSCAD code - no explanations, no markdown, no text
2. Use proper OpenSCAD syntax and functions
3. Make objects printable (consider wall thickness, overhangs, etc.)
4. Use reasonable dimensions in millimeters (typically 10-200mm)
5. ALWAYS set $fn=64 at the VERY TOP of the code as a global variable (first line)
6. NEVER put variable assignments like $fn=64 inside union(), difference(), or intersection() blocks
7. Define all variables at the TOP of the code, before any geometry
8. The code must be complete and compilable by OpenSCAD
9. Keep designs simple and achievable with basic primitives (cube, sphere, cylinder)
10. For complex objects, use simple geometric approximations
11. When given a reference image, analyze its shape and create a simplified 3D version

CORRECT FORMAT:
$fn = 64;

// Variables at top
height = 50;
width = 30;

// Then geometry
union() {
  sphere(r=10);
  translate([0, 0, 15])
    cylinder(h=20, r=5);
}

Example - Simple sphere:
$fn = 64;
sphere(r=20);

Example - Hollow box:
$fn = 64;
difference() {
  cube([60, 40, 30]);
  translate([3, 3, 3])
    cube([54, 34, 27]);
}

Example - Vase shape:
$fn = 64;
difference() {
  cylinder(h=80, r1=30, r2=20);
  translate([0, 0, 3])
    cylinder(h=80, r1=27, r2=17);
}`;

// System prompt for image analysis
const IMAGE_ANALYSIS_PROMPT = `You are an expert at analyzing images and creating 3D models. 
Look at this reference image and create OpenSCAD code that represents a simplified 3D version of what you see.

IMPORTANT:
- Focus on the main shape and silhouette
- Use basic primitives (sphere, cube, cylinder) combined with union, difference, intersection
- Keep the design simple and printable
- Approximate complex curves with multiple cylinders or spheres
- Use reasonable dimensions (50-150mm typical)

${SYSTEM_PROMPT}`;

app.post('/api/v1/generate', async (req, res) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const scadFile = path.join(outputDir, `${jobId}.scad`);
  const stlFile = path.join(outputDir, `${jobId}.stl`);
  
  try {
    const { prompt, image } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: 'Prompt or image is required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' 
      });
    }

    console.log('='.repeat(60));
    console.log('📝 New generation request');
    console.log('Prompt:', prompt || '(from image)');
    console.log('Has image:', !!image);
    console.log('Job ID:', jobId);

    // Step 1: Generate OpenSCAD code using Gemini
    console.log('🤖 Calling Gemini API...');
    
    let scadCode = '';
    let lastError = null;
    
    // Models that support vision
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        let result;
        
        if (image) {
          // Multimodal request with image
          console.log(`🖼️ Processing image with ${modelName}...`);
          
          const imagePart = {
            inlineData: {
              data: image,
              mimeType: 'image/jpeg' // Assume JPEG, works for most formats
            }
          };
          
          const textPart = {
            text: `${IMAGE_ANALYSIS_PROMPT}\n\nUser request: ${prompt || 'Create a 3D model based on this reference image'}\n\nGenerate ONLY the OpenSCAD code (no explanations):`
          };
          
          result = await model.generateContent([textPart, imagePart]);
        } else {
          // Text-only request
          const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${prompt}\n\nGenerate ONLY the OpenSCAD code (no explanations):`;
          result = await model.generateContent(fullPrompt);
        }
        
        const response = await result.response;
        scadCode = response.text().trim();
        console.log(`✅ Successfully used model: ${modelName}`);
        break;
      } catch (error) {
        lastError = error;
        console.log(`❌ Failed with model ${modelName}:`, error.message);
        continue;
      }
    }
    
    if (!scadCode) {
      const errorMsg = lastError?.message || 'Unknown error';
      console.error('Failed to generate code from any model');
      return res.status(500).json({ 
        error: `Failed to generate OpenSCAD code: ${errorMsg}`,
        detail: lastError?.stack
      });
    }
    
    // Step 2: Clean up the code (remove markdown if present)
    let cleanedCode = scadCode;
    
    // Extract code from markdown code blocks if present
    const codeBlockMatch = scadCode.match(/```(?:openscad|scad)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedCode = codeBlockMatch[1].trim();
    } else {
      // Remove any stray markdown markers
      cleanedCode = scadCode
        .replace(/```openscad\n?/g, '')
        .replace(/```scad\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    }

    if (!cleanedCode) {
      return res.status(500).json({ error: 'Failed to generate OpenSCAD code - empty result' });
    }

    console.log('📄 Generated OpenSCAD code:');
    console.log(cleanedCode);
    console.log('-'.repeat(40));

    // Step 3: Save SCAD file
    await fs.writeFile(scadFile, cleanedCode, 'utf8');
    console.log(`💾 Saved SCAD file: ${scadFile}`);

    // Step 4: Compile with OpenSCAD
    console.log('🔧 Compiling with OpenSCAD...');
    console.log(`Command: "${OPENSCAD_CMD}" -o "${stlFile}" "${scadFile}"`);
    
    try {
      const { stdout, stderr } = await execAsync(
        `"${OPENSCAD_CMD}" -o "${stlFile}" "${scadFile}"`,
        { timeout: 120000 } // 2 minute timeout
      );
      
      if (stdout) console.log('OpenSCAD stdout:', stdout);
      if (stderr) console.log('OpenSCAD stderr:', stderr);
      
    } catch (compileError) {
      console.error('❌ OpenSCAD compilation failed:', compileError.message);
      
      // Return the code anyway so user can see what was generated
      return res.status(500).json({ 
        error: `OpenSCAD compilation failed: ${compileError.message}`,
        scad_source: cleanedCode,
        hint: 'The generated code may have syntax errors. Check the OpenSCAD code above.'
      });
    }

    // Step 5: Verify STL file was created
    if (!await fs.pathExists(stlFile)) {
      console.error('❌ STL file was not created');
      return res.status(500).json({ 
        error: 'STL file was not created. OpenSCAD may have failed silently.',
        scad_source: cleanedCode
      });
    }

    const stats = await fs.stat(stlFile);
    console.log(`✅ STL file created: ${stlFile} (${stats.size} bytes)`);

    // Step 6: Return success response
    const response = {
      job_id: jobId,
      stl_path: `/output/${jobId}.stl`,
      scad_source: cleanedCode,
      file_size: stats.size,
      parameters: {
        shape: 'custom',
        prompt: prompt,
        has_reference_image: !!image
      },
      strategy: 'llm'
    };

    console.log('✅ Generation complete!');
    console.log('='.repeat(60));
    
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating model:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      detail: error.stack
    });
  }
});

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  let openscadAvailable = false;
  let openscadVersion = 'unknown';
  
  try {
    const { stdout } = await execAsync(`"${OPENSCAD_CMD}" --version`, { timeout: 5000 });
    openscadAvailable = true;
    openscadVersion = stdout.trim();
  } catch (e) {
    console.log('OpenSCAD not available:', e.message);
  }
  
  res.json({ 
    status: 'ok',
    gemini_configured: !!geminiApiKey,
    openscad_available: openscadAvailable,
    openscad_version: openscadVersion,
    openscad_path: OPENSCAD_CMD,
    compilation_mode: 'server-side',
    features: ['text-to-3d', 'image-to-3d'],
    message: 'Backend generates OpenSCAD code via Gemini (with vision support) and compiles to STL.'
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 Prompt-to-3D Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🔑 Gemini API configured: ${!!geminiApiKey}`);
  console.log(`🔧 OpenSCAD path: ${OPENSCAD_CMD}`);
  console.log(`🖼️ Image-to-3D: Enabled (Gemini Vision)`);
  console.log('='.repeat(60));
  console.log('');
});
