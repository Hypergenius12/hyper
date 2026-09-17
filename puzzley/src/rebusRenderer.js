// Typographic Rebus Visual Layout Renderer
// Generates clean, crisp, editorial-style typographic HTML for rebus wordplay puzzles

export function renderRebusVisual(visual) {
  if (!visual) return '<div class="rebus-fallback">???</div>';

  switch (visual.type) {
    case 'fraction':
      return `
        <div class="rebus-fraction">
          <div class="rebus-top">${visual.top}</div>
          <div class="rebus-line"></div>
          <div class="rebus-bottom">${visual.bottom}</div>
        </div>
      `;

    case 'between_lines':
      return `
        <div class="rebus-between-lines">
          <div class="rebus-rule-line"></div>
          <div class="rebus-mid-word">${visual.text}</div>
          <div class="rebus-rule-line"></div>
        </div>
      `;

    case 'split_word':
      return `
        <div class="rebus-split">
          <span class="rebus-split-half left">${visual.left}</span>
          <span class="rebus-split-gap">✂</span>
          <span class="rebus-split-half right">${visual.right}</span>
        </div>
      `;

    case 'vertical_down':
      return `
        <div class="rebus-vertical">
          ${visual.word.split('').map(char => `<span class="rebus-v-char">${char}</span>`).join('')}
        </div>
      `;

    case 'column':
      return `
        <div class="rebus-column">
          ${visual.items.map(item => `<div class="rebus-col-item">${item}</div>`).join('')}
        </div>
      `;

    case 'row':
      return `
        <div class="rebus-row">
          ${visual.items.map(item => `<span class="rebus-row-item">${item}</span>`).join('')}
        </div>
      `;

    case 'boxed':
      return `
        <div class="rebus-boxed-wrap">
          <div class="rebus-box-border">${visual.word}</div>
        </div>
      `;

    case 'high_word':
      return `
        <div class="rebus-high-wrap">
          <div class="rebus-high-text">${visual.word}</div>
          <div class="rebus-high-floor"></div>
        </div>
      `;

    case 'broken':
      return `
        <div class="rebus-broken-wrap">
          <span class="broken-part part-1">${visual.part1}</span>
          <span class="broken-part part-2">${visual.part2}</span>
        </div>
      `;

    case 'backward':
      return `
        <div class="rebus-backward">
          ${visual.word.split('').reverse().join('')}
        </div>
      `;

    case 'growing':
      return `
        <div class="rebus-growing">
          ${visual.word.split('').map((c, i) => `<span style="font-size: ${1.8 + i * 0.9}rem">${c}</span>`).join('')}
        </div>
      `;

    case 'in_word':
      return `
        <div class="rebus-in-wrap">
          <span class="outer-text">${visual.outer.slice(0, 3)}</span>
          <span class="inner-highlight">${visual.inner}</span>
          <span class="outer-text">${visual.outer.slice(3)}</span>
        </div>
      `;

    case 'between_eyes':
      return `
        <div class="rebus-between-eyes">
          <span class="eye-char">${visual.left}</span>
          <span class="eye-mid">${visual.middle}</span>
          <span class="eye-char">${visual.right}</span>
        </div>
      `;

    case 'mice':
      return `
        <div class="rebus-mice-block">
          <div class="rebus-mice-text">${visual.text}</div>
          <div class="rebus-sub-caption">Notice anything missing? 👀</div>
        </div>
      `;

    case 'grid':
      return `
        <div class="rebus-grid-block">
          ${visual.items.map(it => `<div class="rebus-grid-line">${it}</div>`).join('')}
        </div>
      `;

    case 'strikethrough':
      return `
        <div class="rebus-strikethrough">
          <span class="strike-text">${visual.text}</span>
        </div>
      `;

    case 'mirrored':
      return `
        <div class="rebus-mirrored">
          <div class="mirror-top">${visual.text}</div>
          <div class="mirror-bottom">${visual.text}</div>
        </div>
      `;

    case 'scattered':
      return `
        <div class="rebus-scattered">
          ${visual.word.split('').map((char, i) => {
            const rot = (Math.random() - 0.5) * 60;
            const top = (Math.random() - 0.5) * 20;
            const left = (Math.random() - 0.5) * 20;
            return `<span class="scatter-char" style="transform: rotate(${rot}deg) translate(${left}px, ${top}px); display: inline-block; padding: 0.2rem;">${char}</span>`;
          }).join('')}
        </div>
      `;

    case 'wavy':
      return `
        <div class="rebus-wavy">
          ${visual.text.split('').map((char, i) => {
            const upDown = (i % 2 === 0) ? '-10px' : '10px';
            return `<span class="wavy-char" style="transform: translateY(${upDown}); display: inline-block;">${char}</span>`;
          }).join('')}
        </div>
      `;

    case 'square_grid':
      return `
        <div class="rebus-square-grid">
          <div class="square-side square-top">${visual.word}</div>
          <div class="square-side square-right">${visual.word}</div>
          <div class="square-side square-bottom">${visual.word}</div>
          <div class="square-side square-left">${visual.word}</div>
        </div>
      `;

    case 'staircase':
      return `
        <div class="rebus-staircase">
          ${visual.word.split('').map((char, i) => `<div style="padding-left: ${i * 1.5}rem">${char}</div>`).join('')}
        </div>
      `;

    case 'color_word':
      return `
        <div class="rebus-color-word" style="color: ${visual.color}; font-weight: 900; font-size: 3rem; text-shadow: 2px 2px 0px rgba(0,0,0,0.1);">
          ${visual.word}
        </div>
      `;

    case 'edge_wrap':
      return `
        <div class="rebus-edge-wrap">
          <div class="edge-top">${visual.top}</div>
          <div class="edge-mid">
            <span class="edge-left">${visual.left}</span>
            <span class="edge-right">${visual.right}</span>
          </div>
          <div class="edge-bottom">${visual.bottom}</div>
        </div>
      `;

    case 'cross':
      return `
        <div class="rebus-cross">
          <div class="cross-v">${visual.word.split('').join('<br>')}</div>
          <div class="cross-h">${visual.word}</div>
        </div>
      `;
      
    case 'corner':
      return `
        <div class="rebus-corner-wrap">
          <div class="corner-word">${visual.word}</div>
        </div>
      `;
      
    case 'up_in_air':
      return `
        <div class="rebus-up-in-air">
          <span class="air-word">${visual.surround}</span>
          <span class="up-word">${visual.word}</span>
        </div>
      `;
      
    case 'check_mate':
      return `
        <div class="rebus-check-mate">
          <span class="check-icon">✓</span>
          <span class="check-text">${visual.text ? visual.text.replace('✓', '').trim() : 'MATE'}</span>
        </div>
      `;
      
    case 'big_text':
      return `
        <div class="rebus-big-text">
          ${visual.word}
        </div>
      `;
      
    case 'peas_in_pod':
      return `
        <div class="rebus-peas-pod">
          ${visual.text}
        </div>
      `;

    case 'plain_styled':
    default:
      return `
        <div class="rebus-plain-card">
          <span class="rebus-plain-text">${visual.text || visual.word || '???'}</span>
        </div>
      `;
  }
}
