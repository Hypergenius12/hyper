class Pyraminx {
    constructor(container) {
        this.container = container;
        this.faceNames = ['U', 'L', 'R', 'B'];
        this.faceColors = ['#ef476f', '#118ab2', '#06d6a0', '#ffb703'];
        this.reset();
    }

    reset() {
        this.stickers = this.faceNames.map((_, face) => Array(9).fill(face));
        this.render();
    }

    isSolved() {
        return this.stickers.every((face, faceIndex) => face.every(color => color === faceIndex));
    }

    applyMove(move) {
        const face = this.faceNames.indexOf(move[0]);
        if (face === -1) return;

        const turns = move.endsWith("'") ? 2 : 1;
        for (let i = 0; i < turns; i++) this.turn(face);
        this.render();
    }

    turn(face) {
        const rotate = (stickers, cycles) => {
            const next = [...stickers];
            for (const [a, b, c] of cycles) {
                next[a] = stickers[c];
                next[b] = stickers[a];
                next[c] = stickers[b];
            }
            return next;
        };

        this.stickers[face] = rotate(this.stickers[face], [
            [0, 2, 8], [1, 5, 7], [3, 6, 4]
        ]);

        const adjacent = this.faceNames.map((_, index) => index).filter(index => index !== face);
        const strips = adjacent.map(index => this.stickers[index].slice(0, 3));
        adjacent.forEach((index, stripIndex) => {
            this.stickers[index].splice(0, 3, ...strips[(stripIndex + 2) % 3]);
        });
    }

    generateScramble(length = 11) {
        const moves = [];
        let lastFace = '';
        for (let i = 0; i < length; i++) {
            const available = this.faceNames.filter(face => face !== lastFace);
            const face = available[Math.floor(Math.random() * available.length)];
            moves.push(face + (Math.random() < 0.5 ? '' : "'"));
            lastFace = face;
        }
        return moves;
    }

    render() {
        if (!this.container) return;

        const faceOrigins = [
            [180, 28], [48, 246], [312, 246], [180, 246]
        ];
        const rotations = [0, 0, 0, 180];
        const stickerShapes = [
            '60,0 42,34 78,34',
            '42,37 24,71 60,71', '78,37 60,71 96,71',
            '24,74 6,108 42,108', '60,74 42,108 78,108', '96,74 78,108 114,108',
            '6,111 0,122 36,122', '42,111 36,122 84,122', '78,111 84,122 120,122'
        ];

        const faces = this.stickers.map((stickers, faceIndex) => {
            const [x, y] = faceOrigins[faceIndex];
            const rotation = rotations[faceIndex];
            const tiles = stickers.map((color, stickerIndex) =>
                `<polygon points="${stickerShapes[stickerIndex]}" fill="${this.faceColors[color]}" />`
            ).join('');
            return `<g transform="translate(${x} ${y}) rotate(${rotation} 60 61)" class="pyraminx-face">${tiles}</g>`;
        }).join('');

        this.container.innerHTML = `
            <svg viewBox="0 0 480 390" role="img" aria-label="Pyraminx puzzle">
                ${faces}
            </svg>
        `;
    }
}
