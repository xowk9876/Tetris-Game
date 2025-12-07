// ============================================
// 테트리스 게임 - 기획서 기반 구현
// Phaser 3 + 모던 UI/UX
// ============================================

// 게임 상수 설정
const CONFIG = {
    BOARD_WIDTH: 10,   // 보드 너비 (열)
    BOARD_HEIGHT: 20,  // 보드 높이 (행)
    CELL_SIZE: 35,     // 셀 크기 (픽셀) - 더 크게
    BOARD_OFFSET_X: 225, // 보드 시작 X 위치 (중앙 배치: (800 - 350) / 2)
    BOARD_OFFSET_Y: 120, // 보드 시작 Y 위치 (HUD 공간 확보)
    
    // 점수 시스템 (현실적인 밸런스)
    SCORES: {
        1: 40,    // 1줄 제거
        2: 100,   // 2줄 제거
        3: 300,   // 3줄 제거
        4: 1200   // 4줄 제거 (테트리스) - 더 큰 보너스
    },
    
    // 낙하 속도 (고정)
    BASE_FALL_SPEED: 800  // 기본 낙하 속도 (ms)
};

// 테트로미노 색상
const TETROMINO_COLORS = {
    I: 0x00f5ff,  // 네온 시안
    O: 0xffd700,  // 골드
    T: 0xff6b9d,  // 핑크
    L: 0xff8c00,  // 오렌지
    J: 0x4169e1,  // 로얄 블루
    S: 0x32cd32,  // 라임 그린
    Z: 0xff1493   // 딥 핑크
};

// 테트로미노 모양 정의 (4가지 회전 상태)
const TETROMINO_SHAPES = {
    I: [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    O: [
        [[1,1], [1,1]],
        [[1,1], [1,1]],
        [[1,1], [1,1]],
        [[1,1], [1,1]]
    ],
    T: [
        [[0,1,0], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,1], [0,1,0]],
        [[0,1,0], [1,1,0], [0,1,0]]
    ],
    L: [
        [[0,0,1], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,0], [0,1,1]],
        [[0,0,0], [1,1,1], [1,0,0]],
        [[1,1,0], [0,1,0], [0,1,0]]
    ],
    J: [
        [[1,0,0], [1,1,1], [0,0,0]],
        [[0,1,1], [0,1,0], [0,1,0]],
        [[0,0,0], [1,1,1], [0,0,1]],
        [[0,1,0], [0,1,0], [1,1,0]]
    ],
    S: [
        [[0,1,1], [1,1,0], [0,0,0]],
        [[0,1,0], [0,1,1], [0,0,1]],
        [[0,0,0], [0,1,1], [1,1,0]],
        [[1,0,0], [1,1,0], [0,1,0]]
    ],
    Z: [
        [[1,1,0], [0,1,1], [0,0,0]],
        [[0,0,1], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,0], [0,1,1]],
        [[0,1,0], [1,1,0], [1,0,0]]
    ]
};

// SRS 회전 오프셋 (간단화 버전)
const SRS_OFFSETS = {
    I: {
        0: [[0,0], [-1,0], [1,0], [0,0], [-1,0]],
        1: [[-1,0], [0,0], [0,0], [0,1], [0,-2]],
        2: [[-1,1], [1,1], [-2,1], [1,0], [-2,0]],
        3: [[0,1], [0,1], [0,1], [0,-1], [0,2]]
    },
    default: {
        0: [[0,0], [0,0], [0,0], [0,0], [0,0]],
        1: [[0,0], [1,0], [1,-1], [0,2], [1,2]],
        2: [[0,0], [0,0], [0,0], [0,0], [0,0]],
        3: [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]]
    }
};

// 7-Bag 블록 생성 시스템
class BlockBag {
    constructor() {
        this.bag = [];
        this.refillBag();
    }
    
    refillBag() {
        // 7가지 블록을 섞어서 가방에 넣기
        const blocks = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
        const shuffled = [...blocks].sort(() => Math.random() - 0.5);
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
class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }
    
    createEmptyGrid() {
        return Array(this.height).fill(null).map(() => Array(this.width).fill(0));
    }

    reset() {
        this.grid = this.createEmptyGrid();
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
    }
    
