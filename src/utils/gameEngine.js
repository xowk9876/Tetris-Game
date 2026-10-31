import { CONFIG, TETROMINO_COLORS, TETROMINO_SHAPES, SRS_OFFSETS } from './gameConfig.js';

// 7-Bag 블록 생성 시스템
export class BlockBag {
    constructor(random = Math.random) {
        this.random = random;
        this.bag = [];
        this.refillBag();
    }

    refillBag() {
        // 7가지 블록을 섞어서 가방에 넣기
        const blocks = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
        const shuffled = [...blocks];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        this.bag.push(...shuffled);
    }

    getNext() {
        if (this.bag.length === 0) {
            this.refillBag();
        }
        return this.bag.shift();
    }

    peek(count = 1) {
        while (this.bag.length < count) {
            this.refillBag();
        }
        return this.bag.slice(0, count);
    }
}

// 게임 보드 클래스
export class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.version = 0; // 변경 추적 카운터 (JSON.stringify 대체)
    }

    createEmptyGrid() {
        return Array(this.height).fill(null).map(() => Array(this.width).fill(0));
    }

    reset() {
        this.grid = this.createEmptyGrid();
        this.version++;
    }

    isValidPosition(block, x, y) {
        const shape = block.getShape();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const boardRow = y + row;
                    const boardCol = x + col;

                    // 경계 체크
                    if (boardRow < 0 || boardRow >= this.height ||
                        boardCol < 0 || boardCol >= this.width) {
                        return false;
                    }

                    // 기존 블록과 충돌 체크
                    if (this.grid[boardRow][boardCol] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placeBlock(block, x, y) {
        const shape = block.getShape();
        const color = block.color;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const boardRow = y + row;
                    const boardCol = x + col;

                    if (boardRow >= 0 && boardRow < this.height &&
                        boardCol >= 0 && boardCol < this.width) {
                        this.grid[boardRow][boardCol] = color;
                    }
                }
            }
        }
        this.version++; // 보드 변경 카운터 증가
    }

    clearLines() {
        const linesToClear = [];

        // 완성된 줄 찾기 (위에서 아래로)
        for (let row = 0; row < this.height; row++) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }

        // Remove all completed rows together so indices cannot shift between removals.
        const survivors = this.grid.filter(row => row.some(cell => cell === 0));
        const emptyRows = Array.from({ length: linesToClear.length }, () => Array(this.width).fill(0));
        this.grid = [...emptyRows, ...survivors];

        if (linesToClear.length > 0) {
            this.version++; // 보드 변경 카운터 증가
        }

        return { count: linesToClear.length, rows: linesToClear };
    }

    getLinesToClear() {
        const linesToClear = [];

        // 완성된 줄 찾기 (위에서 아래로 - clearLines와 동일한 순서)
        for (let row = 0; row < this.height; row++) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }

        return { count: linesToClear.length, rows: linesToClear };
    }

    getGhostY(block, x, y) {
        let ghostY = y;
        while (this.isValidPosition(block, x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }
}

// 테트로미노 블록 클래스
export class Tetromino {
    constructor(type) {
        this.type = type;
        this.color = TETROMINO_COLORS[type].base; // 기본 색상 사용
        this.colorObj = TETROMINO_COLORS[type]; // 전체 색상 객체 저장
        this.rotation = 0;
        this.x = Math.floor(CONFIG.BOARD_WIDTH / 2) - 1;
        this.y = 0;
        this.shapes = TETROMINO_SHAPES[type];
    }

    getShape() {
        return this.shapes[this.rotation];
    }

    rotate() {
        const oldRotation = this.rotation;
        this.rotation = (this.rotation + 1) % 4;
        return oldRotation;
    }

    rotateBack() {
        this.rotation = (this.rotation + 3) % 4;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    resetPosition() {
        this.x = Math.floor(CONFIG.BOARD_WIDTH / 2) - 1;
        this.y = 0;
        this.rotation = 0;
    }

    copy() {
        const copy = new Tetromino(this.type);
        copy.x = this.x;
        copy.y = this.y;
        copy.rotation = this.rotation;
        return copy;
    }
}

// Pure game state: rendering, audio, storage and wall-clock timers live outside the engine.
export class GameState {
    constructor({ random = Math.random, onEvent = () => {} } = {}) {
        this.random = random;
        this.onEvent = onEvent;
        this.reset();
    }

    reset() {
        this.board = new Board(CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);
        this.blockBag = new BlockBag(this.random);
        this.currentBlock = this.nextBlock = this.holdBlock = null;
        this.canHold = true;
        this.score = this.lines = this.combo = this.maxCombo = 0;
        this.backToBack = this.isGameOver = this.isPaused = this.isLocking = false;
        this.clearTimer = this.fallTimer = 0;
        this.fallSpeed = CONFIG.BASE_FALL_SPEED;
        this.spawnNextBlock();
    }

    canAct() {
        return !!this.currentBlock && !this.isGameOver && !this.isPaused && !this.isLocking;
    }

    checkSpawn() {
        this.fallTimer = 0;
        if (!this.board.isValidPosition(this.currentBlock, this.currentBlock.x, this.currentBlock.y)) {
            this.isGameOver = true;
            this.currentBlock = null;
        }
    }

    spawnNextBlock() {
        this.currentBlock = this.nextBlock || new Tetromino(this.blockBag.getNext());
        this.currentBlock.resetPosition();
        this.nextBlock = new Tetromino(this.blockBag.getNext());
        this.canHold = true;
        this.checkSpawn();
    }

    lockBlock() {
        if (!this.canAct()) return false;
        this.board.placeBlock(this.currentBlock, this.currentBlock.x, this.currentBlock.y);
        this.currentBlock = null;
        this.onEvent({ type: 'lock' });
        const { count, rows } = this.board.getLinesToClear();
        if (count) {
            this.isLocking = true;
            this.clearTimer = 300;
            this.onEvent({ type: 'clearStart', rows, count, combo: this.combo + 1 });
        } else {
            this.combo = 0;
            this.spawnNextBlock();
        }
        return true;
    }

    handleLineClear(count) {
        this.lines += count;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        let score = CONFIG.SCORES[count] + 50 * (this.combo - 1);
        if (count === 4 && this.backToBack) score = Math.floor(score * 1.5);
        this.backToBack = count === 4;
        this.score += score;
    }

    hold() {
        if (!this.canAct() || !this.canHold) return false;
        const outgoing = new Tetromino(this.currentBlock.type);
        if (this.holdBlock) {
            this.currentBlock = this.holdBlock;
        } else {
            this.currentBlock = this.nextBlock;
            this.nextBlock = new Tetromino(this.blockBag.getNext());
        }
        this.holdBlock = outgoing;
        this.currentBlock.resetPosition();
        this.canHold = false;
        this.checkSpawn();
        return true;
    }

    moveBlock(dx, dy) {
        if (!this.canAct()) return false;
        const block = this.currentBlock;
        if (!this.board.isValidPosition(block, block.x + dx, block.y + dy)) return false;
        block.move(dx, dy);
        return true;
    }

    rotateBlock() {
        if (!this.canAct()) return false;
        const block = this.currentBlock;
        const oldRotation = block.rotate();
        const offsets = block.type === 'O' ? [[0, 0]] : SRS_OFFSETS[block.type === 'I' ? 'I' : 'default'][oldRotation];
        for (const [dx, dy] of offsets) {
            if (this.board.isValidPosition(block, block.x + dx, block.y + dy)) {
                block.move(dx, dy);
                return true;
            }
        }
        block.rotation = oldRotation;
        return false;
    }

    hardDrop() {
        if (!this.canAct()) return 0;
        const block = this.currentBlock;
        const landingY = this.board.getGhostY(block, block.x, block.y);
        const distance = landingY - block.y;
        block.y = landingY;
        this.lockBlock();
        return distance;
    }

    softDrop() {
        if (!this.canAct()) return false;
        if (this.moveBlock(0, 1)) return true;
        this.lockBlock();
        return false;
    }

    update(delta, isSoftDropping = false) {
        if (this.isGameOver || this.isPaused || !Number.isFinite(delta) || delta < 0) return;
        if (this.isLocking) {
            this.clearTimer -= delta;
            if (this.clearTimer <= 0) {
                const { count } = this.board.clearLines();
                if (count) this.handleLineClear(count);
                this.isLocking = false;
                this.clearTimer = 0;
                this.onEvent({ type: 'clearEnd', count });
                this.spawnNextBlock();
            }
            return;
        }
        if (!this.currentBlock || isSoftDropping) return;
        this.fallTimer += delta;
        if (this.fallTimer >= this.fallSpeed) {
            this.fallTimer = 0;
            this.softDrop();
        }
    }
}
