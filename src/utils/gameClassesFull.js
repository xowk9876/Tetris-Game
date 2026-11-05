import { CONFIG, TETROMINO_COLORS } from './gameConfig.js';
import { GameState } from './gameEngine.js';
import { GameAudio } from './gameAudio.js';
import { readBestScore, readAudioEnabled, savePreference } from './storage.js';
import Phaser from 'phaser';

// 렌더러 클래스 (최적화됨)
export class TetrisRenderer {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.cellGraphics = [];
        this.ghostGraphics = null;
        this.currentBlockGraphics = null;
        this.nextBlockGraphics = null;
        this.holdBlockGraphics = null;
        this.clearingLines = [];
        
        // 최적화: 더티 플래그 패턴
        this.boardDirty = true;
        this.lastBoardState = null;
        this.lastCurrentBlock = null;
        this.lastNextBlock = null;
        this.lastHoldBlock = null;
        
        // 정적 요소는 한 번만 그리기
        this.boardBackgroundDrawn = false;
        this.boardBackground = null;
        this.gridLines = null;
        
        // 버전 기반 변경 감지 (JSON.stringify 대신 O(1) 비교)
        this.lastBoardVersion = -1;
    }
    
    // 보드 상태 변경 감지 (O(1) - version counter 사용)
    isBoardChanged() {
        const currentVersion = this.gameState.board.version;
        if (this.lastBoardVersion !== currentVersion) {
            this.lastBoardVersion = currentVersion;
            return true;
        }
        return false;
    }
    
    // 현재 블록 변경 감지
    isCurrentBlockChanged() {
        const block = this.gameState.currentBlock;
        if (!block) return this.lastCurrentBlock !== null;
        
        const currentState = `${block.type}-${block.x}-${block.y}-${block.rotation}`;
        if (this.lastCurrentBlock !== currentState) {
            this.lastCurrentBlock = currentState;
            return true;
        }
        return false;
    }
    
    drawBoard() {
        const board = this.gameState.board;
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        const boardWidth = CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE;
        const boardHeight = CONFIG.BOARD_HEIGHT * CONFIG.CELL_SIZE;
        const padding = 8;
        
        // 정적 요소는 한 번만 그리기 (최적화)
        if (!this.boardBackgroundDrawn) {
            // 보드 배경
            this.boardBackground = this.scene.add.graphics();
            
            // 외부 그림자
            this.boardBackground.fillStyle(0x000000, 0.5);
            this.boardBackground.fillRoundedRect(
                startX - padding + 2,
                startY - padding + 2,
                boardWidth + padding * 2,
                boardHeight + padding * 2,
                12
            );
            
            // 메인 배경
            this.boardBackground.fillStyle(0x0f0f23, 1);
            this.boardBackground.fillRoundedRect(
                startX - padding,
                startY - padding,
                boardWidth + padding * 2,
                boardHeight + padding * 2,
                12
            );
            
            // 네온 테두리
            this.boardBackground.lineStyle(2, 0x00f5ff, 0.6);
            this.boardBackground.strokeRoundedRect(
                startX - padding,
                startY - padding,
                boardWidth + padding * 2,
                boardHeight + padding * 2,
                12
            );
            
            // 그리드 라인
            this.gridLines = this.scene.add.graphics();
            this.gridLines.lineStyle(1, 0x312e81, 0.1);
            
            for (let col = 0; col <= CONFIG.BOARD_WIDTH; col++) {
                const x = startX + col * CONFIG.CELL_SIZE;
                this.gridLines.moveTo(x, startY);
                this.gridLines.lineTo(x, startY + boardHeight);
            }
            
            for (let row = 0; row <= CONFIG.BOARD_HEIGHT; row++) {
                const y = startY + row * CONFIG.CELL_SIZE;
                this.gridLines.moveTo(startX, y);
                this.gridLines.lineTo(startX + boardWidth, y);
            }
            
            this.gridLines.strokePath();
            this.boardBackgroundDrawn = true;
        }
        
        // 보드 상태가 변경되었을 때만 셀 다시 그리기
        if (!this.isBoardChanged() && !this.boardDirty) {
            return;
        }
        this.boardDirty = false;
        
        // 기존 셀 그래픽 제거
        this.cellGraphics.forEach(g => g.destroy());
        this.cellGraphics = [];
        
        // 배치된 블록 그리기 (간소화된 스타일)
        for (let row = 0; row < board.height; row++) {
            // clearingLines에 포함된 줄은 그리지 않음
            if (this.clearingLines.includes(row)) continue;
            
            for (let col = 0; col < board.width; col++) {
                if (board.grid[row][col] !== 0) {
                    const cell = this.scene.add.graphics();
                    const x = startX + col * CONFIG.CELL_SIZE;
                    const y = startY + row * CONFIG.CELL_SIZE;
                    const cellSize = CONFIG.CELL_SIZE - 2;
                    
                    const colorValue = board.grid[row][col];
                    let colorObj = null;
                    for (const [type, colors] of Object.entries(TETROMINO_COLORS)) {
                        if (colors.base === colorValue) {
                            colorObj = colors;
                            break;
                        }
                    }
                    if (!colorObj) colorObj = { light: colorValue, base: colorValue, dark: colorValue };
                    
                    // 간소화된 블록 스타일
                    cell.fillStyle(colorObj.base, 1);
                    cell.fillRoundedRect(x + 1, y + 1, cellSize, cellSize, 3);
                    
                    // 상단 하이라이트
                    cell.fillStyle(colorObj.light, 0.5);
                    cell.fillRect(x + 1, y + 1, cellSize, cellSize / 3);
                    
                    // 테두리
                    cell.lineStyle(1, 0xffffff, 0.4);
                    cell.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 3);
                    
                    this.cellGraphics.push(cell);
                }
            }
        }
    }
    
    drawGhostBlock() {
        const block = this.gameState.currentBlock;
        const state = block ? `${block.type}-${block.x}-${block.y}-${block.rotation}-${this.gameState.board.version}` : null;
        if (this.lastGhostState === state) return;
        this.lastGhostState = state;
        this.ghostGraphics?.destroy();
        this.ghostGraphics = null;
        if (!block) return;

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
                    
                    // 간소화된 고스트 블록
                    this.ghostGraphics.lineStyle(1, block.color, 0.3);
                    this.ghostGraphics.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 2);
                }
            }
        }
    }
    
    drawCurrentBlock() {
        if (!this.gameState.currentBlock) {
            this.currentBlockGraphics?.forEach(graphic => graphic.destroy());
            this.currentBlockGraphics = null;
            this.lastCurrentBlock = null;
            return;
        }
        
        // 변경되지 않았으면 스킵
        if (!this.isCurrentBlockChanged() && this.currentBlockGraphics && this.currentBlockGraphics.length > 0) {
            return;
        }
        
        const block = this.gameState.currentBlock;
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        
        // 기존 블록 그래픽 제거
        if (this.currentBlockGraphics) {
            this.currentBlockGraphics.forEach(g => g.destroy());
        }
        this.currentBlockGraphics = [];
        
        const colorObj = block.colorObj || { light: block.color, base: block.color, dark: block.color };
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const cell = this.scene.add.graphics();
                    const x = startX + (block.x + col) * CONFIG.CELL_SIZE;
                    const y = startY + (block.y + row) * CONFIG.CELL_SIZE;
                    const cellSize = CONFIG.CELL_SIZE - 2;
                    
                    // 간소화된 블록 스타일
                    cell.fillStyle(colorObj.base, 1);
                    cell.fillRoundedRect(x + 1, y + 1, cellSize, cellSize, 3);
                    
                    // 상단 하이라이트
                    cell.fillStyle(colorObj.light, 0.6);
                    cell.fillRect(x + 1, y + 1, cellSize, cellSize / 3);
                    
                    // 테두리
                    cell.lineStyle(2, 0xffffff, 0.6);
                    cell.strokeRoundedRect(x + 1, y + 1, cellSize, cellSize, 3);
                    
                    this.currentBlockGraphics.push(cell);
                }
            }
        }
    }
    
    drawNextBlock() {
        // 변경 감지
        const nextBlockType = this.gameState.nextBlock ? this.gameState.nextBlock.type : null;
        if (this.lastNextBlock === nextBlockType && this.nextBlockGraphics && this.nextBlockGraphics.length > 0) {
            return;
        }
        this.lastNextBlock = nextBlockType;
        
        if (this.nextBlockGraphics) {
            this.nextBlockGraphics.forEach(g => g.destroy());
        }
        this.nextBlockGraphics = [];
        
        if (!this.gameState.nextBlock) return;
        
        const block = this.gameState.nextBlock;
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X + CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE + 50;
        const startY = 150;
        const cellSize = 22;
        
        const panelWidth = 100;
        const panelHeight = 100;
        const panelStartX = startX - 10;
        const panelStartY = startY - 10;
        const panelCenterX = panelStartX + panelWidth / 2;
        
        // 배경 (간소화)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f0f23, 0.9);
        bg.fillRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 8);
        bg.lineStyle(1, 0x00f5ff, 0.5);
        bg.strokeRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 8);
        this.nextBlockGraphics.push(bg);
        
        const text = this.scene.add.text(panelCenterX, panelStartY + 16, '다음', {
            fontSize: '14px',
            color: '#00f5ff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.nextBlockGraphics.push(text);
        
        // 블록 바운딩 박스 계산
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
        
        const actualBlockWidth = (maxCol - minCol + 1) * cellSize;
        const actualBlockHeight = (maxRow - minRow + 1) * cellSize;
        const blockAreaCenterY = panelStartY + 32 + (panelHeight - 40) / 2;
        
        const offsetX = panelCenterX - actualBlockWidth / 2 - minCol * cellSize;
        const offsetY = blockAreaCenterY - actualBlockHeight / 2 - minRow * cellSize;
        
        const colorObj = block.colorObj || { light: block.color, base: block.color, dark: block.color };
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const cell = this.scene.add.graphics();
                    const x = offsetX + col * cellSize;
                    const y = offsetY + row * cellSize;
                    const size = cellSize - 2;
                    
                    cell.fillStyle(colorObj.base, 1);
                    cell.fillRoundedRect(x, y, size, size, 2);
                    cell.lineStyle(1, 0xffffff, 0.5);
                    cell.strokeRoundedRect(x, y, size, size, 2);
                    
                    this.nextBlockGraphics.push(cell);
                }
            }
        }
    }
    
    drawHoldBlock() {
        // 변경 감지
        const holdBlockType = this.gameState.holdBlock ? this.gameState.holdBlock.type : null;
        if (this.lastHoldBlock === holdBlockType && this.holdBlockGraphics && this.holdBlockGraphics.length > 0) {
            return;
        }
        this.lastHoldBlock = holdBlockType;
        
        if (this.holdBlockGraphics) {
            this.holdBlockGraphics.forEach(g => g.destroy());
        }
        this.holdBlockGraphics = [];
        
        if (!this.gameState.holdBlock) return;
        
        const block = this.gameState.holdBlock;
        const shape = block.getShape();
        const startX = CONFIG.BOARD_OFFSET_X - 140;
        const startY = 150;
        const cellSize = 22;
        
        const panelWidth = 100;
        const panelHeight = 100;
        const panelStartX = startX - 10;
        const panelStartY = startY - 10;
        const panelCenterX = panelStartX + panelWidth / 2;
        
        // 배경 (간소화)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f0f23, 0.9);
        bg.fillRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 8);
        bg.lineStyle(1, 0x00f5ff, 0.5);
        bg.strokeRoundedRect(panelStartX, panelStartY, panelWidth, panelHeight, 8);
        this.holdBlockGraphics.push(bg);
        
        const text = this.scene.add.text(panelCenterX, panelStartY + 16, '홀드', {
            fontSize: '14px',
            color: '#00f5ff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.holdBlockGraphics.push(text);
        
        // 블록 바운딩 박스 계산
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
        
        const actualBlockWidth = (maxCol - minCol + 1) * cellSize;
        const actualBlockHeight = (maxRow - minRow + 1) * cellSize;
        const blockAreaCenterY = panelStartY + 32 + (panelHeight - 40) / 2;
        
        const offsetX = panelCenterX - actualBlockWidth / 2 - minCol * cellSize;
        const offsetY = blockAreaCenterY - actualBlockHeight / 2 - minRow * cellSize;
        
        const colorObj = block.colorObj || { light: block.color, base: block.color, dark: block.color };
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const cell = this.scene.add.graphics();
                    const x = offsetX + col * cellSize;
                    const y = offsetY + row * cellSize;
                    const size = cellSize - 2;
                    
                    cell.fillStyle(colorObj.base, 1);
                    cell.fillRoundedRect(x, y, size, size, 2);
                    cell.lineStyle(1, 0xffffff, 0.5);
                    cell.strokeRoundedRect(x, y, size, size, 2);
                    
                    this.holdBlockGraphics.push(cell);
                }
            }
        }
    }
    
    showLineClearEffect(rows, count, combo = 0) {
        const startX = CONFIG.BOARD_OFFSET_X;
        const startY = CONFIG.BOARD_OFFSET_Y;
        const boardWidth = CONFIG.BOARD_WIDTH * CONFIG.CELL_SIZE;
        
        // 제거 중인 줄로 표시하고 보드 강제 재렌더링
        this.clearingLines = [...rows];
        this.boardDirty = true;
        
        const centerY = this.scene.cameras.main.centerY;
        const lineCenterY = rows.length > 0 
            ? startY + (rows[0] + rows[rows.length - 1]) / 2 * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
            : startY + CONFIG.BOARD_HEIGHT * CONFIG.CELL_SIZE / 2;
        
        // 간소화된 줄 효과 (각 줄에 하나의 글로우만)
        rows.forEach((row) => {
            const y = startY + row * CONFIG.CELL_SIZE;
            
            const glow = this.scene.add.graphics();
            glow.lineStyle(2, 0x00f5ff, 0.8);
            glow.strokeRect(startX, y, boardWidth, CONFIG.CELL_SIZE);
            glow.setDepth(997);
            
            this.scene.tweens.add({
                targets: glow,
                alpha: { from: 0.8, to: 0 },
                duration: 200,
                ease: 'Power2',
                onComplete: () => glow.destroy()
            });
        });
        
        // 텍스트 메시지
        const textMessages = {
            1: { text: 'SINGLE', color: '#00f5ff', size: 36 },
            2: { text: 'DOUBLE', color: '#ff6b9d', size: 40 },
            3: { text: 'TRIPLE', color: '#ffd700', size: 44 },
            4: { text: 'TETRIS!', color: '#ffd700', size: 48 }
        };
        
        const message = textMessages[count] || textMessages[1];
        const centerX = this.scene.cameras.main.centerX;
        
        const text = this.scene.add.text(
            centerX,
            centerY,
            message.text,
            {
                fontSize: message.size + 'px',
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
                color: message.color,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        text.setOrigin(0.5);
        text.setDepth(1002);
        text.setAlpha(0);
        
        // 텍스트 애니메이션 (간소화)
        this.scene.tweens.add({
            targets: text,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.5, to: 1.0 },
            duration: 150,
            ease: 'Power2'
        });
        
        // 콤보 텍스트 (간소화)
        let comboText = null;
        if (combo > 1) {
            comboText = this.scene.add.text(
                centerX,
                centerY + 60,
                `COMBO x${combo}!`,
                {
                    fontSize: '32px',
                    fontFamily: 'Arial, sans-serif',
                    fontStyle: 'bold',
                    color: '#ff6b9d',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            );
            comboText.setOrigin(0.5);
            comboText.setDepth(1002);
            comboText.setAlpha(0);
            
            this.scene.tweens.add({
                targets: comboText,
                alpha: { from: 0, to: 1 },
                duration: 150,
                delay: 50,
                ease: 'Power2'
            });
            
            this.scene.tweens.add({
                targets: comboText,
                alpha: 0,
                y: centerY + 40,
                duration: 200,
                delay: 350,
                ease: 'Power2',
                onComplete: () => comboText && comboText.destroy()
            });
        }
        
        // 텍스트 사라지는 애니메이션
        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: centerY - 30,
            duration: 200,
            delay: 300,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
        
        // 파티클 효과 (2줄 이상일 때만, 간소화)
        if (count > 1) {
            this.createLineClearParticles(startX, lineCenterY, boardWidth, count);
        }
        
    }
    
    createLineClearParticles(x, y, width, count) {
        // 파티클 수를 대폭 감소하여 성능 개선
        const colors = [0x00f5ff, 0xff6b9d, 0xffd700, 0x32cd32, 0xff1493];
        const color = colors[Math.min(count - 1, colors.length - 1)];
        
        // 간소화된 파티클 효과 (기존 대비 80% 감소)
        const particleCount = Math.min(count * 3, 10); // 최대 10개
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.scene.add.circle(
                x + (width / particleCount) * i + width / (particleCount * 2),
                y,
                3 + Math.random() * 2,
                color,
                1
            );
            
            particle.setDepth(999);
            
            const angle = (Math.random() - 0.5) * Math.PI * 0.6;
            const distance = 30 + Math.random() * 40;
            const targetX = particle.x + Math.cos(angle) * distance;
            const targetY = particle.y + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: { from: 1, to: 0 },
                scale: { from: 1, to: 0 },
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // 보드 다시 그리기 강제
    markBoardDirty() {
        this.boardDirty = true;
        this.lastBoardVersion = -1;
    }
    
    update() {
        this.drawBoard();
        this.drawGhostBlock();
        this.drawCurrentBlock();
        this.drawNextBlock();
        this.drawHoldBlock();
    }
}

// Phaser owns rendering and lifecycle; the engine owns only deterministic game state.
export default class TetrisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisScene' });
        this.soundEnabled = readAudioEnabled();
        this.bestScore = readBestScore();
    }

    create() {
        this.isRunning = true;
        this.helpOpen = false;
        this.softDropping = false;
        this.softDropTimer = 0;
        this.pauseObjects = [];
        this.gameOverObjects = [];
        this.lastHUD = '';
        this.audio = new GameAudio();
        this.gameState = new GameState({ onEvent: event => this.handleGameEvent(event) });
        this.renderer = new TetrisRenderer(this, this.gameState);
        this.setupControls();
        this.onBlur = () => this.setPaused(true);
        this.onVisibility = () => { if (document.hidden) this.setPaused(true); };
        this.onStorage = event => {
            if (event.key === 'tetrisBestScore') {
                this.bestScore = Math.max(this.bestScore, readBestScore());
                this.updateHUD();
            }
        };
        window.addEventListener('blur', this.onBlur);
        window.addEventListener('storage', this.onStorage);
        document.addEventListener('visibilitychange', this.onVisibility);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);
        this.renderer.update();
        this.updateHUD();
        if (document.hidden) this.setPaused(true);
        this.syncAudio();
    }

    shutdown() {
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.events.off(Phaser.Scenes.Events.DESTROY, this.shutdown, this);
        this.isRunning = false;
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
        window.removeEventListener('storage', this.onStorage);
        document.removeEventListener('visibilitychange', this.onVisibility);
        this.audio.destroy();
    }

    handleGameEvent(event) {
        if (event.type === 'lock') this.playSound('drop', 0.4);
        if (event.type === 'clearStart') this.renderer.showLineClearEffect(event.rows, event.count, event.combo);
        if (event.type === 'clearEnd') {
            this.renderer.clearingLines = [];
            this.renderer.markBoardDirty();
            this.playSound('tetris', event.count === 4 ? 0.7 : 0.5);
        }
    }

    syncAudio() {
        this.audio.syncMusic(this.soundEnabled && this.isRunning && !this.gameState.isPaused);
    }

    toggleAudio() {
        this.soundEnabled = !this.soundEnabled;
        savePreference('tetrisAudioEnabled', this.soundEnabled);
        if (!this.soundEnabled) this.audio.pauseAll();
        this.syncAudio();
        this.updateHUD();
        return this.soundEnabled;
    }

    playSound(key, volume = 0.5) {
        if (this.soundEnabled) this.audio.playEffect(key, volume);
    }

    setupControls() {
        const actions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', ArrowDown: 'softDrop', Space: 'hardDrop', KeyC: 'hold', KeyP: 'pause' };
        this.onKeyDown = event => {
            if (this.helpOpen || event.altKey || event.ctrlKey || event.metaKey || event.target?.closest?.('button, input, textarea, select, dialog, [contenteditable="true"]')) return;
            const action = actions[event.code];
            if (!action) return;
            event.preventDefault();
            if (event.repeat && !['left', 'right'].includes(action)) return;
            if (action === 'softDrop') {
                if (!this.gameState.canAct()) return;
                this.softDropping = true;
                this.softDropTimer = 30;
                this.executeAction('softDrop');
            } else this.executeAction(action);
        };
        this.onKeyUp = event => { if (event.code === 'ArrowDown') this.softDropping = false; };
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    executeAction(action) {
        if (!this.isRunning || this.helpOpen) return;
        if (action === 'pause') return this.setPaused(!this.gameState.isPaused);
        if (!this.gameState.canAct()) return;
        this.syncAudio();
        const actions = {
            left: () => this.gameState.moveBlock(-1, 0),
            right: () => this.gameState.moveBlock(1, 0),
            rotate: () => this.gameState.rotateBlock(),
            softDrop: () => this.gameState.softDrop(),
            hardDrop: () => this.gameState.hardDrop(),
            hold: () => this.gameState.hold()
        };
        actions[action]?.();
        this.renderer.update();
        if (this.gameState.isGameOver) this.gameOver();
        this.updateHUD();
    }

    update(time, delta) {
        if (!this.isRunning || this.gameState.isPaused) return;
        if (this.softDropping && this.gameState.canAct()) {
            this.softDropTimer -= delta;
            if (this.softDropTimer <= 0) {
                this.gameState.softDrop();
                this.softDropTimer = 30;
            }
        }
        this.gameState.update(delta, this.softDropping);
        this.renderer.update();
        if (this.gameState.isGameOver) this.gameOver();
        this.updateHUD();
    }

    updateHUD() {
        const state = this.gameState;
        if (state.score > this.bestScore) {
            this.bestScore = Math.max(state.score, readBestScore());
            savePreference('tetrisBestScore', this.bestScore);
        }
        const snapshot = { ready: this.isRunning || state.isGameOver, score: state.score, lines: state.lines,
            combo: state.combo, best: this.bestScore, paused: state.isPaused, gameOver: state.isGameOver,
            audioEnabled: this.soundEnabled, locking: state.isLocking };
        const key = JSON.stringify(snapshot);
        if (key !== this.lastHUD) {
            this.lastHUD = key;
            this.game.events.emit('tetris-state', snapshot);
        }
    }

    setPaused(paused) {
        this.softDropping = false;
        this.softDropTimer = 0;
        if (!this.isRunning || this.gameState.isGameOver || this.gameState.isPaused === paused) return;
        this.gameState.isPaused = paused;
        if (paused) {
            this.tweens.pauseAll();
            this.pauseObjects = this.showOverlay('일시정지', '계속하기 버튼 또는 P 키로 재개', '#00f5ff');
        } else {
            this.pauseObjects.forEach(object => object.destroy());
            this.pauseObjects = [];
            this.tweens.resumeAll();
        }
        this.syncAudio();
        this.updateHUD();
    }

    showOverlay(title, subtitle, color) {
        const { width, height } = this.cameras.main;
        const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(2000);
        const heading = this.add.text(width / 2, height / 2 - 35, title, {
            fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', color, align: 'center'
        }).setOrigin(0.5).setDepth(2001);
        const detail = this.add.text(width / 2, height / 2 + 40, subtitle, {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(2001);
        return [shade, heading, detail];
    }

    gameOver() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.gameState.isGameOver = true;
        this.gameState.isPaused = false;
        this.softDropping = false;
        this.pauseObjects.forEach(object => object.destroy());
        this.pauseObjects = [];
        this.tweens.resumeAll();
        this.syncAudio();
        this.playSound('game_over', 0.7);
        this.gameOverObjects = this.showOverlay('GAME OVER', `최종 점수: ${this.gameState.score.toLocaleString()}\n새 게임 버튼으로 다시 시작`, '#ff6b9d');
        this.updateHUD();
    }

    newGame() {
        this.isRunning = false;
        this.game.events.emit('tetris-state', { ready: false, audioEnabled: this.soundEnabled, best: this.bestScore });
        // Phaser shutdown disposes all old displays, tweens, input handlers and audio.
        this.scene.restart();
    }
}
