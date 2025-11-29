import { catmullRom } from '../src/index.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const infoSpan = document.getElementById('info') as HTMLSpanElement;

let points: number[][] = [];


function getCanvasCoords(e: MouseEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return [x, y];
}

function findPointNearClick(x: number, y: number, threshold: number = 15): number | null {
    for (let i = points.length - 1; i >= 0; i--) {
        const [px, py] = points[i];
        const dx = x - px;
        const dy = y - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= threshold) {
            return i;
        }
    }
    return null;
}

canvas.addEventListener('mousemove', (e) => {
    const [x, y] = getCanvasCoords(e);
    const pointIndex = findPointNearClick(x, y);
    canvas.style.cursor = pointIndex !== null ? 'pointer' : 'crosshair';
});

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    if (points.length === 0) {
        infoSpan.textContent = 'Click on the canvas to add control points';
        return;
    }
    
    if (points.length > 1) {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    if (points.length >= 2) {
        try {
            const result = catmullRom(points, {
                samples: 32,
                includeOriginal: false,
                parametrization: 'centripetal'
            });
            
            if (result.points.length > 0) {
                ctx.strokeStyle = '#0066cc';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(result.points[0][0], result.points[0][1]);
                for (let i = 1; i < result.points.length; i++) {
                    ctx.lineTo(result.points[i][0], result.points[i][1]);
                }
                ctx.stroke();
            }
        } catch (error) {
            console.error('Error generating curve:', error);
        }
    }
    
    points.forEach((point, index) => {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(point[0], point[1], 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(index + 1), point[0], point[1]);
    });
    
    infoSpan.textContent = `${points.length} control point${points.length !== 1 ? 's' : ''} - ${points.length >= 2 ? 'Curve generated' : 'Add more points to generate curve'}`;
}

function drawGrid() {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

canvas.addEventListener('click', (e) => {
    const [x, y] = getCanvasCoords(e);
    
    const pointIndex = findPointNearClick(x, y);
    if (pointIndex !== null) {
        points.splice(pointIndex, 1);
    } else {
        points.push([x, y]);
    }
    
    render();
});

clearBtn.addEventListener('click', () => {
    points = [];
    render();
});

render();

