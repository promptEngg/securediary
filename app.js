// Check for access code
if (!sessionStorage.getItem('accessCode')) {
    window.location.href = 'index.html';
}

// Session management
let sessionTimeout = 20 * 1000; // 5 seconds in milliseconds
let sessionTimer = null;
let lastActivityTime = null;
let encryptionKey = null;

// DOM Elements
const notesSection = document.querySelector('.notes-section');
const noteTextarea = document.getElementById('note');
const saveEncryptedBtn = document.getElementById('saveEncrypted');
const savePlainBtn = document.getElementById('savePlain');
const clearNoteBtn = document.getElementById('clearNote');
const statusDiv = document.getElementById('status');
const sessionInfo = document.querySelector('.session-info');
const sessionTimerDisplay = document.getElementById('sessionTimer');
const logoutBtn = document.getElementById('logout');

// Generate encryption key from access code
async function generateKey(code) {
    const encoder = new TextEncoder();
    const codeBuffer = encoder.encode(code);
    const salt = new Uint8Array(16);
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        codeBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt text
async function encrypt(text) {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = encoder.encode(text);
    
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        encryptionKey,
        encodedText
    );
    
    const encryptedArray = new Uint8Array(encryptedContent);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);
    
    return btoa(String.fromCharCode.apply(null, result));
}

// Session Management
function startSession() {
    lastActivityTime = Date.now();
    sessionInfo.style.display = 'flex';
    updateSessionTimer();
    sessionTimer = setInterval(updateSessionTimer, 1000);
    
    // Add activity listeners
    document.addEventListener('mousemove', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
    document.addEventListener('click', resetSessionTimer);
}

function resetSessionTimer() {
    lastActivityTime = Date.now();
}

function updateSessionTimer() {
    const timeLeft = Math.max(0, sessionTimeout - (Date.now() - lastActivityTime));
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    sessionTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft === 0) {
        endSession();
    }
}

function endSession() {
    clearInterval(sessionTimer);
    noteTextarea.value = '';
    notesSection.style.display = 'none';
    sessionInfo.style.display = 'none';
    
    // Remove activity listeners
    document.removeEventListener('mousemove', resetSessionTimer);
    document.removeEventListener('keypress', resetSessionTimer);
    document.removeEventListener('click', resetSessionTimer);
    
    showStatus('Session expired. Page will refresh in 2 seconds.', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

// Save encrypted note to file
async function saveEncryptedNote() {
    try {
        const note = noteTextarea.value;
        if (!note) {
            showStatus('Please enter a note to save', 'error');
            return;
        }

        const encryptedNote = await encrypt(note);
        const options = {
            types: [{
                description: 'Encrypted Notes',
                accept: {
                    'text/plain': ['.enc']
                }
            }]
        };
        
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(encryptedNote);
        await writable.close();
        
        showStatus('Encrypted note saved successfully!', 'success');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showStatus('Error saving note: ' + error.message, 'error');
        }
    }
}

// Save plain text note to file
async function savePlainNote() {
    try {
        const note = noteTextarea.value;
        if (!note) {
            showStatus('Please enter a note to save', 'error');
            return;
        }

        const options = {
            types: [{
                description: 'Text Files',
                accept: {
                    'text/plain': ['.txt']
                }
            }]
        };
        
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(note);
        await writable.close();
        
        showStatus('Plain text note saved successfully!', 'success');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showStatus('Error saving note: ' + error.message, 'error');
        }
    }
}

// Event Listeners
saveEncryptedBtn.addEventListener('click', saveEncryptedNote);
savePlainBtn.addEventListener('click', savePlainNote);

clearNoteBtn.addEventListener('click', () => {
    noteTextarea.value = '';
    showStatus('Note cleared', 'info');
});

logoutBtn.addEventListener('click', () => {
    endSession();
    showStatus('Logged out successfully', 'success');
});

// Initialize
async function initialize() {
    const accessCode = sessionStorage.getItem('accessCode');
    if (accessCode) {
        encryptionKey = await generateKey(accessCode);
        startSession();
    }
}

initialize();

// Helper function to show status messages
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.style.color = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db';
    setTimeout(() => {
        statusDiv.textContent = '';
    }, 3000);
} 