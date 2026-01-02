// ============================================
// 테트리스 게임 - 기획서 기반 구현
// Phaser 3 + 모던 UI/UX
// ============================================

import { CONFIG, TETROMINO_COLORS, TETROMINO_SHAPES, SRS_OFFSETS } from './gameConfig'
import Phaser from 'phaser'

// 게임 상수는 gameConfig.js에서 import됨

// 7-Bag 블록 생성 시스템
export class BlockBag {
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
export class Board {
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
        
        // 완성된 줄 찾기 (위에서 아래로)
        for (let row = 0; row < this.height; row++) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        // 줄 제거 및 위 블록 내리기 (아래에서 위로 제거하여 인덱스 문제 방지)
        // 내림차순 정렬하여 아래 줄부터 제거
        linesToClear.sort((a, b) => b - a);
        
        linesToClear.forEach(lineIndex => {
            this.grid.splice(lineIndex, 1);
            this.grid.unshift(Array(this.width).fill(0));
        });
        
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
    constructor(type, bag) {
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
        const copy = new Tetromino(this.type, null);
        copy.x = this.x;
        copy.y = this.y;
        copy.rotation = this.rotation;
        return copy;
    }
}

// 게임 상태 관리 클래스
export class GameState {
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
        
        // 줄 제거 체크 (제거될 줄 정보 가져오기)
        const clearResult = this.board.getLinesToClear();
        if (clearResult.count > 0) {
            // 줄 제거 애니메이션 효과 표시 (콤보 정보도 전달)
            // 현재 콤보는 아직 증가하지 않았으므로, 다음 콤보 값을 전달
            if (this.scene && this.scene.renderer) {
                this.scene.renderer.showLineClearEffect(clearResult.rows, clearResult.count, this.combo + 1);
            }
            
            // 애니메이션 후 실제 줄 제거
            // 셀 사라지는 애니메이션이 완료될 때까지 충분한 시간 대기 (마지막 셀은 약 300ms 후)
            const cellAnimationDelay = (CONFIG.BOARD_WIDTH - 1) * 12; // 마지막 셀의 delay
            const cellAnimationDuration = 250; // 셀 애니메이션 지속 시간
            const totalCellAnimationTime = cellAnimationDelay + cellAnimationDuration; // 약 358ms
            
            // 셀 애니메이션이 완료된 후 줄 제거 (더 빠르게 - 약 300ms)
            this.scene.time.delayedCall(300, () => {
                // 제거 중인 줄 표시 해제 (플래그는 showLineClearEffect에서 해제)
                if (this.scene && this.scene.renderer) {
                    this.scene.renderer.clearingLines = [];
                }
                
                // 실제 줄 제거
                const clearResult2 = this.board.clearLines();
                if (clearResult2.count > 0) {
                    this.handleLineClear(clearResult2.count);
                } else {
                    this.combo = 0;
                }
                this.spawnNextBlock();
            });
        } else {
            this.combo = 0;
            this.spawnNextBlock();
        }
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
export class TetrisRenderer {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.cellGraphics = [];
        this.ghostGraphics = null;
        this.currentBlockGraphics = null;
        this.nextBlockGraphics = null;
        this.holdBlockGraphics = null;
        this.clearingLines = []; // 제거 중인 줄 인덱스 리스트
        this.isClearingLines = false; // 줄 제거 효과 진행 중 플래그
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
            // 제거 중인 줄은 그리지 않음
            if (this.clearingLines.includes(row)) {
                continue;
            }
            
            for (let col = 0; col < board.width; col++) {
                if (board.grid[row][col] !== 0) {
                    const cell = this.scene.add.graphics();
                const x = startX + col * CONFIG.CELL_SIZE;
                const y = startY + row * CONFIG.CELL_SIZE;
                    const cellSize = CONFIG.CELL_SIZE - 2;
                    
                    // 색상 찾기 (숫자에서 색상 객체로 변환)
                    const colorValue = board.grid[row][col];
                    let colorObj = null;
                    for (const [type, colors] of Object.entries(TETROMINO_COLORS)) {
                        if (colors.base === colorValue) {
                            colorObj = colors;
                            break;
                        }
                    }
                    if (!colorObj) colorObj = { light: colorValue, base: colorValue, dark: colorValue };
                    
                    // 그림자 효과 (3D 느낌)
                    cell.fillStyle(0x000000, 0.5);
                    cell.fillRoundedRect(x + 4, y + 4, cellSize, cellSize, 4);
                    
                    // 메인 블록 (3D 그라디언트)
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.base,
                        colorObj.dark, colorObj.base,
                        1
                    );
                    cell.fillRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 상단 하이라이트 (밝은 부분)
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.light,
                        colorObj.base, colorObj.base,
                        0.8
                    );
                    cell.fillRect(x + 1, y + 1, cellSize, cellSize / 2.5);
                    
