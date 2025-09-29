// Slideshow functionality for the home page hero section
import { byId } from '../lib/utils.js';

interface SlideShowState {
  currentSlide: number;
  totalSlides: number;
  autoAdvanceInterval: number | null;
  isAutoAdvancing: boolean;
}

const state: SlideShowState = {
  currentSlide: 0,
  totalSlides: 0,
  autoAdvanceInterval: null,
  isAutoAdvancing: true
};

export function initSlideshow(): void {
  const slideshow = byId('feature-slideshow');
  if (!slideshow) return;

  const slides = slideshow.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');
  
  state.totalSlides = slides.length;
  
  if (state.totalSlides === 0) return;

  // Initialize indicator click handlers
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
      // Pause auto-advance for 10 seconds after manual interaction
      pauseAutoAdvance();
      setTimeout(() => resumeAutoAdvance(), 10000);
    });
  });

  // Initialize arrow navigation
  const prevArrow = byId('slideshow-prev');
  const nextArrow = byId('slideshow-next');

  if (prevArrow) {
    prevArrow.addEventListener('click', () => {
      manualPrevious();
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', () => {
      manualNext();
    });
  }

  // Start auto-advance
  startAutoAdvance();
  
  // Pause on hover, resume on leave
  slideshow.addEventListener('mouseenter', pauseAutoAdvance);
  slideshow.addEventListener('mouseleave', resumeAutoAdvance);
  
  // Handle visibility change (pause when tab is not visible)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseAutoAdvance();
    } else if (state.isAutoAdvancing) {
      resumeAutoAdvance();
    }
  });

  console.log('✅ Slideshow initialized with', state.totalSlides, 'slides');
}

function goToSlide(slideIndex: number): void {
  if (slideIndex < 0 || slideIndex >= state.totalSlides) return;

  // Update slides
  const slides = document.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');

  // Remove active class from current slide and indicator
  slides[state.currentSlide]?.classList.remove('active');
  indicators[state.currentSlide]?.classList.remove('active');

  // Update current slide index
  state.currentSlide = slideIndex;

  // Add active class to new slide and indicator
  slides[state.currentSlide]?.classList.add('active');
  indicators[state.currentSlide]?.classList.add('active');

  console.log('📄 Switched to slide', slideIndex + 1);
}

function nextSlide(): void {
  const nextIndex = (state.currentSlide + 1) % state.totalSlides;
  goToSlide(nextIndex);
}

function startAutoAdvance(): void {
  if (state.autoAdvanceInterval) {
    clearInterval(state.autoAdvanceInterval);
  }
  
  state.autoAdvanceInterval = setInterval(() => {
    nextSlide();
  }, 5000); // 5 seconds
  
  state.isAutoAdvancing = true;
  console.log('▶️ Auto-advance started');
}

function pauseAutoAdvance(): void {
  if (state.autoAdvanceInterval) {
    clearInterval(state.autoAdvanceInterval);
    state.autoAdvanceInterval = null;
  }
  state.isAutoAdvancing = false;
  console.log('⏸️ Auto-advance paused');
}

function resumeAutoAdvance(): void {
  if (!state.isAutoAdvancing) {
    state.isAutoAdvancing = true;
    startAutoAdvance();
    console.log('▶️ Auto-advance resumed');
  }
}

// Cleanup function for when component is destroyed
export function destroySlideshow(): void {
  pauseAutoAdvance();
  console.log('🛑 Slideshow destroyed');
}

// Manual controls (exported for potential external use)
export function manualNext(): void {
  nextSlide();
  pauseAutoAdvance();
  setTimeout(() => resumeAutoAdvance(), 10000);
}

export function manualPrevious(): void {
  const prevIndex = state.currentSlide === 0 ? state.totalSlides - 1 : state.currentSlide - 1;
  goToSlide(prevIndex);
  pauseAutoAdvance();
  setTimeout(() => resumeAutoAdvance(), 10000);
}

export function getCurrentSlide(): number {
  return state.currentSlide;
}

export function getTotalSlides(): number {
  return state.totalSlides;
}
