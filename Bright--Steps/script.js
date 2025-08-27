// Game Data
        const gameData = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
            lowercase: 'abcdefghijklmnopqrstuvwxyz'.split(''),
            numbers: '0123456789'.split(''),
            shapes: ['🔴', '🔵', '🟢', '🟡', '🔺', '🔸', '⭐', '❤️', '🟦', '🟧']
        };

        // Same pronunciation for capital and small letters
const letterSounds = {
    'A': 'ay', 'a': 'ay',
    'B': 'bee', 'b': 'bee',
    'C': 'see', 'c': 'see',
    'D': 'dee', 'd': 'dee',
    'E': 'ee', 'e': 'ee',
    'F': 'ef', 'f': 'ef',
    'G': 'jee', 'g': 'jee',
    'H': 'aych', 'h': 'aych',
    'I': 'eye', 'i': 'eye',
    'J': 'jay', 'j': 'jay',
    'K': 'kay', 'k': 'kay',
    'L': 'el', 'l': 'el',
    'M': 'em', 'm': 'em',
    'N': 'en', 'n': 'en',
    'O': 'oh', 'o': 'oh',
    'P': 'pee', 'p': 'pee',
    'Q': 'cue', 'q': 'cue',
    'R': 'ar', 'r': 'ar',
    'S': 'es', 's': 'es',
    'T': 'tee', 't': 'tee',
    'U': 'you', 'u': 'you',
    'V': 'vee', 'v': 'vee',
    'W': 'double-you', 'w': 'double-you',
    'X': 'ex', 'x': 'ex',
    'Y': 'why', 'y': 'why',
    'Z': 'zee', 'z': 'zee',

    // Numbers
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine'
};


        // Shape sounds
        const shapeSounds = {
            '🔴': 'red circle', '🔵': 'blue circle', '🟢': 'green circle', '🟡': 'yellow circle',
            '🔺': 'triangle', '🔸': 'diamond', '⭐': 'star', '❤️': 'heart',
            '🟦': 'blue square', '🟧': 'orange square'
        };

        // Drawing paths for hints
        const drawingPaths = {
            'A': [
                {x: 300, y: 350, type: 'move'},
                {x: 250, y: 100, type: 'line'},
                {x: 350, y: 100, type: 'line'},
                {x: 300, y: 350, type: 'line'},
                {x: 275, y: 225, type: 'move'},
                {x: 325, y: 225, type: 'line'}
            ],
            'B': [
                {x: 250, y: 100, type: 'move'},
                {x: 250, y: 350, type: 'line'},
                {x: 320, y: 350, type: 'line'},
                {x: 340, y: 330, type: 'line'},
                {x: 340, y: 240, type: 'line'},
                {x: 320, y: 225, type: 'line'},
                {x: 250, y: 225, type: 'line'},
                {x: 320, y: 225, type: 'move'},
                {x: 330, y: 210, type: 'line'},
                {x: 330, y: 120, type: 'line'},
                {x: 320, y: 100, type: 'line'},
                {x: 250, y: 100, type: 'line'}
            ],
            // Add more letter paths as needed
            '🔴': [
                {x: 300, y: 150, type: 'move'},
                {x: 350, y: 175, type: 'curve'},
                {x: 375, y: 225, type: 'curve'},
                {x: 350, y: 275, type: 'curve'},
                {x: 300, y: 300, type: 'curve'},
                {x: 250, y: 275, type: 'curve'},
                {x: 225, y: 225, type: 'curve'},
                {x: 250, y: 175, type: 'curve'},
                {x: 300, y: 150, type: 'curve'}
            ]
        };

        // Game State
        let currentCategory = 'uppercase';
        let currentLetter = 'A';
        let currentIndex = 0;
        let canvas, ctx;
        let isDrawing = false;
        let userPath = [];
        let completedLetters = new Set();
        let hintAnimation = null;
        
        // Stats
        let stats = {
            accuracy: 0,
            attempts: 0,
            completed: 0,
            streak: 0,
            totalAccuracy: 0
        };

        // Voice synthesis
        let synth = window.speechSynthesis;
        let voices = [];
        let childVoice = null;

        // PWA support
        let deferredPrompt;

        // Initialize game
        document.addEventListener('DOMContentLoaded', function() {
            // Show loading screen briefly
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hide');
            }, 1500);

            createFloatingElements();
            loadVoices();
            setupPWA();
            
            // Initialize canvas when game starts
            setTimeout(() => {
                if (document.getElementById('tracingCanvas')) {
                    initCanvas();
                }
            }, 100);

            // Prevent zoom on double tap for mobile
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function (event) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        });

        function setupPWA() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('installPrompt').classList.add('show');
            });

            document.getElementById('installBtn').addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    deferredPrompt = null;
                    document.getElementById('installPrompt').classList.remove('show');
                }
            });

            document.getElementById('closeInstall').addEventListener('click', () => {
                document.getElementById('installPrompt').classList.remove('show');
            });
        }

        function loadVoices() {
    voices = synth.getVoices();

    // Look for female Indian voices only
    childVoice = voices.find(voice =>
        voice.name.includes('Google हिन्दी') || // Some browsers list Hindi as option
        voice.name.includes('Google भारतीय अंग्रेज़ी') ||
        voice.name.includes('Google Indian English Female') ||
        (voice.lang.toLowerCase().includes('en-in') && voice.name.toLowerCase().includes('female'))
    );

    // Fallback: pick ANY Indian English voice (male or female) if no female is found
    if (!childVoice) {
        childVoice = voices.find(voice => voice.lang.toLowerCase().includes('en-in'));
    }

    // If still no match, fallback to English female
    if (!childVoice) {
        childVoice = voices.find(voice =>
            voice.name.includes('Female') && voice.lang.toLowerCase().startsWith('en')
        ) || voices[0];
    }

    // Handle case where voices are not loaded yet
    if (voices.length === 0) {
        synth.onvoiceschanged = () => loadVoices();
    }
}

