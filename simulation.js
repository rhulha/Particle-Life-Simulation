class ParticleSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.regionSize = { x: 2560, y: 1440 };
        this.particles = [];
        this.forces = [];
        this.colors = [];
        this.particleTypes = 4;
        this.randomSeed = 0;
        this.randomState = 0;
        
        this.cameraOrigin = { x: this.regionSize.x / 2, y: this.regionSize.y / 2 };
        this.cameraZoom = 1.0;
        this.targetZoom = 1.0;
        
        this.mouse = { x: 0, y: 0, down: false };
        this.mouseChange = { x: 0, y: 0 };
        this.cumulativeMouseChange = { x: 0, y: 0 };
        
        this.isActive = true;
        this.isPaused = false;
        this.showUI = true;
        
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsTime = performance.now();
        
        this.params = {
            particleCount: 500,
            particleRadius: 5,
            dampening: 0.99,
            repulsionRadius: 50,
            interactionRadius: 150,
            densityLimit: 5,
            regenerateForces: false,
            regenerateColors: false,
            seed: 0
        };
        
        this.regenerateColors();
        this.generateDefaultForces();
        this.setupUI();
        this.initSimulation();
        this.setupInputHandlers();
        this.loop();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupUI() {
        const uiPanel = document.getElementById('uiPanel');
        const closeBtn = document.getElementById('closeBtn');
        
        closeBtn.addEventListener('click', () => {
            uiPanel.classList.toggle('hidden');
            this.showUI = !this.showUI;
        });
        
        document.getElementById('particleCountSlider').addEventListener('input', (e) => {
            this.params.particleCount = Math.max(2, Math.pow(e.target.value, 2));
            document.getElementById('particleCountLabel').textContent = Math.floor(this.params.particleCount);
        });
        
        document.getElementById('particleTypesSlider').addEventListener('input', (e) => {
            const newTypes = Math.floor(e.target.value);
            if (newTypes !== this.particleTypes) {
                this.particleTypes = newTypes;
                this.regenerateForces();
                this.regenerateColors();
                this.updateUI();
                document.getElementById('particleTypesLabel').textContent = this.particleTypes;
            }
        });
        
        document.getElementById('particleRadiusSlider').addEventListener('input', (e) => {
            this.params.particleRadius = parseFloat(e.target.value);
            document.getElementById('particleRadiusLabel').textContent = this.params.particleRadius.toFixed(1);
        });
        
        document.getElementById('dampeningSlider').addEventListener('input', (e) => {
            this.params.dampening = parseFloat(e.target.value);
            document.getElementById('dampeningLabel').textContent = this.params.dampening.toFixed(2);
        });
        
        document.getElementById('repulsionSlider').addEventListener('input', (e) => {
            this.params.repulsionRadius = parseFloat(e.target.value);
            document.getElementById('repulsionLabel').textContent = Math.floor(this.params.repulsionRadius);
        });
        
        document.getElementById('interactionSlider').addEventListener('input', (e) => {
            this.params.interactionRadius = parseFloat(e.target.value);
            document.getElementById('interactionLabel').textContent = Math.floor(this.params.interactionRadius);
        });
        
        document.getElementById('densityLimitSlider').addEventListener('input', (e) => {            
            this.params.densityLimit = parseFloat(e.target.value);
            document.getElementById('densityLimitLabel').textContent = this.params.densityLimit.toFixed(1);
        });
        
        document.getElementById('seedInput').addEventListener('change', (e) => {
            this.params.seed = Math.floor(e.target.value);
        });
        
        document.getElementById('regenerateForcesCheckbox').addEventListener('change', (e) => {
            this.params.regenerateForces = e.target.checked;
        });
        
        document.getElementById('regenerateColorsCheckbox').addEventListener('change', (e) => {
            this.params.regenerateColors = e.target.checked;
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.initSimulation();
        });
        
        this.updateUI();
    }
    
    updateUI() {
        const colorPickersDiv = document.getElementById('colorPickers');
        colorPickersDiv.innerHTML = '';
        
        for (let i = 0; i < this.particleTypes; i++) {
            const pickers = document.createElement('div');
            pickers.className = 'color-pickers';
            
            const picker = document.createElement('div');
            picker.className = 'color-picker';
            
            const label = document.createElement('label');
            label.textContent = `Type ${i}`;
            
            const input = document.createElement('input');
            input.type = 'color';
            input.value = this.rgbToHex(this.colors[i]);
            
            input.addEventListener('change', (e) => {
                this.colors[i] = this.hexToRgb(e.target.value);
            });
            
            picker.appendChild(label);
            picker.appendChild(input);
            pickers.appendChild(picker);
            colorPickersDiv.appendChild(pickers);
        }
        
        this.updateForceMatrix();
    }
    
    updateForceMatrix() {
        const forceButtonsDiv = document.getElementById('forceButtons');
        forceButtonsDiv.innerHTML = '';
        
        for (let i = 0; i < this.particleTypes; i++) {
            for (let j = 0; j < this.particleTypes; j++) {
                const btn = document.createElement('button');
                btn.className = 'force-button';
                btn.title = `Type ${i} → Type ${j}`;
                
                const index = i + j * this.particleTypes;
                const force = this.forces[index];
                
                btn.style.backgroundColor = this.forceToColor(force);
                btn.textContent = force.toFixed(1);
                
                btn.addEventListener('click', (e) => {
                    if (e.button === 2) {
                        this.forces[index] = 0;
                    } else {
                        this.forces[index] += 0.1;
                        this.forces[index] = Math.max(-1, Math.min(1, this.forces[index]));
                    }
                    btn.style.backgroundColor = this.forceToColor(this.forces[index]);
                    btn.textContent = this.forces[index].toFixed(1);
                });
                
                btn.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    this.forces[index] += delta;
                    this.forces[index] = Math.max(-1, Math.min(1, this.forces[index]));
                    btn.style.backgroundColor = this.forceToColor(this.forces[index]);
                    btn.textContent = this.forces[index].toFixed(1);
                });
                
                forceButtonsDiv.appendChild(btn);
            }
        }
    }
    
    forceToColor(force) {
        const hue = force < 0 ? 0 : 120;
        const saturation = Math.abs(force) * 100;
        const lightness = 30 + (1 - Math.abs(force)) * 20;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    rgbToHex(rgb) {
        const r = Math.floor(rgb.r * 255).toString(16).padStart(2, '0');
        const g = Math.floor(rgb.g * 255).toString(16).padStart(2, '0');
        const b = Math.floor(rgb.b * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b, a: 1 };
    }
    
    initSimulation() {
        this.randomSeed = this.params.seed;
        this.randomState = this.params.seed;
        this.particles = [];
        
        if (this.params.regenerateForces) {
            this.regenerateForces();
        } else {
            this.generateDefaultForces();
        }
        
        if (this.params.regenerateColors) {
            this.regenerateColors();
        }
        
        this.generateParticles();
        this.updateUI();
    }
    
    regenerateForces() {
        this.forces = [];
        for (let i = 0; i < 100; i++) {
            this.forces.push(this.seededRandom() * 2 - 1);
        }
    }
    
    generateDefaultForces() {
        this.forces = [];
        const typeCount = Math.min(this.particleTypes, 10);
        
        for (let i = 0; i < 100; i++) {
            let force;
            const typeI = i % typeCount;
            const typeJ = Math.floor(i / typeCount) % typeCount;
            
            if (typeI === typeJ) {
                force = 0.3 + this.seededRandom() * 0.3;
            } else {
                force = (this.seededRandom() - 0.5) * 1.5;
            }
            
            this.forces[i] = force;
        }
    }
    
    regenerateColors() {
        this.colors = [];
        const hues = [0, 60, 120, 180, 240, 300, 20, 140, 260, 40];
        for (let i = 0; i < 10; i++) {
            const hue = hues[i];
            const rgb = this.hslToRgb(hue, 100, 50);
            this.colors.push(rgb);
        }
    }
    
    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        };
        return { r: f(0), g: f(8), b: f(4), a: 1 };
    }
    
    generateParticles() {
        this.particles = [];
        const count = this.params.particleCount;
        
        if (count === 2) {
            this.addParticle(
                this.regionSize.x / 2 - 30,
                this.regionSize.y / 2,
                Math.floor(this.seededRandom() * this.particleTypes),
                0, 0
            );
            this.addParticle(
                this.regionSize.x / 2 + 30,
                this.regionSize.y / 2,
                Math.floor(this.seededRandom() * this.particleTypes),
                0, 0
            );
            return;
        }
        
        for (let i = 0; i < count; i++) {
            const type = Math.floor(this.seededRandom() * this.particleTypes);
            const x = this.seededRandom() * this.regionSize.x;
            const y = this.seededRandom() * this.regionSize.y;
            this.addParticle(x, y, type, 0, 0);
        }
    }
    
    addParticle(x, y, type, vx = 0, vy = 0) {
        this.particles.push({ x, y, vx, vy, type });
    }
    
    seededRandom(seed = null) {
        if (seed !== null) {
            this.randomSeed = seed;
            this.randomState = seed;
        }
        this.randomState = (this.randomState * 9301 + 49297) % 233280;
        return this.randomState / 233280;
    }
    
    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                const uiPanel = document.getElementById('uiPanel');
                uiPanel.classList.toggle('hidden');
                this.showUI = !this.showUI;
            } else if (e.key === ' ') {
                e.preventDefault();
                this.isPaused = !this.isPaused;
            } else if (e.key === 'r' || e.key === 'R') {
                this.initSimulation();
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
            this.cumulativeMouseChange.x += this.mouseChange.x;
            this.cumulativeMouseChange.y += this.mouseChange.y;
            this.mouseChange.x = 0;
            this.mouseChange.y = 0;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const newX = e.clientX;
            const newY = e.clientY;
            this.mouseChange.x = newX - this.mouse.x;
            this.mouseChange.y = newY - this.mouse.y;
            this.mouse.x = newX;
            this.mouse.y = newY;
            
            if (this.mouse.down) {
                this.cumulativeMouseChange.x += this.mouseChange.x;
                this.cumulativeMouseChange.y += this.mouseChange.y;
            }
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.targetZoom += 0.25 * this.targetZoom;
            } else {
                this.targetZoom -= 0.25 * this.targetZoom;
            }
            this.targetZoom = Math.max(1.0, Math.min(10.0, this.targetZoom));
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    update(delta) {
        if (this.isPaused) return;
        
        const gridSize = this.params.interactionRadius * 2;
        const gridWidth = Math.ceil(this.regionSize.x / gridSize);
        const gridHeight = Math.ceil(this.regionSize.y / gridSize);
        const grid = Array(gridWidth * gridHeight).fill(null).map(() => []);
        
        for (const p of this.particles) {
            const gx = Math.floor(p.x / gridSize) % gridWidth;
            const gy = Math.floor(p.y / gridSize) % gridHeight;
            const idx = gy * gridWidth + gx;
            if (idx >= 0 && idx < grid.length) {
                grid[idx].push(p);
            }
        }
        
        const maxRadius = this.params.interactionRadius * this.params.interactionRadius;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            let totalForce = { x: 0, y: 0 };
            let localDensity = 0;
            
            const gx = Math.floor(p.x / gridSize) % gridWidth;
            const gy = Math.floor(p.y / gridSize) % gridHeight;
            const nearbyParticles = [];
            
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const ngx = (gx + dx + gridWidth) % gridWidth;
                    const ngy = (gy + dy + gridHeight) % gridHeight;
                    const nidx = ngy * gridWidth + ngx;
                    if (nidx >= 0 && nidx < grid.length) {
                        nearbyParticles.push(...grid[nidx]);
                    }
                }
            }
            
            for (const other of nearbyParticles) {
                if (p === other) continue;
                
                let dx = p.x - other.x;
                let dy = p.y - other.y;
                
                dx -= Math.round(dx / this.regionSize.x) * this.regionSize.x;
                dy -= Math.round(dy / this.regionSize.y) * this.regionSize.y;
                
                const distSq = dx * dx + dy * dy;
                if (distSq > maxRadius) continue;
                
                const dist = Math.sqrt(distSq);
                
                if (dist > 0) {
                    const forceIndex = p.type + other.type * this.particleTypes;
                    const attraction = this.forces[forceIndex] || 0;
                    
                    if (p.type === other.type) {
                        localDensity += 1 - dist / this.params.interactionRadius;
                    } else {
                        localDensity += (1 - dist / this.params.interactionRadius) * 0.5;
                    }
                }
            }
            
            for (const other of nearbyParticles) {
                if (p === other) continue;
                
                let dx = p.x - other.x;
                let dy = p.y - other.y;
                
                dx -= Math.round(dx / this.regionSize.x) * this.regionSize.x;
                dy -= Math.round(dy / this.regionSize.y) * this.regionSize.y;
                
                const distSq = dx * dx + dy * dy;
                if (distSq > maxRadius) continue;
                
                const dist = Math.sqrt(distSq);
                
                if (dist > 0) {
                    const forceIndex = p.type + other.type * this.particleTypes;
                    let attraction = this.forces[forceIndex] || 0;
                    
                    if (attraction > 0) {
                        const densityFactor = 1 - Math.max(0, Math.min(localDensity - this.params.densityLimit, 1.005));
                        attraction *= densityFactor;
                    }
                    
                    const nx = dx / dist;
                    const ny = dy / dist;
                    let force;
                    
                    if (dist < this.params.repulsionRadius) {
                        force = (dist / this.params.repulsionRadius - 1) * 2;
                    } else {
                        const width = this.params.interactionRadius - this.params.repulsionRadius;
                        const midpoint = (this.params.repulsionRadius + this.params.interactionRadius) * 0.5;
                        force = attraction * (1 - Math.abs(dist - midpoint) / (width * 0.5));
                    }
                    
                    totalForce.x += nx * force * -50;
                    totalForce.y += ny * force * -50;
                } else {
                    totalForce.x += this.seededRandom() - 0.5;
                    totalForce.y += this.seededRandom() - 0.5;
                }
            }
            
            const maxForce = 100;
            const forceMag = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y);
            if (forceMag > maxForce) {
                totalForce.x = (totalForce.x / forceMag) * maxForce;
                totalForce.y = (totalForce.y / forceMag) * maxForce;
            }
            
            p.vx += totalForce.x * delta;
            p.vy += totalForce.y * delta;
            p.vx *= this.params.dampening;
            p.vy *= this.params.dampening;
            
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            
            p.x = ((p.x % this.regionSize.x) + this.regionSize.x) % this.regionSize.x;
            p.y = ((p.y % this.regionSize.y) + this.regionSize.y) % this.regionSize.y;
        }
    }
    
    render() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.05;
        
        const scale = 0.5 * this.cameraZoom;
        this.cameraOrigin.x -= this.cumulativeMouseChange.x / this.cameraZoom;
        this.cameraOrigin.y -= this.cumulativeMouseChange.y / this.cameraZoom;
        this.cumulativeMouseChange.x *= 0.9;
        this.cumulativeMouseChange.y *= 0.9;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (const p of this.particles) {
            const dx = p.x - this.cameraOrigin.x;
            const dy = p.y - this.cameraOrigin.y;
            
            const wrappedDx = dx - Math.round(dx / this.regionSize.x) * this.regionSize.x;
            const wrappedDy = dy - Math.round(dy / this.regionSize.y) * this.regionSize.y;
            
            const screenX = centerX + wrappedDx * scale;
            const screenY = centerY + wrappedDy * scale;
            
            const radius = this.params.particleRadius * this.cameraZoom;
            
            if (screenX >= -radius && screenX <= this.canvas.width + radius &&
                screenY >= -radius && screenY <= this.canvas.height + radius) {
                
                const color = this.colors[p.type];
                const r = Math.floor(color.r * 255);
                const g = Math.floor(color.g * 255);
                const b = Math.floor(color.b * 255);
                
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.updateStats();
    }
    
    updateStats() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }
        
        document.getElementById('fpsCounter').textContent = `FPS: ${this.fps}`;
        document.getElementById('particleInfo').textContent = `Particles: ${this.particles.length}`;
    }
    
    loop() {
        const deltaTime = 0.016;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('load', () => {
    new ParticleSimulation();
});
