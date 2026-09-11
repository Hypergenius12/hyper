/**
 * InputManager decouples browser keyboard events from game actions.
 * This architecture allows human keystrokes, macros, automated replays,
 * and AI bot scripts to dispatch actions through the same unified pipeline.
 */
export class InputManager {
  constructor() {
    this.listeners = new Set();
    this.keyBindings = {
      // Directions
      'ArrowUp': 'UP',
      'KeyW': 'UP',
      'w': 'UP',
      'W': 'UP',

      'ArrowDown': 'DOWN',
      'KeyS': 'DOWN',
      's': 'DOWN',
      'S': 'DOWN',

      'ArrowLeft': 'LEFT',
      'KeyA': 'LEFT',
      'a': 'LEFT',
      'A': 'LEFT',

      'ArrowRight': 'RIGHT',
      'KeyD': 'RIGHT',
      'd': 'RIGHT',
      'D': 'RIGHT',

      // Actions
      'Space': 'PAUSE',
      ' ': 'PAUSE',
      'KeyR': 'RESTART',
      'r': 'RESTART',
      'R': 'RESTART',
      'Period': 'STEP',
      '.': 'STEP'
    };

    this.isRecording = false;
    this.recordedActions = [];
    this.customInterceptor = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.init();
  }

  init() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.listeners.clear();
  }

  /**
   * Register a callback for action dispatches
   */
  onAction(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Set a custom interceptor (e.g. for AI bots or macro injection)
   * If interceptor returns false, the default action is blocked.
   */
  setInterceptor(interceptorFn) {
    this.customInterceptor = interceptorFn;
  }

  /**
   * Dispatch an action programmatically or from keyboard
   */
  dispatch(action, source = 'human') {
    if (this.customInterceptor) {
      const allowed = this.customInterceptor(action, source);
      if (allowed === false) return;
    }

    if (this.isRecording) {
      this.recordedActions.push({
        time: performance.now(),
        action,
        source
      });
    }

    for (const listener of this.listeners) {
      listener(action, source);
    }
  }

  handleKeyDown(event) {
    // Avoid triggering when user is typing in an input or textarea
    if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
      return;
    }

    const action = this.keyBindings[event.code] || this.keyBindings[event.key];
    if (action) {
      // Prevent browser scroll for arrow keys and spacebar
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(event.key) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      this.dispatch(action, 'keyboard');
    }
  }

  // Macro Recording Foundation
  startRecording() {
    this.isRecording = true;
    this.recordedActions = [];
  }

  stopRecording() {
    this.isRecording = false;
    return [...this.recordedActions];
  }

  getRecording() {
    return [...this.recordedActions];
  }
}
