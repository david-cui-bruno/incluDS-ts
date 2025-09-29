import { byId } from '../lib/utils.js';
import { initReadButtons } from './navigation.js';
import { APIService } from '../services/api.js';

let isProcessing = false;
let currentContext = '';
let qaHistory: Array<{question: string, answer: string}> = []; // Add this

export function initSummarizer(): void {
  console.log('Initializing summarizer...');
  
  // Initialize form handlers
  initFormHandlers();
  
  // Initialize file upload handlers
  initFileUploadHandlers();
  
  // Initialize tab switching
  initTabSwitching();
  
  // Initialize word counter
  initWordCounter();
  
  console.log('Summarizer initialized successfully');
}

function initFormHandlers(): void {
  const form = byId('summarizer-form');
  const textInput = byId('input-text') as HTMLTextAreaElement;
  const fileInput = byId('file-input') as HTMLInputElement;
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isProcessing) return;
    
    const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
    
    if (activeTab === 'text') {
      const text = textInput?.value?.trim();
      if (text) {
        await summarizeText(text);
      }
    } else if (activeTab === 'file') {
      const file = fileInput?.files?.[0];
      if (file) {
        await summarizeFile(file);
      }
    }
  });
}

function initFileUploadHandlers(): void {
  const fileInput = byId('file-input') as HTMLInputElement;
  const dropZone = byId('file-drop-zone');
  const fileInfo = byId('file-info');
  
  if (!fileInput || !dropZone || !fileInfo) return;
  
  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      displayFileInfo(file, fileInfo);
    }
  });
  
  // Drag and drop handlers
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      fileInput.files = files;
      displayFileInfo(files[0], fileInfo);
    }
  });
  
  // Click to select file
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
}

function initTabSwitching(): void {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const textTab = byId('text-input-tab');
  const fileTab = byId('file-input-tab');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      
      // Show/hide appropriate content
      const tabType = btn.getAttribute('data-tab');
      if (tabType === 'text') {
        textTab?.classList.add('active');
        fileTab?.classList.remove('active');
      } else if (tabType === 'file') {
        textTab?.classList.remove('active');
        fileTab?.classList.add('active');
      }
    });
  });
}

function initWordCounter(): void {
  const textInput = byId('input-text') as HTMLTextAreaElement;
  const wordCount = byId('word-count');
  
  if (!textInput || !wordCount) return;
  
  function updateWordCount() {
    const text = textInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    
    if (!wordCount) return; // Add this null check
    
    wordCount.textContent = `${words}/1000 words`;
    
    // Update visual indicator
    if (words > 1000) {
      wordCount.classList.add('over-limit');
    } else {
      wordCount.classList.remove('over-limit');
    }
  }
  
  textInput.addEventListener('input', updateWordCount);
  updateWordCount(); // Initial count
}

async function summarizeText(text: string): Promise<void> {
  try {
    setProcessingState(true);
    
    console.log('Starting text summarization...');
    const result = await APIService.summarizeText(text);
    
    // Store original text for Q&A
    currentContext = result.originalText;
    
    displayResults({
      summary: result.summary,
      metadata: result.metadata,
      quality: result.quality
    });
    
  } catch (error) {
    console.error('Error summarizing text:', error);
    displayError(error instanceof Error ? error.message : 'Failed to summarize text');
  } finally {
    setProcessingState(false);
  }
}

async function summarizeFile(file: File): Promise<void> {
  try {
    setProcessingState(true);
    
    console.log('Starting file summarization...', file.name);
    const result = await APIService.summarizeFile(file);
    
    // Store original document content for Q&A
    currentContext = result.originalText;
    
    displayResults({
      summary: result.summary,
      metadata: result.metadata,
      quality: result.quality,
      document: result.document
    });
    
  } catch (error) {
    console.error('Error summarizing file:', error);
    displayError(error instanceof Error ? error.message : 'Failed to summarize file');
  } finally {
    setProcessingState(false);
  }
}

function displayFileInfo(file: File, container: HTMLElement): void {
  const sizeInMB = (file.size / 1024 / 1024).toFixed(1);
  container.innerHTML = `
    <div class="file-selected">
      <span class="file-name">${file.name}</span>
      <span class="file-size">${sizeInMB} MB</span>
    </div>
  `;
}

function setProcessingState(processing: boolean): void {
  isProcessing = processing;
  
  const submitBtn = byId('summarize-submit') as HTMLButtonElement;
  const progressIndicator = byId('processing-indicator');
  
  if (submitBtn) {
    submitBtn.disabled = processing;
    submitBtn.textContent = processing ? 'Processing...' : 'Summarize at an 8th Grade Reading Level';
  }
  
  if (progressIndicator) {
    progressIndicator.style.display = processing ? 'block' : 'none';
  }
}

