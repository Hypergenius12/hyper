class CableManager {
    constructor() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.position = 'fixed';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100vw';
        this.svg.style.height = '100vh';
        this.svg.style.pointerEvents = 'none';
        this.svg.style.zIndex = '500'; // above panels, below tutorial
        document.body.appendChild(this.svg);
        
        window.addEventListener('resize', () => this.drawCables());
        // Periodically redraw in case scrolling happens
        setInterval(() => this.drawCables(), 100);
    }
    
    drawCables() {
        this.svg.innerHTML = '';
        if (!window.audioEngine || !window.audioEngine.tracks) return;
        
        // Find the currently selected track from UI (we only draw for active editor)
        const editor = document.getElementById('editor-container');
        const emptyState = document.getElementById('editor-empty-state');
        if (!editor || editor.innerHTML === '' || (emptyState && emptyState.style.display !== 'none')) return;
        
        const lfoSelect = document.getElementById('edit-lfoTarget');
        if (!lfoSelect || lfoSelect.value === 'none') return;
        
        const sourceEl = lfoSelect;
        let targetEl = null;
        if (lfoSelect.value === 'pitch') targetEl = document.getElementById('edit-freq');
        if (lfoSelect.value === 'filter') targetEl = document.getElementById('edit-filterFreq');
        
        if (!sourceEl || !targetEl) return;
        
        const sRect = sourceEl.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        
        const x1 = sRect.right;
        const y1 = sRect.top + sRect.height / 2;
        const x2 = tRect.left;
        const y2 = tRect.top + tRect.height / 2;
        
        // Draw glowing cable
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cx1 = x1 + 100;
        const cy1 = y1;
        const cx2 = x2 - 100;
        const cy2 = y2;
        
        path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
        path.setAttribute('fill', 'transparent');
        path.setAttribute('stroke', 'var(--accent)');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('stroke-linecap', 'round');
        path.style.filter = 'drop-shadow(0 0 5px var(--accent))';
        path.style.opacity = '0.7';
        
        // Draw plugs
        const plug1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        plug1.setAttribute('cx', x1);
        plug1.setAttribute('cy', y1);
        plug1.setAttribute('r', '6');
        plug1.setAttribute('fill', '#fff');
        plug1.setAttribute('stroke', 'var(--accent)');
        plug1.setAttribute('stroke-width', '2');
        
        const plug2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        plug2.setAttribute('cx', x2);
        plug2.setAttribute('cy', y2);
        plug2.setAttribute('r', '6');
        plug2.setAttribute('fill', '#fff');
        plug2.setAttribute('stroke', 'var(--accent)');
        plug2.setAttribute('stroke-width', '2');
        
        this.svg.appendChild(path);
        this.svg.appendChild(plug1);
        this.svg.appendChild(plug2);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cableManager = new CableManager();
});