    clearLines() {
        const linesToClear = [];
        
        // 완성된 줄 찾기
        for (let row = this.height - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        // 줄 제거 및 위 블록 내리기
        linesToClear.forEach(lineIndex => {
            this.grid.splice(lineIndex, 1);
            this.grid.unshift(Array(this.width).fill(0));
        });
        
        return linesToClear.length;
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
class Tetromino {
    constructor(type, bag) {
        this.type = type;
        this.color = TETROMINO_COLORS[type];
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
        const copy = new Tetromino(this.type, null);
        copy.x = this.x;
        copy.y = this.y;
        copy.rotation = this.rotation;
        return copy;
    }
}

// 게임 상태 관리 클래스
class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.board = new Board(CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);
        this.blockBag = new BlockBag();
        this.currentBlock = null;
        this.nextBlock = null;
        this.holdBlock = null;
        this.canHold = true;
        
        this.score = 0;
        this.lines = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.backToBack = false;
        
        this.isGameOver = false;
        this.isPaused = false;
        
        this.fallTimer = 0;
        // 저장된 속도 불러오기 (없으면 기본값)
        const savedSpeed = parseInt(localStorage.getItem('tetrisFallSpeed') || CONFIG.BASE_FALL_SPEED.toString());
        this.fallSpeed = savedSpeed;
        
        this.spawnNextBlock();
    }
    
    spawnNextBlock() {
        if (this.nextBlock) {
            this.currentBlock = this.nextBlock;
        } else {
            const type = this.blockBag.getNext();
            this.currentBlock = new Tetromino(type, this.blockBag);
        }
        
        this.currentBlock.resetPosition();
        
        // 다음 블록 생성
        const nextType = this.blockBag.getNext();
        this.nextBlock = new Tetromino(nextType, this.blockBag);
        
        // 게임 오버 체크
        if (!this.board.isValidPosition(this.currentBlock, this.currentBlock.x, this.currentBlock.y)) {
            this.isGameOver = true;
        }
        
        this.canHold = true;
    }
    
    lockBlock() {
        this.board.placeBlock(this.currentBlock, this.currentBlock.x, this.currentBlock.y);
        
        // 블록 고정 사운드
        if (this.scene) {
            this.scene.playSound('drop', 0.4);
        }
        
        // 줄 제거 체크
        const linesCleared = this.board.clearLines();
        if (linesCleared > 0) {
            this.handleLineClear(linesCleared);
        } else {
            this.combo = 0;
        }
        
        this.spawnNextBlock();
    }
    
    handleLineClear(linesCleared) {
        this.lines += linesCleared;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // 점수 계산 (레벨 없이)
        const baseScore = CONFIG.SCORES[linesCleared] || 0;
        let score = baseScore;
        
        // 줄 제거 사운드 재생
        if (this.scene) {
            if (linesCleared === 4) {
                // 테트리스 사운드 (4줄)
                this.scene.playSound('tetris', 0.7);
            } else {
                // 일반 줄 제거 사운드 (line_clear가 없으면 tetris 사용)
                if (!this.scene.playSound('line_clear', 0.6)) {
                    this.scene.playSound('tetris', 0.5);
                }
            }
        }
        
        // 콤보 보너스 (누적)
        if (this.combo > 1) {
            // 콤보당 50점 보너스 (누적)
            const comboBonus = 50 * (this.combo - 1);
            score += comboBonus;
            // 콤보 사운드 (콤보 2 이상일 때)
            if (this.scene && this.combo > 1) {
                this.scene.playSound('combo', 0.5);
            }
        }
        
        // 백투백 테트리스 보너스 (연속 테트리스 시)
        if (linesCleared === 4) {
            if (this.backToBack) {
                score = Math.floor(score * 1.5);
            }
            this.backToBack = true;
        } else {
            this.backToBack = false;
        }
        
        this.score += score;
    }
    
    hold() {
        if (!this.canHold) return false;
        
        // 홀드한 블록이 있으면 교환
        if (this.holdBlock) {
            const temp = this.holdBlock;
            this.holdBlock = new Tetromino(this.currentBlock.type, null);
            this.currentBlock = new Tetromino(temp.type, null);
            this.currentBlock.resetPosition();
        } else {
            // 홀드한 블록이 없으면 현재 블록을 홀드하고 다음 블록 사용
            this.holdBlock = new Tetromino(this.currentBlock.type, null);
            this.currentBlock = this.nextBlock;
            const nextType = this.blockBag.getNext();
            this.nextBlock = new Tetromino(nextType, this.blockBag);
            this.currentBlock.resetPosition();
        }
        
        // 홀드 후 같은 블록을 연속으로 홀드하는 것 방지
        this.canHold = false;
        return true;
    }
    
    moveBlock(dx, dy) {
        if (!this.currentBlock) return false;
        
        const testBlock = this.currentBlock.copy();
        testBlock.move(dx, dy);
        
        if (this.board.isValidPosition(testBlock, testBlock.x, testBlock.y)) {
            this.currentBlock.move(dx, dy);
            return true;
        }
        return false;
    }
    
    rotateBlock() {
        if (!this.currentBlock) return false;
        
        const oldRotation = this.currentBlock.rotate();
        
        if (this.board.isValidPosition(this.currentBlock, this.currentBlock.x, this.currentBlock.y)) {
            return true;
        }
        
        // SRS 벽 킥 시도
        const offsets = this.currentBlock.type === 'I' 
            ? SRS_OFFSETS.I[oldRotation] 
            : SRS_OFFSETS.default[oldRotation];
        
        for (let i = 0; i < offsets.length; i++) {
            const [dx, dy] = offsets[i];
            const testBlock = this.currentBlock.copy();
            testBlock.move(dx, dy);
            
            if (this.board.isValidPosition(testBlock, testBlock.x, testBlock.y)) {
                this.currentBlock.move(dx, dy);
                return true;
            }
        }
        
        // 회전 실패 시 되돌리기
        this.currentBlock.rotateBack();
        return false;
    }
    
    hardDrop() {
        if (!this.currentBlock) return 0;
        
        let dropDistance = 0;
        while (this.moveBlock(0, 1)) {
            dropDistance++;
        }
        
        // 하드 드롭 점수 제거 (줄 제거 시에만 점수 획득)
        // if (dropDistance > 0) {
        //     this.score += Math.min(dropDistance, 10) * 1;
        // }
        
        this.lockBlock();
        return dropDistance;
    }
    
    softDrop(addScore = false) {
        if (this.moveBlock(0, 1)) {
            // 소프트 드롭 점수 제거 (줄 제거 시에만 점수 획득)
            // if (addScore) {
            //     this.score += 1;
            // }
            return true;
        } else {
            this.lockBlock();
            return false;
        }
    }
    
    // 자동 낙하 (점수 없음)
    autoDrop() {
        if (this.moveBlock(0, 1)) {
                        return true;
        } else {
            this.lockBlock();
            return false;
        }
    }
    
    update(delta, isSoftDropping = false) {
        if (this.isGameOver || this.isPaused || !this.currentBlock) return;
        
        // 소프트 드롭 중일 때는 자동 낙하 타이머를 리셋하지 않음 (더 빠른 낙하)
        if (!isSoftDropping) {
            this.fallTimer += delta;
            
            if (this.fallTimer >= this.fallSpeed) {
                this.fallTimer = 0;
                if (!this.autoDrop()) {
                    // 블록이 고정됨
                }
            }
        }
    }
}

// 렌더러 클래스
class TetrisRenderer {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.cellGraphics = [];
        this.ghostGraphics = null;
        this.currentBlockGraphics = null;
        this.nextBlockGraphics = null;
        this.holdBlockGraphics = null;
    }
    