                    // 하단 그림자 (어두운 부분)
                    cell.fillGradientStyle(
                        colorObj.base, colorObj.base,
                        colorObj.dark, colorObj.dark,
                        0.6
                    );
                    cell.fillRect(x + 1, y + cellSize * 0.6, cellSize, cellSize / 2.5);
                    
                    // 테두리 (글로우 효과)
                    cell.lineStyle(2, 0xffffff, 0.7);
                    cell.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 내부 하이라이트 라인
                    cell.lineStyle(1, colorObj.light, 0.5);
                    cell.strokeRoundedRect(x + 2, y + 2, cellSize - 2, cellSize / 3, 2);
                
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
                    
                    // 그림자 효과 (3D 느낌)
                    cell.fillStyle(0x000000, 0.5);
                    cell.fillRoundedRect(x + 3, y + 3, cellSize, cellSize, 4);
                    
                    // 메인 블록 (3D 그라디언트)
                    const colorObj = block.colorObj || { light: block.color, base: block.color, dark: block.color };
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.base,
                        colorObj.dark, colorObj.base,
                        1
                    );
                    cell.fillRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 상단 하이라이트 (밝은 부분)
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.light,
                        colorObj.base, colorObj.base,
                        0.9
                    );
                    cell.fillRect(x + 1, y + 1, cellSize, cellSize / 2.5);
                    
                    // 하단 그림자 (어두운 부분)
                    cell.fillGradientStyle(
                        colorObj.base, colorObj.base,
                        colorObj.dark, colorObj.dark,
                        0.7
                    );
                    cell.fillRect(x + 1, y + cellSize * 0.6, cellSize, cellSize / 2.5);
                    
