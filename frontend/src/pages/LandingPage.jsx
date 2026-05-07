import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Eye, Radio, AlertTriangle, BarChart3 } from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Activity size={24} />,
    color: 'teal',
    title: 'Real-Time Monitoring',
    desc: 'Continuous 24/7 scanning of social media, forums, and health communities for drug-related discussions and patient safety signals.'
  },
  {
    icon: <Radio size={24} />,
    color: 'blue',
    title: 'AI Signal Detection',
    desc: 'Three-stage AI pipeline (Scout → Lens → Oracle) that extracts, analyzes, and validates adverse event signals automatically.'
  },
  {
    icon: <AlertTriangle size={24} />,
    color: 'red',
    title: 'Smart Safety Alerts',
    desc: 'Instant notifications for critical adverse events with confidence scoring, risk classification, and explainable AI reasoning.'
  },
  {
    icon: <BarChart3 size={24} />,
    color: 'purple',
    title: 'Analytics Dashboard',
    desc: 'Centralized hub with interactive visualizations, trend analysis, and timeline views for comprehensive pharmacovigilance insights.'
  },
  {
    icon: <Shield size={24} />,
    color: 'amber',
    title: 'PII/PHI Protection',
    desc: 'Automatic detection and redaction of personally identifiable and protected health information to ensure regulatory compliance.'
  },
  {
    icon: <Eye size={24} />,
    color: 'green',
    title: 'Multi-Source Intelligence',
    desc: 'Unified ingestion from Twitter/X, Reddit, Quora, and health forums with deduplication and relevance scoring engines.'
  }
];

const testimonials = [
  {
    text: '"SignalRX detected an emerging adverse event trend 3 weeks before it appeared in traditional pharmacovigilance reports. A game-changer for patient safety."',
    name: 'Abhijeet Kendre',
    role: 'Pharmacovigilance Lead',
    initials: 'AK',
    color: 'teal',
    stars: 5
  },
  {
    text: '"The AI pipeline is incredibly intuitive. It processes thousands of social posts and surfaces only the most relevant safety signals with explainable confidence scores."',
    name: 'Dr. Ali Saiyad',
    role: 'Clinical Research Director',
    initials: 'AS',
    color: 'blue',
    stars: 5
  }
];

export default function LandingPage() {
  const animRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    animRefs.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !animRefs.current.includes(el)) {
      animRefs.current.push(el);
    }
  };

  return (
    <div className="landing-page">
      {/* ── Navbar ─────────────────────────────── */}
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">Rx</div>
          <span className="nav-logo-text">SignalRX</span>
        </Link>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login" className="nav-login">Log In</Link>
          <Link to="/signup" className="nav-signup-btn">Sign Up</Link>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────── */}
      <section className="hero-section">
        <div className="hero-left">
          <span className="hero-badge">Next-Gen Pharma Intelligence</span>
          <h1 className="hero-title">
            Explainable AI for <span className="highlight">Patient Safety</span> Signal Detection
          </h1>
          <p className="hero-subtitle">
            Monitor social media, forums & health communities in real-time. 
            Detect adverse drug events before they escalate — powered by explainable AI.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="hero-cta">
              Get Started →
            </Link>
            <button className="hero-demo" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              ▶ Learn More
            </button>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-image-wrapper">
            <img src="/hero-image.png" alt="SignalRX Dashboard" />
            <div className="hero-float-card">
              <div className="float-icon">⚡</div>
              <div className="float-text">
                <div className="float-label">Real-time Signals</div>
                <div className="float-value">1,247 <span className="float-unit">detected</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────── */}
      <section className="features-section" id="features">
        <div className="section-heading" ref={addRef} style={{ transitionDelay: '0s' }}>
          <h2>Intelligent Features</h2>
          <div className="heading-line" />
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card scroll-animate"
              ref={addRef}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About Section ─────────────────────── */}
      <section className="about-section" id="about">
        <div className="scroll-animate" ref={addRef}>
          <h2>About SignalRX</h2>
          <p>
            SignalRX is an AI-powered social listening intelligence platform designed to revolutionize pharmacovigilance. 
            By combining advanced NLP, real-time data ingestion from multiple social sources, and a three-stage AI 
            validation pipeline, we enable pharmaceutical companies and regulators to detect adverse drug events 
            from unstructured social data — faster, smarter, and with full explainability. Our mission is to protect 
            patient safety through technology that turns social noise into actionable signals.
          </p>
        </div>
      </section>

      {/* ── Testimonials Section ──────────────── */}
      <section className="testimonials-section">
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testimonial-card scroll-animate"
              ref={addRef}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className="testimonial-stars">
                {Array.from({ length: t.stars }, (_, j) => (
                  <span key={j} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className={`author-avatar ${t.color}`}>{t.initials}</div>
                <div className="author-info">
                  <div className="author-name">{t.name}</div>
                  <div className="author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">SignalRX</div>
            <p>Explainable AI Engine for Early Detection of Patient Safety Signals from Social Data.</p>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <Link to="/login">Log In</Link>
            <Link to="/admin">Admin Portal</Link>
          </div>
          <div className="footer-column">
            <h4>Contact Us</h4>
            <a href="mailto:Admin@asiacore.in">Admin@asiacore.in</a>
            <a href="tel:+918605168656">+91 8605168656</a>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 SignalRX | Owned By <a href="https://asiacore.in" target="_blank" rel="noopener noreferrer">Team A.S.I.A. Core</a>
        </div>
      </footer>
    </div>
  );
}