function createFloatingElements() {
    const container = document.getElementById('floatingElements');
    const elements = ['🌟', '✨', '🎨', '📝', '🎯', '🏆', '🎪', '🎭', '🔤', '🔡'];
    
    for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.className = 'floating-element';
        element.textContent = elements[Math.floor(Math.random() * elements.length)];
        element.style.left = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 20 + 's';
        element.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(element);
    }
}

function startGame() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    
    // Initialize canvas and game
    setTimeout(() => {
        initCanvas();
        populateLetters();
        drawCurrentLetter();
        updateProgress();
        updateStats();
    }, 100);
}

function goHome() {
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('mainMenu').classList.add('active');
}

function showLevels() {
    alert('🎯 Levels coming soon! More challenges await!');
}

function showSettings() {
    alert('⚙️ Settings coming soon! Customize your experience!');
}

function initCanvas() {
    canvas = document.getElementById('tracingCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    // Canvas event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch, {passive: false});
    canvas.addEventListener('touchmove', handleTouch, {passive: false});
    canvas.addEventListener('touchend', stopDrawing, {passive: false});
    
    // Resize canvas for mobile
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const maxWidth = Math.min(600, container.clientWidth - 40);
    const maxHeight = Math.min(400, window.innerHeight * 0.4);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = maxHeight + 'px';
    
    if (ctx) {
        drawCurrentLetter();
    }
}

function populateLetters() {
    const grid = document.getElementById('lettersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    gameData[currentCategory].forEach((letter, index) => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        if (completedLetters.has(letter)) {
            btn.classList.add('completed');
        }
        if (index === currentIndex) {
            btn.classList.add('active');
        }
        btn.textContent = letter;
        btn.onclick = () => selectLetter(letter, index);
        grid.appendChild(btn);
    });
}

function switchCategory(category) {
    currentCategory = category;
    currentIndex = 0;
    currentLetter = gameData[category][0];
    
    // Update tab appearance
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    populateLetters();
    updateCurrentLetterDisplay();
    drawCurrentLetter();
    clearCanvas();
}

function selectLetter(letter, index) {
    currentLetter = letter;
    currentIndex = index;
    
    updateCurrentLetterDisplay();
    populateLetters();
    drawCurrentLetter();
    clearCanvas();
    playSound();
}

function updateCurrentLetterDisplay() {
    const display = document.getElementById('currentLetter');
    if (display) {
        display.textContent = currentLetter;
    }
}

