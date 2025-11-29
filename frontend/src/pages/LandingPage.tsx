import { Link } from 'react-router-dom';
import './LandingPage.css';

export function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">Curvy</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#gallery">Gallery</a>
          <a href="#pricing">Pricing</a>
          <Link to="/dashboard" className="nav-login">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <Link to="/dashboard" className="hero-cta-pill">
          Start creating for free →
        </Link>
        
        <h1 className="hero-title">
          Turn words into<br />
          <span className="hero-title-accent">3D reality.</span>
        </h1>
        
        <p className="hero-subtitle">
          Describe any object. Get a 3D model in seconds.<br />
          Powered by AI. Ready for 3D printing.
        </p>

        {/* Hero Visual */}
        <div className="hero-visual">
          <div className="hero-visual-inner">
            <div className="hero-3d-preview">
              <div className="floating-shape shape-1"></div>
              <div className="floating-shape shape-2"></div>
              <div className="floating-shape shape-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Everything you need to create</h2>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Text to 3D</h3>
            <p>Describe your idea in plain English. Our AI transforms it into OpenSCAD code and renders a 3D model.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🖼️</div>
            <h3>Image Reference</h3>
            <p>Upload a reference image. AI analyzes the shape and creates a simplified 3D approximation.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👁️</div>
            <h3>Live Preview</h3>
            <p>See your model in real-time. Rotate, zoom, and inspect before downloading.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Export STL</h3>
            <p>Download print-ready STL files. Compatible with all major 3D printers and slicers.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Iterate Fast</h3>
            <p>Refine your design with follow-up prompts. Every version is saved automatically.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📁</div>
            <h3>Project Library</h3>
            <p>Organize your creations. Access your models anytime from your personal dashboard.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <span className="section-tag">How it works</span>
          <h2 className="section-title">Three simple steps</h2>
        </div>
        
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Describe</h3>
            <p>Type what you want to create, or upload a reference image for inspiration.</p>
          </div>
          
          <div className="step-connector"></div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>Generate</h3>
            <p>AI creates OpenSCAD code and compiles it into a 3D model in seconds.</p>
          </div>
          
          <div className="step-connector"></div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Download</h3>
            <p>Preview your model, make adjustments, and export the STL file.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to bring your ideas to life?</h2>
        <p>Start creating 3D models with just a few words.</p>
        <Link to="/dashboard" className="cta-button">
          Get started — it's free
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">Curvy</span>
            <p>AI-powered 3D model generation</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#gallery">Gallery</a>
            <a href="#pricing">Pricing</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 Curvy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