    drawBoard() {
        // 기존 그래픽 제거
        this.cellGraphics.forEach(g => g.destroy());
        this.cellGraphics = [];
        
        const board = this.gameState.board;
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        
        // 보드 배경 (고급 디자인)
        const bg = this.scene.add.graphics();
        const boardWidth = CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE;
        const boardHeight = CONFIG.BOARD_HEIGHT * CONFIG.CELL_SIZE;
        const padding = 8;
        
        // 외부 그림자
        bg.fillStyle(0x000000, 0.5);
        bg.fillRoundedRect(
            startX - padding + 2,
            startY - padding + 2,
            boardWidth + padding * 2,
            boardHeight + padding * 2,
            12
        );
        
        // 메인 배경
        bg.fillGradientStyle(0x0f0f23, 0x1a1a2e, 0x1a1a2e, 0x0f0f23, 1);
        bg.fillRoundedRect(
            startX - padding,
            startY - padding,
            boardWidth + padding * 2,
            boardHeight + padding * 2,
            12
        );
        
        // 네온 테두리 (글로우 효과)
        bg.lineStyle(3, 0x00f5ff, 0.8);
        bg.strokeRoundedRect(
            startX - padding,
            startY - padding,
            boardWidth + padding * 2,
            boardHeight + padding * 2,
            12
        );
        
        // 내부 테두리
        bg.lineStyle(1, 0x00f5ff, 0.3);
        bg.strokeRoundedRect(
            startX - padding + 2,
            startY - padding + 2,
            boardWidth + padding * 2 - 4,
            boardHeight + padding * 2 - 4,
            10
        );
        
        this.cellGraphics.push(bg);
        
        // 그리드 라인 (더 미묘하게)
        const grid = this.scene.add.graphics();
        grid.lineStyle(1, 0x312e81, 0.15);
        
        // 세로선
        for (let col = 0; col <= CONFIG.BOARD_WIDTH; col++) {
            const x = startX + col * CONFIG.CELL_SIZE;
            grid.moveTo(x, startY);
            grid.lineTo(x, startY + CONFIG.BOARD_HEIGHT * CONFIG.CELL_SIZE);
        }
        
        // 가로선
        for (let row = 0; row <= CONFIG.BOARD_HEIGHT; row++) {
            const y = startY + row * CONFIG.CELL_SIZE;
            grid.moveTo(startX, y);
            grid.lineTo(startX + CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE, y);
        }
        
        grid.strokePath();
        this.cellGraphics.push(grid);
        
        // 배치된 블록 그리기 (고품질)
        for (let row = 0; row < board.height; row++) {
            for (let col = 0; col < board.width; col++) {
                if (board.grid[row][col] !== 0) {
                    const cell = this.scene.add.graphics();
                const x = startX + col * CONFIG.CELL_SIZE;
                const y = startY + row * CONFIG.CELL_SIZE;
                    const cellSize = CONFIG.CELL_SIZE - 2;
                    
                    // 그림자 효과
                    cell.fillStyle(0x000000, 0.3);
                    cell.fillRect(x + 3, y + 3, cellSize, cellSize);
                    
                    // 메인 블록
                    cell.fillStyle(board.grid[row][col], 1);
                    cell.fillRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 하이라이트 (상단)
                    cell.fillGradientStyle(board.grid[row][col], board.grid[row][col], board.grid[row][col], board.grid[row][col], 0.6);
                    cell.fillRect(x + 1, y + 1, cellSize, cellSize / 3);
                    
                    // 테두리 (글로우 효과)
                    cell.lineStyle(2, 0xffffff, 0.6);
                    cell.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 내부 테두리
                    cell.lineStyle(1, 0xffffff, 0.2);
                    cell.strokeRoundedRect(x + 2, y + 2, cellSize - 2, cellSize - 2, 3);
                
                this.cellGraphics.push(cell);
                }
            }
        }
    }
    