function drawCurrentLetter() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw guide letter/shape
    ctx.save();
    
    if (currentCategory === 'shapes') {
        // Shapes: render vector guides (traceable), not static emojis
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const isCircle = currentLetter === '🔴' || currentLetter === '🔵' || currentLetter === '🟢' || currentLetter === '🟡';
        if (isCircle) {
            const r = Math.min(canvas.width, canvas.height) * 0.28;
            const tint = currentLetter === '🔴' ? 'rgba(255, 80, 80, 0.35)'
                        : currentLetter === '🔵' ? 'rgba(79, 172, 254, 0.35)'
                        : currentLetter === '🟢' ? 'rgba(52, 199, 89, 0.35)'
                        : 'rgba(255, 217, 61, 0.35)';
            ctx.fillStyle = tint;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 12]);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            const poly = getShapePolyline(currentLetter);
            if (poly && poly.length > 1) {
                // Soft fill
                ctx.fillStyle = 'rgba(79, 172, 254, 0.10)';
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
                ctx.fill();

                // Dotted outline
                ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
                ctx.lineWidth = 4;
                ctx.setLineDash([12, 12]);
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                // Fallback to glyph if polyline unavailable
                ctx.font = `${Math.min(canvas.width, canvas.height) * 0.4}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(79, 172, 254, 0.3)';
                ctx.fillText(currentLetter, cx, cy);
                ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
                ctx.lineWidth = 4;
                ctx.setLineDash([10, 10]);
                ctx.strokeText(currentLetter, cx, cy);
                ctx.setLineDash([]);
            }
        }
    } else {
        // For letters and numbers
        ctx.font = `${Math.min(canvas.width, canvas.height) * 0.6}px Fredoka`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(79, 172, 254, 0.3)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        
        // Add glow effect
        ctx.shadowColor = 'rgba(79, 172, 254, 0.5)';
        ctx.shadowBlur = 20;
        ctx.strokeText(currentLetter, x, y);
        
        // Draw dotted guide
        ctx.shadowBlur = 0;
        ctx.setLineDash([15, 15]);
        ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
        ctx.lineWidth = 4;
        ctx.strokeText(currentLetter, x, y);
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

// Build an opaque guide mask of the current letter/shape for hit-testing user strokes
function getGuideMaskImageData() {
    if (!canvas) return null;
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const octx = off.getContext('2d');

    octx.clearRect(0, 0, off.width, off.height);
    octx.save();

    if (currentCategory === 'shapes') {
        const cx = off.width / 2;
        const cy = off.height / 2;
        const isCircle = currentLetter === '🔴' || currentLetter === '🔵' || currentLetter === '🟢' || currentLetter === '🟡';
        if (isCircle) {
            const r = Math.min(off.width, off.height) * 0.30; // mask slightly larger
            octx.fillStyle = '#000';
            octx.beginPath();
            octx.arc(cx, cy, r, 0, Math.PI * 2);
            octx.fill();
            // dilation ring for tolerance
            octx.strokeStyle = '#000';
            octx.lineWidth = 30;
            octx.beginPath();
            octx.arc(cx, cy, r, 0, Math.PI * 2);
            octx.stroke();
        } else {
            const poly = getShapePolyline(currentLetter);
            if (poly && poly.length > 1) {
                octx.fillStyle = '#000';
                octx.beginPath();
                octx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) octx.lineTo(poly[i].x, poly[i].y);
                octx.closePath();
                octx.fill();
                // dilation stroke for tolerance
                octx.strokeStyle = '#000';
                octx.lineJoin = 'round';
                octx.lineCap = 'round';
                octx.lineWidth = 30;
                octx.beginPath();
                octx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) octx.lineTo(poly[i].x, poly[i].y);
                octx.closePath();
                octx.stroke();
            } else {
                // fallback to glyph
                octx.font = `${Math.min(off.width, off.height) * 0.5}px Arial`;
                octx.textAlign = 'center';
                octx.textBaseline = 'middle';
                octx.fillStyle = '#000';
                octx.fillText(currentLetter, cx, cy);
                octx.strokeStyle = '#000';
                octx.lineWidth = 20;
                octx.strokeText(currentLetter, cx, cy);
            }
        }
    } else {
        octx.font = `${Math.min(off.width, off.height) * 0.6}px Fredoka`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.strokeStyle = '#000';
        octx.lineWidth = 24; // generous stroke to form a mask region
        octx.lineCap = 'round';
        octx.lineJoin = 'round';
        octx.strokeText(currentLetter, off.width / 2, off.height / 2);
    }

    octx.restore();
    try {
        return octx.getImageData(0, 0, off.width, off.height);
    } catch (e) {
        return null;
    }
}

// Compute what fraction of user points lie within the opaque mask
function computeInMaskRatio(userPoints, maskImageData) {
    if (!maskImageData || !userPoints || userPoints.length === 0) return 0;
    const { width, data } = maskImageData;
    let inMask = 0;
    let total = 0;
    for (let i = 0; i < userPoints.length; i += 1) {
        const px = Math.max(0, Math.min(Math.floor(userPoints[i].x), canvas.width - 1));
        const py = Math.max(0, Math.min(Math.floor(userPoints[i].y), canvas.height - 1));
        const idx = (py * width + px) * 4 + 3; // alpha channel
        const alpha = data[idx];
        if (alpha > 10) inMask++;
        total++;
    }
    return total === 0 ? 0 : inMask / total;
}

function startDrawing(e) {
    isDrawing = true;
    userPath = [];
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    userPath.push({x, y, timestamp: Date.now()});
    
    // Clear any hint animation
    if (hintAnimation) {
        cancelAnimationFrame(hintAnimation);
        hintAnimation = null;
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    userPath.push({x, y, timestamp: Date.now()});
    
    // Draw user's trace with enhanced visual feedback
    ctx.save();
    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff6b9d';
    ctx.shadowBlur = 15;
    
    const len = userPath.length;
    if (len >= 2) {
        ctx.beginPath();
        ctx.moveTo(userPath[len-2].x, userPath[len-2].y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    ctx.restore();
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    const mouseEvent = new MouseEvent(
        e.type === 'touchstart' ? 'mousedown' : 
        e.type === 'touchmove' ? 'mousemove' : 'mouseup',
        {
            clientX: touch.clientX,
            clientY: touch.clientY
        }
    );
    canvas.dispatchEvent(mouseEvent);
}

function clearCanvas() {
    userPath = [];
    if (hintAnimation) {
        cancelAnimationFrame(hintAnimation);
        hintAnimation = null;
    }
    drawCurrentLetter();
}

function showHint() {
    // Animated drawing demonstration (step-by-step stroke order)
    // For shapes, use vector stroke animation. For letters/numbers, use outline tracing always.
    if (currentCategory !== 'shapes') {
        animateTextOutlineHint();
        playEncourageSound();
        return;
    }
    const path = drawingPaths[currentLetter];
    if (!path) {
        animateShapeHint(currentLetter);
        playEncourageSound();
        return;
    }

    // Cancel any existing hint animation
    if (hintAnimation) {
        cancelAnimationFrame(hintAnimation);
        hintAnimation = null;
    }

    // Build strokes (split by 'move')
    const strokes = [];
    let currentStroke = [];
    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        if (p.type === 'move') {
            if (currentStroke.length > 0) strokes.push(currentStroke);
            currentStroke = [{ x: p.x, y: p.y }];
        } else {
            currentStroke.push({ x: p.x, y: p.y, t: p.type });
        }
    }
    if (currentStroke.length > 0) strokes.push(currentStroke);

    // Animation state
    let strokeIndex = 0;
    let strokeStartTime = 0;
    const speed = Math.max(200, Math.min(canvas.width, canvas.height)); // px per second

    const lerp = (a, b, t) => a + (b - a) * t;
    const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

    function strokeLength(points) {
        let d = 0;
        for (let i = 1; i < points.length; i++) d += dist(points[i - 1], points[i]);
        return d;
    }

    function pointAt(points, target) {
        let acc = 0;
        for (let i = 1; i < points.length; i++) {
            const seg = dist(points[i - 1], points[i]);
            if (acc + seg >= target) {
                const t = (target - acc) / seg;
                return {
                    x: lerp(points[i - 1].x, points[i].x, t),
                    y: lerp(points[i - 1].y, points[i].y, t)
                };
            }
            acc += seg;
        }
        return points[points.length - 1];
    }

    function drawStrokeUpTo(points, lengthToDraw) {
        let acc = 0;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const seg = dist(points[i - 1], points[i]);
            if (acc + seg <= lengthToDraw) {
                ctx.lineTo(points[i].x, points[i].y);
                acc += seg;
            } else {
                const t = (lengthToDraw - acc) / seg;
                ctx.lineTo(
                    lerp(points[i - 1].x, points[i].x, t),
                    lerp(points[i - 1].y, points[i].y, t)
                );
                break;
            }
        }
        ctx.stroke();
    }

    function drawHandCursor(x, y) {
        ctx.save();
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 6;
        ctx.fillText('👉', x, y);
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCurrentLetter();

        // Draw completed strokes
        ctx.save();
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ffd93d';
        ctx.shadowBlur = 15;

        for (let i = 0; i < strokeIndex; i++) {
            ctx.beginPath();
            ctx.moveTo(strokes[i][0].x, strokes[i][0].y);
            for (let j = 1; j < strokes[i].length; j++) {
                ctx.lineTo(strokes[i][j].x, strokes[i][j].y);
            }
            ctx.stroke();
        }

        // Animate current stroke
        if (strokeIndex < strokes.length) {
            const pts = strokes[strokeIndex];
            const len = strokeLength(pts);
            if (strokeStartTime === 0) strokeStartTime = performance.now();
            const elapsed = (performance.now() - strokeStartTime) / 1000; // seconds
            const drawLen = Math.min(len, elapsed * speed);

            drawStrokeUpTo(pts, drawLen);

            // Draw moving hand cursor at current tip
            const tip = pointAt(pts, drawLen);
            drawHandCursor(tip.x, tip.y);

            // Stroke number at start
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#ff6b9d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pts[0].x, pts[0].y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff6b9d';
            ctx.font = 'bold 14px Fredoka, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(strokeIndex + 1), pts[0].x, pts[0].y);

            if (drawLen >= len) {
                // advance to next stroke after a short pause
                strokeIndex++;
                strokeStartTime = 0;
            }
        }

        ctx.restore();
        if (strokeIndex < strokes.length) {
            hintAnimation = requestAnimationFrame(animate);
        }
    }

    animate();
    playEncourageSound();
}

// Animate outline tracing for any letter/number exactly as rendered, preserving curves
function animateTextOutlineHint() {
    // Cancel previous animation if any
    if (hintAnimation) {
        cancelAnimationFrame(hintAnimation);
        hintAnimation = null;
    }

    const start = performance.now();
    const duration = 4500; // slower for kids
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const fontSize = Math.min(canvas.width, canvas.height) * 0.6;
    const fontSpec = `${fontSize}px Fredoka`;

    // Offscreen canvas for masking strictly inside glyph
    const animCan = document.createElement('canvas');
    animCan.width = canvas.width;
    animCan.height = canvas.height;
    const actx = animCan.getContext('2d');

    function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const dashLen = 5 + t * 6000; // slow progressive reveal

        // Clear and redraw background guide
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCurrentLetter();

        // Draw progressive stroke to offscreen
        actx.clearRect(0, 0, animCan.width, animCan.height);
        actx.save();
        actx.setLineDash([dashLen, 9999]);
        actx.lineDashOffset = 0;
        actx.strokeStyle = '#ffd93d';
        actx.lineWidth = 8;
        actx.lineCap = 'round';
        actx.lineJoin = 'round';
        actx.shadowColor = '#ffd93d';
        actx.shadowBlur = 15;
        actx.font = fontSpec;
        actx.textAlign = 'center';
        actx.textBaseline = 'middle';
        actx.strokeText(currentLetter, x, y);
        actx.restore();

        // Mask strictly to glyph interior
        actx.save();
        actx.globalCompositeOperation = 'destination-in';
        actx.fillStyle = '#000';
        actx.font = fontSpec;
        actx.textAlign = 'center';
        actx.textBaseline = 'middle';
        actx.fillText(currentLetter, x, y);
        actx.restore();

        // Blit to main canvas
        ctx.drawImage(animCan, 0, 0);

        // Estimate current tip by scanning revealed stroke for a visible pixel
        try {
            const img = actx.getImageData(0, 0, animCan.width, animCan.height);
            const data = img.data;
            let tipX = x, tipY = y;
            // coarse scan to reduce cost
            const step = 4;
            let bestScore = -1;
            for (let py = 0; py < img.height; py += step) {
                for (let px = 0; px < img.width; px += step) {
                    const idx = (py * img.width + px) * 4 + 3;
                    if (data[idx] > 10) {
                        const score = px + py; // simple heuristic toward latest drawn edge
                        if (score > bestScore) {
                            bestScore = score;
                            tipX = px;
                            tipY = py;
                        }
                    }
                }
            }
            // Draw hand cursor on estimated tip
            drawHandCursor(tipX, tipY);
        } catch (e) {
            // ignore if security error
        }

        if (t < 1) {
            hintAnimation = requestAnimationFrame(frame);
        }
    }

    hintAnimation = requestAnimationFrame(frame);
}

// Animate tracing for known shapes using vector paths to keep curves smooth
function animateShapeHint(symbol) {
    // Cancel previous animation if any
    if (hintAnimation) {
        cancelAnimationFrame(hintAnimation);
        hintAnimation = null;
    }

    // Special-case perfect circle animation for colored circle emojis
    if (symbol === '🔴' || symbol === '🔵' || symbol === '🟢' || symbol === '🟡') {
        return animateCircleHint();
    }

    const polyline = getShapePolyline(symbol);
    if (!polyline || polyline.length < 2) {
        // Fallback to highlight if something failed
        ctx.save();
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ffd93d';
        ctx.shadowBlur = 20;
        ctx.strokeText(symbol, canvas.width/2, canvas.height/2);
        ctx.restore();
        return;
    }

    // Precompute cumulative lengths
    const segLengths = [];
    let total = 0;
    for (let i = 1; i < polyline.length; i++) {
        const d = Math.hypot(polyline[i].x - polyline[i-1].x, polyline[i].y - polyline[i-1].y);
        segLengths.push(d);
        total += d;
    }

    const start = performance.now();
    const duration = 2200;

    function drawUpTo(len) {
        ctx.beginPath();
        ctx.moveTo(polyline[0].x, polyline[0].y);
        let acc = 0;
        for (let i = 1; i < polyline.length; i++) {
            const seg = segLengths[i-1];
            if (acc + seg <= len) {
                ctx.lineTo(polyline[i].x, polyline[i].y);
                acc += seg;
            } else {
                const t = (len - acc) / seg;
                const x = polyline[i-1].x + (polyline[i].x - polyline[i-1].x) * t;
                const y = polyline[i-1].y + (polyline[i].y - polyline[i-1].y) * t;
                ctx.lineTo(x, y);
                break;
            }
        }
        ctx.stroke();
    }

    function pointAt(len) {
        let acc = 0;
        for (let i = 1; i < polyline.length; i++) {
            const seg = segLengths[i-1];
            if (acc + seg >= len) {
                const t = (len - acc) / seg;
                return {
                    x: polyline[i-1].x + (polyline[i].x - polyline[i-1].x) * t,
                    y: polyline[i-1].y + (polyline[i].y - polyline[i-1].y) * t
                };
            }
            acc += seg;
        }
        return polyline[polyline.length - 1];
    }

    function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const len = total * t;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCurrentLetter();

        ctx.save();
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ffd93d';
        ctx.shadowBlur = 15;
        drawUpTo(len);

        const tip = pointAt(len);
        ctx.fillStyle = '#ffb300';
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (t < 1) {
            hintAnimation = requestAnimationFrame(frame);
        }
    }

    hintAnimation = requestAnimationFrame(frame);
}

// Smooth arc-based animation for circle emojis to avoid polygonal appearance
function animateCircleHint() {
    if (hintAnimation) {
        cancelAnimationFrame(hintAnimation);
        hintAnimation = null;
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(canvas.width, canvas.height) * 0.28;
    const start = performance.now();
    const duration = 2200;

    function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const endAngle = -Math.PI / 2 + t * Math.PI * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCurrentLetter();

        ctx.save();
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ffd93d';
        ctx.shadowBlur = 15;

        // Draw arc from start angle
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, endAngle, false);
        ctx.stroke();

        // Moving tip dot
        const tipX = cx + r * Math.cos(endAngle);
        const tipY = cy + r * Math.sin(endAngle);
        ctx.fillStyle = '#ffb300';
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (t < 1) {
            hintAnimation = requestAnimationFrame(frame);
        }
    }

    hintAnimation = requestAnimationFrame(frame);
}

// Returns a smooth polyline approximating the target shape centered in canvas
function getShapePolyline(symbol) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(canvas.width, canvas.height) * 0.28;

    const points = [];
    const push = (x, y) => points.push({ x, y });

    if (symbol === '🔴' || symbol === '🔵' || symbol === '🟢' || symbol === '🟡') {
        // Circle
        const steps = 180;
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * Math.PI * 2;
            push(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        return points;
    }

    if (symbol === '🟦' || symbol === '🟧') {
        // Square
        const s = r * 1.4;
        const verts = [
            {x: cx - s, y: cy - s},
            {x: cx + s, y: cy - s},
            {x: cx + s, y: cy + s},
            {x: cx - s, y: cy + s},
            {x: cx - s, y: cy - s}
        ];
        return verts;
    }

    if (symbol === '🔺') {
        // Triangle
        const s = r * 2;
        const h = s * Math.sqrt(3) / 2;
        const verts = [
            {x: cx, y: cy - h/1.2},
            {x: cx - s/2, y: cy + h/2},
            {x: cx + s/2, y: cy + h/2},
            {x: cx, y: cy - h/1.2}
        ];
        return verts;
    }

    if (symbol === '🔸') {
        // Diamond
        const s = r * 1.6;
        const verts = [
            {x: cx, y: cy - s},
            {x: cx + s, y: cy},
            {x: cx, y: cy + s},
            {x: cx - s, y: cy},
            {x: cx, y: cy - s}
        ];
        return verts;
    }

    if (symbol === '⭐') {
        // 5-point star
        const outer = r * 1.1;
        const inner = outer * 0.5;
        for (let i = 0; i <= 10; i++) {
            const a = -Math.PI/2 + (i * Math.PI / 5);
            const rad = i % 2 === 0 ? outer : inner;
            push(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
        }
        return points;
    }

    if (symbol === '❤️') {
        // Heart curve via parametric equation
        const steps = 200;
        const scale = r / 16;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const x = 16 * Math.sin(t) ** 3;
            const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            push(cx + x * scale, cy - y * scale);
        }
        return points;
    }

    // Default: return null to fallback
    return null;
}

function nextLetter() {
    const letters = gameData[currentCategory];
    currentIndex = (currentIndex + 1) % letters.length;
    currentLetter = letters[currentIndex];
    
    updateCurrentLetterDisplay();
    populateLetters();
    drawCurrentLetter();
    clearCanvas();
    updateProgress();
}

function checkTracing() {
    // Build mask and decide if the stroke is relevant to the target letter
    const mask = getGuideMaskImageData();
    const inMaskRatio = computeInMaskRatio(userPath, mask);

    // If mostly outside the guide area: do not compute or show accuracy
    if (inMaskRatio < 0.2) {
        showFeedback({
            icon: '🧭',
            title: 'Stay Inside!',
            message: 'Trace inside the letter area.',
            type: 'retry'
        });
        playEncourageSound();
        return;
    }

    // If inside the area but not matching well enough: prompt to trace the correct letter
    if (inMaskRatio < 0.7) {
        showFeedback({
            icon: '🎯',
            title: 'Let\'s Try Again!',
            message: 'Try tracing the correct letter.',
            type: 'retry'
        });
        playTryAgainSound();
        return;
    }

    // Only now treat as a valid attempt and compute accuracy
    stats.attempts++;
    const accuracy = calculateAccuracy();
    stats.totalAccuracy += accuracy;
    stats.accuracy = Math.round(stats.totalAccuracy / stats.attempts);

    let feedback = {};
    
    if (accuracy >= 70) {  // Lower threshold for better encouragement
        stats.completed++;
        stats.streak++;
        completedLetters.add(currentLetter);
        feedback = {
            icon: '🌟',
            title: 'Amazing Work!',
            message: `Great job tracing ${currentLetter}! You earned ${accuracy}% accuracy!`,
            type: 'excellent'
        };
        createCelebration();
        playSuccessSound();
        setTimeout(() => {
            if (synth && !synth.speaking) {
                playSound();
            }
        }, 2500);
    } else if (accuracy >= 50) {
        stats.streak = Math.max(0, stats.streak - 1);
        feedback = {
            icon: '👏',
            title: 'Good Try!',
            message: `You're getting better! Keep practicing ${currentLetter}!`,
            type: 'good'
        };
        playGoodSound();
    } else if (accuracy >= 30) {
        stats.streak = 0;
        feedback = {
            icon: '💪',
            title: 'Keep Going!',
            message: `Practice makes perfect! Try tracing ${currentLetter} again!`,
            type: 'okay'
        };
        playEncourageSound();
    } else {
        stats.streak = 0;
        feedback = {
            icon: '🎯',
            title: 'Let\'s Try Again!',
            message: `You can do it! Let me show you how to trace ${currentLetter}!`,
            type: 'retry'
        };
        playTryAgainSound();
        setTimeout(() => { showHint(); }, 2000);
    }

    showFeedback(feedback);
    updateStats();
    populateLetters();
}

