import type { Study, Procedure } from '../types/domain.js';

let studies: Study[] = [];
let procedures: Procedure[] = [];

export async function loadData(): Promise<{ studies: Study[]; procedures: Procedure[] }> {
  try {
    // Load studies data
    const studiesResponse = await fetch('/data/studies.json');
    if (!studiesResponse.ok) {
      throw new Error(`Failed to load studies: ${studiesResponse.status}`);
    }
    studies = await studiesResponse.json();
    
    // Load procedures data
    const proceduresResponse = await fetch('/data/procedures.json');
    if (!proceduresResponse.ok) {
      throw new Error(`Failed to load procedures: ${proceduresResponse.status}`);
    }
    procedures = await proceduresResponse.json();
    
    return { studies, procedures };
    
  } catch (error) {
    console.error('Error loading data:', error);
    console.error('Current location:', window.location.href);
    console.error('Attempting to load from:', '/data/studies.json', '/data/procedures.json');
    
    // More specific error message
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to load study data. Please check your internet connection and try again.');
    } else if (error instanceof Error && error.message.includes('404')) {
      throw new Error('Study data files not found. Please contact support.');
    } else {
      throw new Error('Unable to load study data. Please refresh the page or try again later.');
    }
  }
}

// Getter functions for accessing loaded data
export function getStudies(): Study[] {
  return studies;
}

export function getProcedures(): Procedure[] {
  return procedures;
}

export function isDataLoaded(): boolean {
  return studies.length > 0 && procedures.length > 0;
}