    drawGhostBlock() {
        if (this.ghostGraphics) {
            this.ghostGraphics.destroy();
        }
        
        if (!this.gameState.currentBlock) return;
        
        const block = this.gameState.currentBlock;
        const ghostY = this.gameState.board.getGhostY(block, block.x, block.y);
        
        if (ghostY === block.y) return;
        
        this.ghostGraphics = this.scene.add.graphics();
        
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const x = startX + (block.x + col) * CONFIG.CELL_SIZE;
                    const y = startY + (ghostY + row) * CONFIG.CELL_SIZE;
                    const cellSize = CONFIG.CELL_SIZE - 2;
                    
                    // 고스트 블록 (더 명확하게)
                    this.ghostGraphics.lineStyle(2, block.color, 0.4);
                    this.ghostGraphics.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 내부 점선 효과
                    this.ghostGraphics.lineStyle(1, block.color, 0.2);
                    this.ghostGraphics.strokeRoundedRect(x + 2, y + 2, cellSize - 2, cellSize - 2, 3);
                }
            }
        }
    }
    
    drawCurrentBlock() {
        if (!this.gameState.currentBlock) return;
        
        const block = this.gameState.currentBlock;
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        
        // 기존 블록 그래픽 제거
        if (this.currentBlockGraphics) {
            this.currentBlockGraphics.forEach(g => g.destroy());
        }
        this.currentBlockGraphics = [];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const cell = this.scene.add.graphics();
                    const x = startX + (block.x + col) * CONFIG.CELL_SIZE;
                    const y = startY + (block.y + row) * CONFIG.CELL_SIZE;
                    const cellSize = CONFIG.CELL_SIZE - 2;
                    
                    // 그림자
                    cell.fillStyle(0x000000, 0.4);
                    cell.fillRoundedRect(x + 2, y + 2, cellSize, cellSize, 4);
                    
                    // 메인 블록
                    cell.fillStyle(block.color, 1);
                    cell.fillRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 하이라이트
                    cell.fillGradientStyle(block.color, block.color, block.color, block.color, 0.5);
                    cell.fillRect(x + 1, y + 1, cellSize, cellSize / 3);
                    
                    // 글로우 테두리
                    cell.lineStyle(3, 0xffffff, 0.8);
                    cell.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 내부 테두리
                    cell.lineStyle(1, 0xffffff, 0.3);
                    cell.strokeRoundedRect(x + 2, y + 2, cellSize - 2, cellSize - 2, 3);
                    
                    this.currentBlockGraphics.push(cell);
                }
            }
        }
    }
    
    drawNextBlock() {
        if (this.nextBlockGraphics) {
            this.nextBlockGraphics.forEach(g => g.destroy());
        }
        this.nextBlockGraphics = [];
        
        if (!this.gameState.nextBlock) return;
        
        const block = this.gameState.nextBlock;
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X + CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE + 50;
        const startY = 150;
        const cellSize = 24;
        
        const panelWidth = 110;
        const panelHeight = 110;
        const panelStartX = startX - 10;
        const panelStartY = startY - 10;
        const panelCenterX = panelStartX + panelWidth / 2;
        const panelCenterY = panelStartY + panelHeight / 2;
        
        // 배경 (고급 디자인)
        const bg = this.scene.add.graphics();
        bg.fillGradientStyle(0x0f0f23, 0x1a1a2e, 0x1a1a2e, 0x0f0f23, 0.9);
        bg.fillRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 12);
        bg.lineStyle(2, 0x00f5ff, 0.7);
        bg.strokeRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 12);
        this.nextBlockGraphics.push(bg);
        
        // "다음" 텍스트 (중앙 정렬)
        const text = this.scene.add.text(panelCenterX, panelStartY + 18, '다음', {
            fontSize: '16px',
            color: '#00f5ff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.nextBlockGraphics.push(text);
        
        // 실제 블록 바운딩 박스 계산
        let minCol = shape[0].length, maxCol = -1;
        let minRow = shape.length, maxRow = -1;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                }
            }
        }
        
        // 실제 블록 크기
        const actualBlockWidth = (maxCol - minCol + 1) * cellSize;
        const actualBlockHeight = (maxRow - minRow + 1) * cellSize;
        
        // 블록 중심점 계산 (텍스트 아래 공간의 중앙)
        const blockAreaStartY = panelStartY + 35; // 텍스트 아래 시작
        const blockAreaHeight = panelHeight - 45; // 텍스트와 여백 제외
        const blockAreaCenterY = blockAreaStartY + blockAreaHeight / 2;
        
        // 블록 그리기 (완전 중앙 정렬)
        const offsetX = panelCenterX - actualBlockWidth / 2 - minCol * cellSize;
        const offsetY = blockAreaCenterY - actualBlockHeight / 2 - minRow * cellSize;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const cell = this.scene.add.graphics();
                    const x = offsetX + col * cellSize;
                    const y = offsetY + row * cellSize;
                    const size = cellSize - 2;
                    
                    // 그림자
                    cell.fillStyle(0x000000, 0.3);
                    cell.fillRoundedRect(x + 1, y + 1, size, size, 3);
                    
                    // 메인 블록
                    cell.fillStyle(block.color, 1);
                    cell.fillRoundedRect(x, y, size, size, 3);
                    
                    // 하이라이트
                    cell.fillGradientStyle(block.color, block.color, block.color, block.color, 0.4);
                    cell.fillRect(x, y, size, size / 3);
                    
                    // 테두리
                    cell.lineStyle(2, 0xffffff, 0.6);
                    cell.strokeRoundedRect(x, y, size, size, 3);
                    
                    this.nextBlockGraphics.push(cell);
                }
            }
        }
    }
    
    drawHoldBlock() {
        if (this.holdBlockGraphics) {
            this.holdBlockGraphics.forEach(g => g.destroy());
        }
        this.holdBlockGraphics = [];
        
        if (!this.gameState.holdBlock) return;
        
        const block = this.gameState.holdBlock;
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X - 150;
        const startY = 150;
        const cellSize = 24;
        
        const panelWidth = 110;
        const panelHeight = 110;
        const panelStartX = startX - 10;
        const panelStartY = startY - 10;
        const panelCenterX = panelStartX + panelWidth / 2;
        const panelCenterY = panelStartY + panelHeight / 2;
        
        // 배경 (고급 디자인)
        const bg = this.scene.add.graphics();
        bg.fillGradientStyle(0x0f0f23, 0x1a1a2e, 0x1a1a2e, 0x0f0f23, 0.9);
        bg.fillRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 12);
        bg.lineStyle(2, 0x00f5ff, 0.7);
        bg.strokeRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 12);
        this.holdBlockGraphics.push(bg);
        
        // "홀드" 텍스트 (중앙 정렬)
        const text = this.scene.add.text(panelCenterX, panelStartY + 18, '홀드', {
            fontSize: '16px',
            color: '#00f5ff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.holdBlockGraphics.push(text);
        
        // 실제 블록 바운딩 박스 계산
        let minCol = shape[0].length, maxCol = -1;
        let minRow = shape.length, maxRow = -1;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                }
            }
        }
        
        // 실제 블록 크기
        const actualBlockWidth = (maxCol - minCol + 1) * cellSize;
        const actualBlockHeight = (maxRow - minRow + 1) * cellSize;
        
        // 블록 중심점 계산 (텍스트 아래 공간의 중앙)
        const blockAreaStartY = panelStartY + 35; // 텍스트 아래 시작
        const blockAreaHeight = panelHeight - 45; // 텍스트와 여백 제외
        const blockAreaCenterY = blockAreaStartY + blockAreaHeight / 2;
        
        // 블록 그리기 (완전 중앙 정렬)
        const offsetX = panelCenterX - actualBlockWidth / 2 - minCol * cellSize;
        const offsetY = blockAreaCenterY - actualBlockHeight / 2 - minRow * cellSize;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const cell = this.scene.add.graphics();
                    const x = offsetX + col * cellSize;
                    const y = offsetY + row * cellSize;
                    const size = cellSize - 2;
                    
                    // 그림자
                    cell.fillStyle(0x000000, 0.3);
                    cell.fillRoundedRect(x + 1, y + 1, size, size, 3);
                    
                    // 메인 블록
                    cell.fillStyle(block.color, 1);
                    cell.fillRoundedRect(x, y, size, size, 3);
                    
                    // 하이라이트
                    cell.fillGradientStyle(block.color, block.color, block.color, block.color, 0.4);
                    cell.fillRect(x, y, size, size / 3);
                    
                    // 테두리
                    cell.lineStyle(2, 0xffffff, 0.6);
                    cell.strokeRoundedRect(x, y, size, size, 3);
                    
                    this.holdBlockGraphics.push(cell);
                }
            }
        }
    }
    
    update() {
        this.drawBoard();
        this.drawGhostBlock();
        this.drawCurrentBlock();
        this.drawNextBlock();
        this.drawHoldBlock();
    }
}