function calculateAccuracy() {
    if (userPath.length === 0) return 0;
    
    // More forgiving accuracy calculation for autism-friendly experience
    const pathLength = userPath.length;
    const minExpectedLength = 20;
    const maxExpectedLength = 100;
    
    // Length score (more forgiving)
    let lengthScore = 100;
    if (pathLength < minExpectedLength) {
        lengthScore = (pathLength / minExpectedLength) * 80;
    } else if (pathLength > maxExpectedLength) {
        lengthScore = Math.max(60, 100 - ((pathLength - maxExpectedLength) * 0.5));
    }
    
    // Coverage score - check if user drew in different areas
    const canvas_width = canvas.width;
    const canvas_height = canvas.height;
    const gridSize = 50;
    const grid = {};
    
    userPath.forEach(point => {
        const gridX = Math.floor(point.x / gridSize);
        const gridY = Math.floor(point.y / gridSize);
        grid[`${gridX},${gridY}`] = true;
    });
    
    const coveredCells = Object.keys(grid).length;
    const coverageScore = Math.min(100, (coveredCells / 6) * 100); // Expect at least 6 grid cells
    
    // Smoothness score (less strict)
    let smoothnessScore = 100;
    let sharpTurns = 0;
    
    for (let i = 2; i < Math.min(userPath.length, 50); i += 2) { // Check every other point
        const p1 = userPath[i-2];
        const p2 = userPath[i-1];
        const p3 = userPath[i];
        
        const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        const angleDiff = Math.abs(angle1 - angle2);
        
        if (angleDiff > Math.PI / 3) { // Allow sharper turns
            sharpTurns++;
        }
    }
    
    smoothnessScore = Math.max(40, 100 - (sharpTurns * 5));
    
    // Final score with weighted components (more forgiving)
    const finalScore = Math.round(
        lengthScore * 0.3 + 
        coverageScore * 0.4 + 
        smoothnessScore * 0.3
    );
    
    return Math.max(0, Math.min(100, finalScore));
}