                    // 글로우 테두리
                    cell.lineStyle(3, 0xffffff, 0.9);
                    cell.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 4);
                    
                    // 내부 하이라이트 라인
                    cell.lineStyle(1, colorObj.light, 0.6);
                    cell.strokeRoundedRect(x + 2, y + 2, cellSize - 2, cellSize / 3, 2);
                    
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
                    
                    // 3D 효과를 위한 색상 객체
                    const colorObj = block.colorObj || { light: block.color, base: block.color, dark: block.color };
                    
                    // 그림자 (3D 느낌)
                    cell.fillStyle(0x000000, 0.4);
                    cell.fillRoundedRect(x + 2, y + 2, size, size, 3);
                    
                    // 메인 블록 (3D 그라디언트)
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.base,
                        colorObj.dark, colorObj.base,
                        1
                    );
                    cell.fillRoundedRect(x, y, size, size, 3);
                    
                    // 상단 하이라이트
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.light,
                        colorObj.base, colorObj.base,
                        0.7
                    );
                    cell.fillRect(x, y, size, size / 2.5);
                    
                    // 테두리
                    cell.lineStyle(2, 0xffffff, 0.7);
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
                    
                    // 3D 효과를 위한 색상 객체
                    const colorObj = block.colorObj || { light: block.color, base: block.color, dark: block.color };
                    
                    // 그림자 (3D 느낌)
                    cell.fillStyle(0x000000, 0.4);
                    cell.fillRoundedRect(x + 2, y + 2, size, size, 3);
                    
                    // 메인 블록 (3D 그라디언트)
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.base,
                        colorObj.dark, colorObj.base,
                        1
                    );
                    cell.fillRoundedRect(x, y, size, size, 3);
                    
                    // 상단 하이라이트
                    cell.fillGradientStyle(
                        colorObj.light, colorObj.light,
                        colorObj.base, colorObj.base,
                        0.7
                    );
                    cell.fillRect(x, y, size, size / 2.5);
                    
                    // 테두리
                    cell.lineStyle(2, 0xffffff, 0.7);
                    cell.strokeRoundedRect(x, y, size, size, 3);
                    
                    this.holdBlockGraphics.push(cell);
                }
            }
        }
    }
    
    showLineClearEffect(rows, count, combo = 0) {
        // 중복 호출 방지
        if (this.isClearingLines) {
            return;
        }
        this.isClearingLines = true;
        
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        const boardWidth = CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE;
        const board = this.gameState.board;
        
        // 제거 중인 줄로 표시 (다음 렌더링에서 그리지 않음)
        this.clearingLines = [...rows];
        
        // 한 줄만 제거할 때도 화려하게!
        const impactIntensity = count === 1 ? 1.5 : count;
        
        // 모든 줄의 중앙 Y 좌표 계산 (전체 효과를 위한)
        // 텍스트는 화면 중앙에 표시하여 확실히 보이도록
        const centerY = this.scene.cameras.main.centerY; // 화면 중앙에 표시
        const lineCenterY = rows.length > 0 
            ? startY + (rows[0] + rows[rows.length - 1]) / 2 * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
            : startY + CONFIG.BOARD_HEIGHT * CONFIG.CELL_SIZE / 2;
        
        // 각 줄에 대한 효과 (한 번만 실행)
        rows.forEach((row, index) => {
            const y = startY + row * CONFIG.CELL_SIZE;
            
            // 1. 줄 전체에 간단한 글로우 효과 (간소화)
            const glow = this.scene.add.graphics();
            glow.lineStyle(3, 0x00f5ff, 0.6); // 두께와 투명도 줄임
            glow.strokeRect(startX - 2, y - 2, boardWidth + 4, CONFIG.CELL_SIZE + 4);
            glow.setDepth(997);
            
            // 글로우 펄스 애니메이션 (간소화)
            this.scene.tweens.add({
                targets: glow,
                alpha: { from: 0.6, to: 0 },
                duration: 250, // 시간 단축
                ease: 'Power2',
                onComplete: () => glow.destroy()
            });
            
            // 2. 줄의 각 셀을 개별적으로 사라지게 하는 효과 (왼쪽에서 오른쪽으로 스캔)
            for (let col = 0; col < CONFIG.BOARD_WIDTH; col++) {
                const cellX = startX + col * CONFIG.CELL_SIZE;
                const cellColor = board.grid[row][col];
                
                // 색상 객체 찾기
                let colorObj = null;
                for (const [type, colors] of Object.entries(TETROMINO_COLORS)) {
                    if (colors.base === cellColor) {
                        colorObj = colors;
                        break;
                    }
                }
                if (!colorObj) colorObj = { light: cellColor, base: cellColor, dark: cellColor };
                
                // 각 셀에 대한 사라지는 효과 (간소화 - 회전 제거)
                const cellEffect = this.scene.add.graphics();
                cellEffect.fillStyle(cellColor, 0.8); // 그라디언트 대신 단색
                cellEffect.fillRoundedRect(cellX + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2, 4);
                
                // 간단한 글로우 효과
                cellEffect.lineStyle(2, 0x00f5ff, 0.5); // 두께와 투명도 줄임
                cellEffect.strokeRoundedRect(cellX + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2, 4);
                
                cellEffect.setDepth(998);
                
                // 셀 사라지는 애니메이션 (간소화 - 스케일만)
                const delay = col * 8; // 딜레이 단축
                
                this.scene.tweens.add({
                    targets: cellEffect,
                    alpha: { from: 0.8, to: 0 },
                    scaleX: { from: 1, to: 0 },
                    scaleY: { from: 1, to: 0 },
                    duration: 200, // 시간 단축
                    delay: delay,
                    ease: 'Power2',
                    onComplete: () => cellEffect.destroy()
                });
            }
        });
        
        // 3. 텍스트 애니메이션 효과 (문구만 표시)
        const textMessages = {
            1: { text: 'SINGLE', color: '#00f5ff', size: 48 },
            2: { text: 'DOUBLE', color: '#ff6b9d', size: 52 },
            3: { text: 'TRIPLE', color: '#ffd700', size: 56 },
            4: { text: 'TETRIS!', color: '#ffd700', size: 60 }
        };
        
        const message = textMessages[count] || textMessages[1];
        const centerX = this.scene.cameras.main.centerX;
        
        // 메인 텍스트 (배경 효과 제거)
        const text = this.scene.add.text(
            centerX,
            centerY,
            message.text,
            {
                fontSize: message.size + 'px',
                fontFamily: 'Orbitron, monospace',
                fontStyle: 'bold',
                color: message.color,
                stroke: '#000000',
                strokeThickness: 6,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: message.color,
                    blur: 20,
                    stroke: true,
                    fill: true
                }
            }
        );
        text.setOrigin(0.5);
        text.setDepth(1002);
        text.setAlpha(0);
        text.setScale(0);
        
        // 텍스트 등장 애니메이션
        this.scene.tweens.add({
            targets: text,
            alpha: { from: 0, to: 1 },
            scale: { from: 0, to: 1.0 },
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                text.setScale(1.0);
            }
        });
        
        // 콤보 문구 표시 (콤보 2 이상일 때)
        let comboText = null;
        if (combo > 1) {
            const comboColors = {
                2: { color: '#ff6b9d', glowColor: 0xff6b9d },
                3: { color: '#ffd700', glowColor: 0xffd700 },
                4: { color: '#32cd32', glowColor: 0x32cd32 },
                5: { color: '#ff1493', glowColor: 0xff1493 }
            };
            const comboStyle = comboColors[Math.min(combo, 5)] || { color: '#ff1493', glowColor: 0xff1493 };
            const comboSize = Math.min(48 + (combo - 2) * 4, 64); // 콤보가 높을수록 크게
            
            // 콤보 텍스트 (배경 효과 제거)
            comboText = this.scene.add.text(
                centerX,
                centerY + 120,
                `COMBO x${combo}!`,
                {
                    fontSize: comboSize + 'px',
                    fontFamily: 'Orbitron, monospace',
                    fontStyle: 'bold',
                    color: comboStyle.color,
                    stroke: '#000000',
                    strokeThickness: 5,
                    shadow: {
                        offsetX: 0,
                        offsetY: 0,
                        color: comboStyle.color,
                        blur: 15,
                        stroke: true,
                        fill: true
                    }
                }
            );
            comboText.setOrigin(0.5);
            comboText.setDepth(1002);
            comboText.setAlpha(0);
            comboText.setScale(0);
            
            // 콤보 텍스트 등장 애니메이션
            this.scene.tweens.add({
                targets: comboText,
                alpha: { from: 0, to: 1 },
                scale: { from: 0, to: 1.0 },
                duration: 200,
                delay: 100,
                ease: 'Power2',
                onComplete: () => {
                    comboText.setScale(1.0);
                }
            });
            
            // 콤보 텍스트 사라지는 애니메이션 (더 빠르게)
            this.scene.tweens.add({
                targets: comboText,
                alpha: { from: 1, to: 0 },
                scale: { from: 1.0, to: 1.4 },
                y: { from: centerY + 120, to: centerY + 60 },
                duration: 300, // 400 -> 300
                delay: 400, // 800 -> 400으로 단축
                ease: 'Power2',
                onComplete: () => {
                    if (comboText) comboText.destroy();
                }
            });
        }
        
        // 4. 서클 웨이브 효과 (간소화 - 한 줄일 때는 1개만)
        const waveCount = count === 1 ? 1 : 2; // 한 줄일 때는 1개만, 여러 줄일 때는 2개
        const waves = []; // 웨이브들을 저장하여 텍스트와 함께 사라지게 함
        
        for (let i = 0; i < waveCount; i++) {
            const wave = this.scene.add.circle(
                startX + boardWidth / 2,
                lineCenterY,
                10,
                0x00f5ff,
                0.5 // 투명도 줄임
            );
            wave.setDepth(999);
            wave.setStrokeStyle(2, 0x00f5ff, 0.6); // 두께와 투명도 줄임
            waves.push(wave);
            
            // 웨이브 확장 애니메이션 (간소화)
            this.scene.tweens.add({
                targets: wave,
                radius: { from: 10, to: boardWidth * 0.5 }, // 크기 줄임
                alpha: { from: 0.5, to: 0 }, // 완전히 사라지게
                duration: 200, // 더 짧게
                delay: i * 30, // 더 빠르게
                ease: 'Power2'
            });
        }
        
        // 텍스트 사라지는 애니메이션 (더 빠르게) - 웨이브도 함께 사라지게
        const textDisplayTime = 400; // 텍스트 표시 시간
        const textFadeOutDuration = 300; // 텍스트 사라지는 시간
        const waveFadeOutDuration = 150; // 웨이브 사라지는 시간
        
        this.scene.tweens.add({
            targets: text,
            alpha: { from: 1, to: 0 },
            scale: { from: 1.0, to: 1.2 }, // 스케일 줄임
            y: { from: centerY, to: centerY - 40 }, // 이동 거리 줄임
            duration: textFadeOutDuration,
            delay: textDisplayTime,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
                // 텍스트가 사라질 때 웨이브도 함께 사라지게
                let wavesDestroyed = 0;
                const totalWaves = waves.length;
                
                if (totalWaves === 0) {
                    // 웨이브가 없으면 즉시 플래그 리셋
                    this.isClearingLines = false;
                } else {
                    waves.forEach(wave => {
                        if (wave && wave.active) {
                            this.scene.tweens.add({
                                targets: wave,
                                alpha: { from: wave.alpha, to: 0 },
                                scale: { from: wave.scaleX, to: wave.scaleX * 1.2 },
                                duration: waveFadeOutDuration,
                                ease: 'Power2',
                                onComplete: () => {
                                    wave.destroy();
                                    wavesDestroyed++;
                                    // 모든 웨이브가 사라진 후 플래그 리셋
                                    if (wavesDestroyed === totalWaves) {
                                        this.isClearingLines = false;
                                    }
                                }
                            });
                        } else {
                            wavesDestroyed++;
                            if (wavesDestroyed === totalWaves) {
                                this.isClearingLines = false;
                            }
                        }
                    });
                }
            }
        });
        
        // 5. 파티클 효과 (간소화 - 한 줄일 때는 제거)
        if (count > 1) {
            this.createLineClearParticles(startX, lineCenterY, boardWidth, count);
        }
        
        // 6. 화면 줌 효과 제거 (너무 화려함)
        
        // 플래시 효과 제거 (배경 효과 없음)
        
        // 텍스트와 웨이브가 완전히 사라지는 시간 계산 (위에서 선언된 변수 사용)
        // 텍스트: 400ms delay + 300ms duration = 700ms
        // 웨이브: 텍스트 사라질 때 함께 사라지므로 추가 150ms = 700ms + 150ms = 850ms
        const totalTextAndWaveTime = textDisplayTime + textFadeOutDuration + waveFadeOutDuration; // 850ms
        
        // 가장 긴 애니메이션 시간을 기준으로 플래그 해제
        const totalAnimationTime = totalTextAndWaveTime + 50; // 안전 마진 50ms
        
        // 플래그는 텍스트와 웨이브가 사라질 때 리셋됨 (위의 onComplete에서 처리)
        // 안전을 위해 최대 시간 후에도 플래그를 리셋 (백업)
        this.scene.time.delayedCall(totalAnimationTime + 200, () => {
            // 플래그가 아직 true인 경우 강제로 리셋 (안전장치)
            if (this.isClearingLines) {
                this.isClearingLines = false;
            }
        });
    }
    
    createLineClearParticles(x, y, width, count) {
        // 파티클 색상 (줄 수에 따라)
        const colors = [0x00f5ff, 0xff6b9d, 0xffd700, 0x32cd32, 0xff1493];
        const color = colors[Math.min(count - 1, colors.length - 1)];
        
        // 왼쪽에서 오른쪽으로 스캔하는 파티클 효과 (더 많이!)
        const scanCount = Math.floor(30 * impactIntensity);
        for (let i = 0; i < scanCount; i++) {
            const particle = this.scene.add.circle(
                x + (width / scanCount) * i,
                y,
                4 + Math.random() * 4,
                color,
                1
            );
            
            particle.setDepth(999);
            
            // 파티클이 위아래로 퍼지며 사라짐
            const angle = (Math.random() - 0.5) * Math.PI * 0.8;
            const distance = 50 + Math.random() * 80;
            const targetX = particle.x + Math.cos(angle) * distance;
            const targetY = particle.y + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: { from: 1, to: 0 },
                scale: { from: 1, to: 0 },
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // 중앙에서 강력한 폭발 효과 (더 많이!)
        const explosionCount = Math.floor(25 * impactIntensity);
        for (let i = 0; i < explosionCount; i++) {
            const particle = this.scene.add.circle(
                x + width / 2,
                y,
                4 + Math.random() * 5,
                color,
                1
            );
            
            particle.setDepth(999);
            
            const angle = (Math.PI * 2 / explosionCount) * i;
            const distance = 60 + Math.random() * 80;
            const targetX = particle.x + Math.cos(angle) * distance;
            const targetY = particle.y + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: { from: 1, to: 0 },
                scale: { from: 1, to: 0 },
                rotation: Math.PI * 2,
                duration: 600 + Math.random() * 300,
                ease: 'Power3',
                onComplete: () => particle.destroy()
            });
        }
        
        // 양쪽 끝에서 폭발 효과 (더 강하게!)
        for (let side = 0; side < 2; side++) {
            const sideX = side === 0 ? x : x + width;
            const sideCount = Math.floor(15 * impactIntensity);
            for (let i = 0; i < sideCount; i++) {
                const particle = this.scene.add.circle(
                    sideX,
                    y,
                    4 + Math.random() * 4,
                    color,
                    1
                );
                
                particle.setDepth(999);
                
                const angle = (side === 0 ? Math.PI : 0) + (Math.random() - 0.5) * Math.PI * 0.7;
                const distance = 50 + Math.random() * 70;
                const targetX = particle.x + Math.cos(angle) * distance;
                const targetY = particle.y + Math.sin(angle) * distance;
                
                this.scene.tweens.add({
                    targets: particle,
                    x: targetX,
                    y: targetY,
                    alpha: { from: 1, to: 0 },
                    scale: { from: 1, to: 0 },
                    rotation: Math.PI,
                    duration: 500 + Math.random() * 300,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }
        }
        
        // 별 모양 파티클 효과 (추가!) - 그래픽으로 별 그리기
        for (let i = 0; i < Math.floor(12 * impactIntensity); i++) {
            const starX = x + width / 2 + (Math.random() - 0.5) * width * 0.8;
            const starY = y + (Math.random() - 0.5) * 100;
            const starSize = 8 + Math.random() * 6;
            
            const star = this.scene.add.graphics();
            star.fillStyle(color, 1);
            star.lineStyle(2, color, 1);
            
            // 별 모양 그리기 (5각 별) - 원점 기준으로 그리기
            star.beginPath();
            for (let j = 0; j < 10; j++) {
                const angle = (Math.PI / 5) * j - Math.PI / 2;
                const radius = j % 2 === 0 ? starSize : starSize * 0.4;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                if (j === 0) {
                    star.moveTo(px, py);
                } else {
                    star.lineTo(px, py);
                }
            }
            star.closePath();
            star.fillPath();
            star.strokePath();
            
            star.setPosition(starX, starY);
            star.setDepth(999);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 100;
            const targetX = starX + Math.cos(angle) * distance;
            const targetY = starY + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: star,
                x: { from: starX, to: targetX },
                y: { from: starY, to: targetY },
                alpha: { from: 1, to: 0 },
                scaleX: { from: 1, to: 0 },
                scaleY: { from: 1, to: 0 },
                rotation: Math.PI * 4,
                duration: 700 + Math.random() * 300,
                ease: 'Power3',
                onComplete: () => star.destroy()
            });
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
export default class TetrisScene extends Phaser.Scene {
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
            { key: 'bgm', paths: ['/sounds/bgm.mp3', '/sounds/bgm.wav'] },
            { key: 'drop', paths: ['/sounds/drop.wav', '/sounds/drop.mp3'] },
            { key: 'game_over', paths: ['/sounds/game_over.wav', '/sounds/game_over.mp3'] },
            { key: 'tetris', paths: ['/sounds/tetris.wav', '/sounds/tetris.mp3'] },
            // 선택적 사운드 (파일이 없을 수 있음)
            { key: 'move', paths: ['/sounds/move.wav', '/sounds/move.mp3'] },
            { key: 'rotate', paths: ['/sounds/rotate.wav', '/sounds/rotate.mp3'] },
            { key: 'line_clear', paths: ['/sounds/line_clear.wav', '/sounds/line_clear.mp3'] },
            { key: 'hold', paths: ['/sounds/hold.wav', '/sounds/hold.mp3'] },
            { key: 'combo', paths: ['/sounds/combo.wav', '/sounds/combo.mp3'] }
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

// Phaser 게임 설정은 TetrisGame.jsx에서 처리됨
