class ModernPortfolio {
  constructor() {
    this.nav = document.getElementById('nav');
    this.navToggle = document.getElementById('navToggle');
    this.themeToggle = document.getElementById('themeToggle');
    this.themeIcon = document.getElementById('themeIcon');
    
    this.init();
  }
  
  init() {
    this.setupNavigation();
    this.setupTheme();
    this.setupIntersectionObserver();
    this.setupSmoothScrolling();
    this.setupKeyboardNavigation();
  }
  
  setupNavigation() {
    // Mobile nav toggle
    this.navToggle?.addEventListener('click', () => {
      this.nav?.classList.toggle('is-open');
    });
    
    // Close nav when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          this.nav && 
          !this.nav.contains(e.target) && 
          this.navToggle &&
          !this.navToggle.contains(e.target)) {
        this.nav.classList.remove('is-open');
      }
    });
    
    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.nav?.classList.contains('is-open')) {
        this.nav.classList.remove('is-open');
      }
    });
  }
  
  setupTheme() {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    this.setTheme(initialTheme);
    
    // Theme toggle listener
    this.themeToggle?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme icon
    if (this.themeIcon) {
      this.themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Update theme toggle text
    if (this.themeToggle) {
      this.themeToggle.setAttribute('aria-label', 
        `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    }
  }
  
  setupIntersectionObserver() {
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Update active nav link
          navLinks.forEach(link => {
            link.classList.remove('is-active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('is-active');
            }
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-10% 0px -60% 0px'
    });
    
    sections.forEach(section => observer.observe(section));
  }
  
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Close mobile nav
          if (window.innerWidth <= 768 && this.nav) {
            this.nav.classList.remove('is-open');
          }
        }
      });
    });
  }
  
  setupKeyboardNavigation() {
    // Add focus styles and keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ModernPortfolio());
} else {
  new ModernPortfolio();
}

// Handle window resize for responsive behavior
window.addEventListener('resize', debounce(() => {
  const nav = document.getElementById('nav');
  if (window.innerWidth > 768 && nav?.classList.contains('is-open')) {
    nav.classList.remove('is-open');
  }
}, 250));

// Service Worker registration for offline capability
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully');
      })
      .catch(registrationError => {
        console.log('Service Worker registration failed:', registrationError);
      });
  });
}