function showFeedback(feedback) {
    const overlay = document.getElementById('feedbackOverlay');
    const icon = document.getElementById('feedbackIcon');
    const title = document.getElementById('feedbackTitle');
    const message = document.getElementById('feedbackMessage');
    
    icon.textContent = feedback.icon;
    title.textContent = feedback.title;
    message.textContent = feedback.message;
    
    overlay.classList.add('show');
    
    // Auto-close feedback after 3 seconds for better flow
    setTimeout(() => {
        if (overlay.classList.contains('show')) {
            closeFeedback();
        }
    }, 3000);
}

function closeFeedback() {
    document.getElementById('feedbackOverlay').classList.remove('show');
}

function updateStats() {
    document.getElementById('accuracy').textContent = stats.accuracy + '%';
    document.getElementById('attempts').textContent = stats.attempts;
    document.getElementById('completed').textContent = stats.completed;
    document.getElementById('streak').textContent = stats.streak;
}

function updateProgress() {
    const totalLetters = gameData[currentCategory].length;
    const progress = (stats.completed / totalLetters) * 100;
    document.getElementById('progressFill').style.width = Math.min(progress, 100) + '%';
}

function createCelebration() {
    const celebration = document.getElementById('celebration');
    const colors = ['#ffd93d', '#ff6b9d', '#4facfe', '#00f2fe', '#a8edea', '#fed6e3'];
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 1 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        celebration.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Enhanced sound functions for autism-friendly experience - FIXED VERSION
function playSound() {
    if (synth && synth.speaking) {
        synth.cancel();
    }

    let textToSpeak = currentLetter;

    if (currentCategory === 'shapes') {
        textToSpeak = shapeSounds[currentLetter] || currentLetter;
    } else if (letterSounds[currentLetter]) {
        textToSpeak = letterSounds[currentLetter];
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (childVoice) {
        utterance.voice = childVoice;
    }

    utterance.pitch = 1.1;
    utterance.rate = 0.95;
    utterance.volume = 1.0;

    synth.speak(utterance);
}

function playSuccessSound() {
    // Cancel any ongoing speech to prevent collision
    if (synth && synth.speaking) {
        synth.cancel();
    }
    
    const phrases = [
        "Excellent work!", "You did it!", "Amazing job!", "Perfect!",
        "Wonderful!", "You're a star!", "Great job!", "Fantastic!"
    ];
    speakPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
}

function playGoodSound() {
    // Cancel any ongoing speech to prevent collision
    if (synth && synth.speaking) {
        synth.cancel();
    }
    
    const phrases = [
        "Good try!", "Keep it up!", "You're doing well!", "Nice work!",
        "Getting better!", "Good job!", "Well done!"
    ];
    speakPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
}

function playEncourageSound() {
    // Cancel any ongoing speech to prevent collision
    if (synth && synth.speaking) {
        synth.cancel();
    }
    
    const phrases = [
        "You can do it!", "Keep trying!", "Don't give up!", "Practice makes perfect!",
        "You're learning!", "Try again!", "Keep going!"
    ];
    speakPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
}

function playTryAgainSound() {
    // Cancel any ongoing speech to prevent collision
    if (synth && synth.speaking) {
        synth.cancel();
    }
    
    const phrases = [
        "Let's try again!", "No worries, try once more!", "Practice time!",
        "Let me help you!", "We can do this together!"
    ];
    speakPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
}

function speakPhrase(phrase) {
    // Ensure clean speech queue
    if (synth && synth.speaking) {
        synth.cancel();
    }
    
    // Add a small delay to ensure clean start
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(phrase);
        
        if (childVoice) {
            utterance.voice = childVoice;
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.7;
        
        synth.speak(utterance);
    }, 100); // Small delay to ensure clean speech queue
}

// Accessibility improvements
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            playSound();
            break;
        case 'Enter':
            e.preventDefault();
            if (document.getElementById('gameScreen').classList.contains('active')) {
                checkTracing();
            }
            break;
        case 'Escape':
            e.preventDefault();
            clearCanvas();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextLetter();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            const letters = gameData[currentCategory];
            currentIndex = (currentIndex - 1 + letters.length) % letters.length;
            currentLetter = letters[currentIndex];
            updateCurrentLetterDisplay();
            populateLetters();
            drawCurrentLetter();
            clearCanvas();
            updateProgress();
            break;
        case 'h':
        case 'H':
            e.preventDefault();
            showHint();
            break;
    }
});

// Touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!e.changedTouches) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Minimum swipe distance
    if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) return;
    
    // Only process swipes if not on canvas
    if (e.target.id === 'tracingCanvas') return;
    
    // Horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            // Swipe right - next letter
            nextLetter();
        } else {
            // Swipe left - previous letter
            const letters = gameData[currentCategory];
            currentIndex = (currentIndex - 1 + letters.length) % letters.length;
            currentLetter = letters[currentIndex];
            updateCurrentLetterDisplay();
            populateLetters();
            drawCurrentLetter();
            clearCanvas();
            updateProgress();
        }
    }
}, { passive: true });

// Auto-save progress
function saveProgress() {
    const progress = {
        stats: stats,
        completedLetters: Array.from(completedLetters),
        currentCategory: currentCategory,
        currentLetter: currentLetter,
        currentIndex: currentIndex
    };
    // Note: localStorage not available in Claude artifacts
    // localStorage.setItem('magicLettersProgress', JSON.stringify(progress));
}

function loadProgress() {
    // Note: localStorage not available in Claude artifacts
    // const saved = localStorage.getItem('magicLettersProgress');
    // if (saved) {
    //     try {
    //         const progress = JSON.parse(saved);
    //         stats = { ...stats, ...progress.stats };
    //         completedLetters = new Set(progress.completedLetters || []);
    //         if (progress.currentCategory) {
    //             currentCategory = progress.currentCategory;
    //             currentLetter = progress.currentLetter || gameData[currentCategory][0];
    //             currentIndex = progress.currentIndex || 0;
    //         }
    //     } catch (e) {
    //         console.log('Could not load saved progress');
    //     }
    // }
}

