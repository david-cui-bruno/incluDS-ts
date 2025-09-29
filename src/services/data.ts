import type { Study, Procedure } from '../types/domain.js';

let studies: Study[] = [];
let procedures: Procedure[] = [];

export async function loadData(): Promise<{ studies: Study[]; procedures: Procedure[] }> {
  try {
    // Load studies data
    const studiesResponse = await fetch('/src/data/studies.json');
    if (!studiesResponse.ok) {
      throw new Error(`Failed to load studies: ${studiesResponse.status}`);
    }
    studies = await studiesResponse.json();
    
    // Load procedures data
    const proceduresResponse = await fetch('/src/data/procedures.json');
    if (!proceduresResponse.ok) {
      throw new Error(`Failed to load procedures: ${proceduresResponse.status}`);
    }
    procedures = await proceduresResponse.json();
    
    return { studies, procedures };
    
  } catch (error) {
    console.error('Error loading data:', error);
    throw new Error('Unable to load study data. Please refresh the page or try again later.');
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