// 메인 게임 씬
class TetrisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisScene' });
        this.soundEnabled = true;
        this.sounds = {};
    }

    preload() {
        // 사운드 파일 로드 (MP3와 WAV 모두 지원)
        // Phaser는 배열의 첫 번째 파일을 시도하고, 실패하면 다음 파일 시도
        // 실제 존재하는 파일에 맞게 경로 설정 (WAV 우선)
        const soundFiles = [
            { key: 'bgm', paths: ['sounds/bgm.mp3', 'sounds/bgm.wav'] },
            { key: 'drop', paths: ['sounds/drop.wav', 'sounds/drop.mp3'] }, // WAV 파일 존재
            { key: 'game_over', paths: ['sounds/game_over.wav', 'sounds/game_over.mp3'] }, // WAV 파일 존재
            { key: 'tetris', paths: ['sounds/tetris.wav', 'sounds/tetris.mp3'] }, // WAV 파일 존재
            // 선택적 사운드 (파일이 없을 수 있음)
            { key: 'move', paths: ['sounds/move.wav', 'sounds/move.mp3'] },
            { key: 'rotate', paths: ['sounds/rotate.wav', 'sounds/rotate.mp3'] },
            { key: 'line_clear', paths: ['sounds/line_clear.wav', 'sounds/line_clear.mp3'] },
            { key: 'hold', paths: ['sounds/hold.wav', 'sounds/hold.mp3'] },
            { key: 'combo', paths: ['sounds/combo.wav', 'sounds/combo.mp3'] }
        ];
        
        // 사운드 파일 로드 (Phaser는 배열의 첫 번째 파일을 시도하고, 실패하면 다음 파일 시도)
        soundFiles.forEach(sound => {
            try {
                this.load.audio(sound.key, sound.paths);
            } catch (e) {
                // 사운드 로드 실패 시 무시 (파일이 없을 수 있음)
            }
        });
    }

    create() {
        // 사운드 초기화
        this.initSounds();

        // 게임 상태 초기화
        this.gameState = new GameState();
        this.gameState.scene = this; // 사운드 재생을 위해 scene 참조 전달
        this.renderer = new TetrisRenderer(this, this.gameState);
        
        // 키보드 입력 설정
        this.setupControls();
        
        // HUD 업데이트
        this.updateHUD();
        
        // 게임 루프 시작
        this.isRunning = true;
        
        // 속도 슬라이더와 게임 상태 동기화
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.value = this.gameState.fallSpeed;
            // 속도 표시 업데이트
            const speedValue = document.getElementById('speed-value');
            if (speedValue) {
                const speed = this.gameState.fallSpeed;
                let label = '';
                if (speed <= 500) {
                    label = '매우 빠름';
                } else if (speed <= 700) {
                    label = '빠름';
                } else if (speed <= 900) {
                    label = '보통';
                } else if (speed <= 1100) {
                    label = '느림';
                } else {
                    label = '매우 느림';
                }
                speedValue.textContent = label;
            }
        }
        
        // 로딩 화면 숨기기
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 500);
    }
    
    initSounds() {
        // 사운드 객체 초기화 (파일이 로드되었으면 사용)
        const soundKeys = ['bgm', 'move', 'rotate', 'drop', 'line_clear', 'tetris', 'hold', 'game_over', 'combo'];
        soundKeys.forEach(key => {
            try {
                // Phaser 3에서 사운드가 로드되었는지 확인
                if (this.cache.audio.exists(key)) {
                    if (key === 'bgm') {
                        // 배경음악은 루프 설정
                        this.sounds[key] = this.sound.add(key, { volume: 0.3, loop: true });
                    } else {
                        // 효과음은 일반 설정 (allowMultiple: true로 동시 재생 가능)
                        this.sounds[key] = this.sound.add(key, { volume: 0.5 });
                    }
                }
            } catch (e) {
                // 사운드 파일이 없으면 무시
            }
        });
        
        // 배경음악 시작 (안전하게)
        try {
            if (this.sounds['bgm']) {
                this.sounds['bgm'].play();
            }
        } catch (e) {
            // 배경음악 재생 실패 시 무시
        }
    }
    
    playSound(soundKey, volume = 0.5) {
        if (!this.soundEnabled) return false;
        
        try {
            // 배경음악은 저장된 사운드 객체 사용
            if (soundKey === 'bgm') {
                if (this.sounds[soundKey]) {
                    const sound = this.sounds[soundKey];
                    if (sound.isPlaying) {
                        return true;
                    }
                    sound.play({ volume: volume });
                    return true;
                }
                return false;
            }
            
            // 효과음은 캐시에서 직접 재생 (매번 새 인스턴스)
            if (this.cache.audio.exists(soundKey)) {
                const sound = this.sound.add(soundKey, { volume: volume });
                sound.play();
                
                // 재생 완료 후 정리 (메모리 누수 방지)
                sound.once('complete', () => {
                    if (sound && !sound.isPlaying) {
                        sound.destroy();
                    }
                });
                
                return true;
            }
            
            return false;
        } catch (e) {
            // 사운드 재생 실패 시 조용히 무시
            return false;
        }
    }
    
    setupControls() {
        // 키보드 입력
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        
        // 키 반복 설정
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.isRunning && !this.gameState.isPaused) {
                this.gameState.moveBlock(-1, 0);
                this.playSound('move', 0.3);
                this.renderer.update();
            }
        });
        
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.isRunning && !this.gameState.isPaused) {
                this.gameState.moveBlock(1, 0);
                this.playSound('move', 0.3);
                this.renderer.update();
            }
        });
        
        // 소프트 드롭 (점수 없음, 빠른 낙하만)
        this.input.keyboard.on('keydown-DOWN', () => {
            if (this.isRunning && !this.gameState.isPaused) {
                this.gameState.softDrop(false); // 점수 없음
                this.renderer.update();
            }
        });
        
        this.input.keyboard.on('keydown-UP', () => {
            if (this.isRunning && !this.gameState.isPaused) {
                this.gameState.rotateBlock();
                this.playSound('rotate', 0.4);
                this.renderer.update();
            }
        });
        
        this.spaceKey.on('down', () => {
            if (this.isRunning && !this.gameState.isPaused) {
                this.gameState.hardDrop();
                this.playSound('drop', 0.6);
                this.renderer.update();
            }
        });
        
        this.cKey.on('down', () => {
            if (this.isRunning && !this.gameState.isPaused) {
                this.gameState.hold();
                this.playSound('hold', 0.4);
                this.renderer.update();
            }
        });
        
        this.pKey.on('down', () => {
            // 게임이 실행 중일 때만 일시정지 가능
            if (this.isRunning && !this.gameState.isGameOver) {
                this.gameState.isPaused = !this.gameState.isPaused;
                if (this.gameState.isPaused) {
                    this.showPauseScreen();
                } else {
                    this.hidePauseScreen();
                }
            }
        });
        
    }
    
    update(time, delta) {
        if (!this.isRunning || this.gameState.isPaused) return;
        
        // 소프트 드롭 키를 누르고 있을 때 (점수 없이 빠른 낙하)
        const isSoftDropping = this.cursors && this.cursors.down.isDown;
        
        if (isSoftDropping) {
            if (!this.softDropTimer || time >= this.softDropTimer) {
                this.gameState.softDrop(false); // 점수 없음
                this.softDropTimer = time + 30; // 30ms마다 한 번씩 (더 빠른 반응)
            }
        } else {
            this.softDropTimer = 0;
        }
        
        // 게임 상태 업데이트 (소프트 드롭 중인지 전달)
        this.gameState.update(delta, isSoftDropping);
        
        // 렌더링 업데이트 (프레임당 한 번만)
        this.renderer.update();
        
        // HUD 업데이트
        this.updateHUD();
        
        // 게임 오버 체크
        if (this.gameState.isGameOver) {
            this.gameOver();
        }
    }

    updateHUD() {
        document.getElementById('lines-count').textContent = 
            this.gameState.lines;
        document.getElementById('current-score').textContent = 
            this.gameState.score.toLocaleString();
        document.getElementById('combo-count').textContent = 
            this.gameState.combo;
        
        // 최고 점수 저장 (표시는 하지 않음)
        const bestScore = parseInt(localStorage.getItem('tetrisBestScore') || '0');
        if (this.gameState.score > bestScore) {
            localStorage.setItem('tetrisBestScore', this.gameState.score.toString());
        }
    }
    
    showPauseScreen() {
        // 일시정지 화면 표시
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
        }
        
        this.pauseOverlay = this.add.graphics();
        this.pauseOverlay.fillStyle(0x000000, 0.8);
        this.pauseOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        this.pauseText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '일시정지\n\nP 키를 눌러 계속하기',
            {
                fontSize: '32px',
                color: '#00f5ff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);
    }
    
    hidePauseScreen() {
        // 일시정지 화면 숨기기
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
        if (this.pauseText) {
            this.pauseText.destroy();
            this.pauseText = null;
        }
    }
    
    gameOver() {
        this.isRunning = false;
        
        // 배경음악 정지 (안전하게)
        try {
            if (this.sounds['bgm'] && this.sounds['bgm'].isPlaying) {
                this.sounds['bgm'].stop();
            }
        } catch (e) {
            // 배경음악 정지 실패 시 무시
        }
        
        // 게임 오버 사운드
        this.playSound('game_over', 0.8);
        
        // 게임 오버 효과
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'GAME OVER',
            {
            fontSize: '48px',
            color: '#ff0040',
                fontFamily: 'Arial',
            fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        const scoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            `최종 점수: ${this.gameState.score.toLocaleString()}`,
            {
            fontSize: '24px',
            color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            '새 게임 버튼을 눌러 다시 시작',
            {
                fontSize: '18px',
                color: '#00f5ff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
    }
    
    newGame() {
        this.gameState.reset();
        this.isRunning = true;
        this.renderer.update();
        this.updateHUD();
        
        // 배경음악 다시 시작 (안전하게)
        try {
            if (this.sounds['bgm'] && !this.sounds['bgm'].isPlaying) {
                this.sounds['bgm'].play();
            }
        } catch (e) {
            // 배경음악 재생 실패 시 무시
        }
    }
}

// Phaser 게임 설정
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 900,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scene: TetrisScene,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
    },
    antialias: true,
    pixelArt: false
};

// 게임 시작
const game = new Phaser.Game(config);

// 전역 접근
window.tetrisGame = game;