// Auto-save on important actions
function autoSave() {
    setTimeout(saveProgress, 100);
}

// Add auto-save calls to key functions
const originalCheckTracing = checkTracing;
checkTracing = function() {
    originalCheckTracing();
    autoSave();
};

const originalSwitchCategory = switchCategory;
switchCategory = function(category) {
    originalSwitchCategory(category);
    autoSave();
};

// Load progress on startup
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Performance optimization: throttle drawing
let lastDraw = 0;
const DRAW_THROTTLE = 16; // ~60fps

const originalDraw = draw;
draw = function(e) {
    const now = Date.now();
    if (now - lastDraw > DRAW_THROTTLE) {
        originalDraw(e);
        lastDraw = now;
    }
};

// Enhanced mobile support
function setupMobileOptimizations() {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Handle device orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            resizeCanvas();
            drawCurrentLetter();
        }, 100);
    });

    // Optimize for different screen densities
    const ratio = window.devicePixelRatio || 1;
    if (ratio > 1 && canvas) {
        const displayWidth = canvas.offsetWidth;
        const displayHeight = canvas.offsetHeight;
        
        canvas.width = displayWidth * ratio;
        canvas.height = displayHeight * ratio;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        ctx.scale(ratio, ratio);
    }
}

// Initialize mobile optimizations
setTimeout(setupMobileOptimizations, 500);

// Add haptic feedback for supported devices
function vibrate(pattern = [100]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Add vibration to success feedback
const originalShowFeedback = showFeedback;
showFeedback = function(feedback) {
    originalShowFeedback(feedback);
    if (feedback.type === 'excellent') {
        vibrate([100, 50, 100]);
    } else if (feedback.type === 'good') {
        vibrate([100]);
    }
};


