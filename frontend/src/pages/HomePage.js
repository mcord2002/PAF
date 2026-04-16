import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultDashboardPath } from '../utils/dashboardPath';
import './HomePage.css';

const highlights = [
  { label: 'Live modules', value: '4 core' },
  { label: 'Role-based access', value: 'Admin / Technician / User' },
  { label: 'Workflows', value: 'Booking + Incident' },
];
//image URLs
const heroSlides = [
  {
    title: 'Plan and book campus facilities with confidence',
    subtitle: 'Conflict-safe booking workflows for classrooms, labs, and shared equipment.',
    image:
      'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    title: 'Coordinate maintenance teams in real time',
    subtitle: 'Assign tickets, track progress, and close incidents with clear responsibility.',
    image:
      'https://images.pexels.com/photos/6146970/pexels-photo-6146970.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    title: 'Keep everyone informed with smart notifications',
    subtitle: 'Users, admins, and technicians receive updates exactly when actions happen.',
    image:
      'https://images.pexels.com/photos/5940714/pexels-photo-5940714.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
];

// Additional gallery images (not in the main slider)
const smallGallery = [
  'https://images.pexels.com/photos/301920/pexels-photo-301920.jpeg?auto=compress&cs=tinysrgb&w=1000',
  'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=1000',
  'https://images.pexels.com/photos/207684/pexels-photo-207684.jpeg?auto=compress&cs=tinysrgb&w=1000',
  'https://images.pexels.com/photos/1370298/pexels-photo-1370298.jpeg?auto=compress&cs=tinysrgb&w=1000',
  'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=1000',
  'https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=1000',
];

// Note: This is a static landing page.
export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = defaultDashboardPath(user);
  const [slideIndex, setSlideIndex] = useState(0);
  const currentSlide = heroSlides[slideIndex];

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    
    <div className="landing">
      <header className="landing-nav">
        <div className="nav-left">
          <Link className="landing-brand" to="/">
            <span className="brand-mark">CH</span>
            <span className="brand-text">Campus Hub</span>
          </Link>
          <nav className="nav-menu">
            <a href="#features">Features</a>
            <a href="#workflows">Workflows</a>
            <a href="#gallery">Gallery</a>
          </nav>
        </div>
        <div className="nav-actions">
          {isAuthenticated ? (
            <Link className="btn primary" to={dashboardPath}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                Sign in
              </Link>
              <Link className="btn primary" to="/register/user">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="hero-kicker">Smart Campus Operations Hub</p>
          <h1>{currentSlide.title}</h1>
          <p className="muted">
            {currentSlide.subtitle} Manage facilities and incidents with clear workflows and role-based access for campus
            operations teams.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link className="btn primary" to={dashboardPath}>
                Continue to workspace
              </Link>
            ) : (
              <>
                <Link className="btn primary" to="/register/user">
                  Create account
                </Link>
                <Link className="btn ghost" to="/login">
                  Login
                </Link>
              </>
            )}
          </div>
          <div className="slide-dots">
            {heroSlides.map((slide, i) => (
              <button
                type="button"
                key={slide.title}
                className={`slide-dot ${i === slideIndex ? 'active' : ''}`}
                onClick={() => setSlideIndex(i)}
                aria-label={`Show slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="hero-stats">
            {highlights.map((item) => (
              <div key={item.label} className="hero-stat">
                <div className="hero-stat-value">{item.value}</div>
                <div className="hero-stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-media">
          <img src={currentSlide.image} alt={currentSlide.title} />
        </div>
      </section>

      <section id="features" className="landing-section">
        <h2>Platform features</h2>
        <div className="feature-grid">
          <article className="feature-card">
            <img
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=80"
              alt="Facilities catalogue"
            />
            <h3>Facilities & assets catalogue</h3>
            <p>Search lecture halls, labs, and equipment with filters by type, location, and capacity.</p>
          </article>
          <article className="feature-card">
            <img
              src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80"
              alt="Booking workflow"
            />
            <h3>Booking workflow</h3>
            <p>Submit requests, prevent conflicts automatically, and track approval decisions with reasons.</p>
          </article>
          <article className="feature-card">
            <img
              src="https://images.pexels.com/photos/3862627/pexels-photo-3862627.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Maintenance and ticketing"
            />
            <h3>Maintenance ticketing</h3>
            <p>Report incidents with evidence, assign technicians, and move through clear repair statuses.</p>
          </article>
        </div>
      </section>

      <section id="workflows" className="landing-section workflows">
        <h2>Operational workflows</h2>
        <div className="workflow-grid">
          <div className="panel">
            <h3>Booking lifecycle</h3>
            <p className="muted">User request - Pending - Admin approve/reject - Notify requester.</p>
          </div>
          <div className="panel">
            <h3>Ticket lifecycle</h3>
            <p className="muted">Open - Assign technician - In Progress - Resolved - Closed.</p>
          </div>
          <div className="panel">
            <h3>Notification lifecycle</h3>
            <p className="muted">Decision events trigger immediate notifications for relevant stakeholders.</p>
          </div>
        </div>
      </section>

      <section id="gallery" className="landing-section gallery">
        <h2>Campus visual highlights</h2>
        <p className="muted">Large featured image slider above + a compact visual gallery below.</p>
        <div className="gallery-grid small">
          {smallGallery.map((img, i) => (
            <img key={img} src={img} alt={`Campus operations view ${i + 1}`} loading="lazy" />
          ))}
        </div>
      </section>
    </div>
  );
}