function displayResults(result: {
  summary: string;
  metadata: any;
  quality: any;
  document?: any;
}): void {
  const resultsContainer = byId('summary-results');
  if (!resultsContainer) return;
  
  // Remove this line since we set currentContext in the functions above:
  // currentContext = result.summary;
  
  // Reset conversation for new content
  qaHistory = [];
  
  // Clear Q&A history display
  const qaHistoryElement = byId('qa-history');
  if (qaHistoryElement) {
    qaHistoryElement.innerHTML = '';
  }
  
  const documentInfo = result.document ? `
    <div class="document-info">
      <h4>Document: ${result.document.filename}</h4>
      <p>Type: ${result.document.metadata.type.toUpperCase()} • 
         Words: ${result.document.metadata.wordCount.toLocaleString()} • 
         ${result.document.metadata.pages ? `Pages: ${result.document.metadata.pages}` : ''}
      </p>
    </div>
  ` : '';
  
  // Different titles based on whether it's a file or text
  const title = result.document ? 
    'Summary (8th Grade Reading Level)' : 
    'Text Converted to 8th Grade Reading Level';
  
  resultsContainer.innerHTML = `
    <div class="summary-output">
      ${documentInfo}
      
      <div class="summary-content">
        <h3>${title}</h3>
        <div class="summary-text">${result.summary.replace(/\n/g, '<br>')}</div>
      </div>
      
      <div class="summary-stats">
        <div class="stat">
          <label>Original Length:</label>
          <span>${result.metadata.originalWordCount.toLocaleString()} words</span>
        </div>
        <div class="stat">
          <label>${result.document ? 'Summary' : 'Converted'} Length:</label>
          <span>${result.metadata.summaryWordCount.toLocaleString()} words</span>
        </div>
        <div class="stat">
          <label>${result.document ? 'Compression' : 'Length Change'}:</label>
          <span>${Math.round(result.metadata.compressionRatio * 100)}%</span>
        </div>
        <div class="stat">
          <label>Processing Time:</label>
          <span>${(result.metadata.processingTime / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  `;
  
  resultsContainer.style.display = 'block';
  
  // Show Q&A section
  const qaSection = byId('qa-section');
  if (qaSection) {
    qaSection.style.display = 'block';
    initQAHandlers();
  }
  
  // Initialize read buttons for the new content
  initReadButtons(resultsContainer);
}

function displayError(message: string): void {
  const resultsContainer = byId('summary-results');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = `
    <div class="error-message">
      <h3>❌ Error</h3>
      <p>${message}</p>
      <p>Please try again or contact support if the problem persists.</p>
    </div>
  `;
  
  resultsContainer.style.display = 'block';
}

// Add Q&A handlers
function initQAHandlers(): void {
  // Only initialize if we're on the summarizer page
  const summarizerPage = byId('summarizer');
  if (!summarizerPage || !summarizerPage.classList.contains('page')) return;
  
  const questionInput = byId('question-input') as HTMLInputElement;
  const askButton = byId('ask-question-btn') as HTMLButtonElement;
  
  if (!questionInput || !askButton) return;
  
  // Handle ask button click
  askButton.addEventListener('click', async () => {
    const question = questionInput.value.trim();
    if (question && currentContext) {
      await askQuestion(question);
      questionInput.value = ''; // Clear input
    }
  });
  
  // Handle Enter key in question input
  questionInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const question = questionInput.value.trim();
      if (question && currentContext) {
        await askQuestion(question);
        questionInput.value = '';
      }
    }
  });
}

async function askQuestion(question: string): Promise<void> {
  const askButton = byId('ask-question-btn') as HTMLButtonElement;
  const qaHistoryElement = byId('qa-history');
  
  if (!qaHistoryElement) return;
  
  try {
    askButton.disabled = true;
    askButton.textContent = 'Thinking...';
    
    addQuestionToHistory(question, 'Thinking...');
    
    // Build conversation context (original + recent Q&A)
    let conversationContext = currentContext;
    if (qaHistory.length > 0) {
      conversationContext += '\n\nPrevious questions and answers:\n';
      // Include last 3 Q&A pairs to keep context manageable
      const recentQA = qaHistory.slice(-3);
      recentQA.forEach(qa => {
        conversationContext += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
      });
    }
    
    const response = await APIService.askQuestion(question, conversationContext);
    
    // Store this Q&A pair
    qaHistory.push({
      question,
      answer: response.answer
    });
    
    updateLastAnswer(response.answer);
    
  } catch (error) {
    console.error('Error asking question:', error);
    updateLastAnswer('Sorry, I could not answer that question. Please try again.');
  } finally {
    askButton.disabled = false;
    askButton.textContent = 'Ask Question';
  }
}

function addQuestionToHistory(question: string, answer: string): void {
  const qaHistoryElement = byId('qa-history');
  if (!qaHistoryElement) return;
  
  const qaItem = document.createElement('div');
  qaItem.className = 'qa-item';
  qaItem.innerHTML = `
    <div class="question">
      <strong>Q:</strong> ${question}
    </div>
    <div class="answer">
      <strong>A:</strong> <span class="answer-text">${answer}</span>
    </div>
  `;
  
  qaHistoryElement.appendChild(qaItem);
  qaItem.scrollIntoView({ behavior: 'smooth' });
}

function updateLastAnswer(answer: string): void {
  const qaHistoryElement = byId('qa-history');
  if (!qaHistoryElement) return;
  
  const lastAnswer = qaHistoryElement.querySelector('.qa-item:last-child .answer-text');
  if (lastAnswer) {
    lastAnswer.textContent = answer;
  }
}