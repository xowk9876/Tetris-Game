import test from 'node:test';
import assert from 'node:assert/strict';
import { BlockBag, Board, Tetromino, GameState } from '../src/utils/gameEngine.js';

const game = () => new GameState({ random: () => 0.5 });
function prepareClear(state, rows = [19]) {
  state.currentBlock = new Tetromino('I');
  state.currentBlock.rotation = 1;
  state.currentBlock.x = 2;
  state.currentBlock.y = 16;
  for (const row of rows) { state.board.grid[row].fill(1); state.board.grid[row][4] = 0; }
}
for (const rows of [[19], [18,19], [17,18,19], [16,17,18,19], [4,12,19]]) {
  test(`clears rows ${rows} together without deleting survivors`, () => {
    const board = new Board(10,20);
    board.grid[2][0] = 77;
    rows.forEach(row => board.grid[row].fill(1));
    const result = board.clearLines();
    assert.equal(result.count, rows.length);
    assert.equal(board.getLinesToClear().count, 0);
    assert.equal(board.grid[2+rows.length][0], 77);
    assert.equal(board.grid.length, 20);
    assert.equal(board.version, 1);
    board.grid[0][0] = 5;
    if (rows.length > 1) assert.equal(board.grid[1][0], 0);
  });
}
test('empty board clear leaves version unchanged', () => { const b = new Board(10,20); assert.equal(b.clearLines().count,0); assert.equal(b.version,0); });
test('7-bag contains every piece once in each bag, including after peek', () => {
  const bag = new BlockBag();
  const first = bag.peek(14);
  assert.deepEqual(Array.from({length:14},()=>bag.getNext()),first);
  for (let i=0;i<100;i++) assert.equal(new Set(Array.from({length:7},()=>bag.getNext())).size,7);
});
test('Fisher-Yates uses one independent selection per shrinking range', () => {
  let calls=0; const bag=new BlockBag(()=>{calls++;return 0;});
  assert.equal(calls,6);
  assert.deepEqual(bag.peek(7),['O','T','L','J','S','Z','I']);
});
test('pieces collide with walls, floor and the pile', () => {
  const b=new Board(10,20),p=new Tetromino('O');
  assert.equal(b.isValidPosition(p,-1,0),false);
  assert.equal(b.isValidPosition(p,9,0),false);
  assert.equal(b.isValidPosition(p,4,19),false);
  b.grid[3][4]=1; assert.equal(b.isValidPosition(p,4,2),false);
});
for (const stored of [true,false]) test(`blocked hold ends game (${stored ? 'swap' : 'first hold'}) without overwriting pile`,()=>{
  const g=game();g.currentBlock.y=10;g.holdBlock=stored?new Tetromino('O'):null;g.nextBlock=new Tetromino('O');g.board.grid[0][4]=99;
  assert.equal(g.hold(),true);assert.equal(g.isGameOver,true);assert.equal(g.currentBlock,null);
  g.hardDrop();assert.equal(g.board.grid[0][4],99);
});
test('hold allowed once per piece; swapping restores spawn rotation and gravity timer',()=>{
  const g=game(),first=g.currentBlock.type;g.currentBlock.rotate();g.currentBlock.y=8;g.fallTimer=799;
  assert.equal(g.hold(),true);assert.equal(g.holdBlock.type,first);assert.equal(g.hold(),false);assert.equal(g.fallTimer,0);
  g.hardDrop();assert.equal(g.hold(),true);assert.equal(g.currentBlock.type,first);assert.equal(g.currentBlock.rotation,0);assert.equal(g.currentBlock.y,0);
});
test('spawn collision ends the game immediately',()=>{const g=game();g.board.grid[0].fill(1);g.board.grid[1].fill(1);g.spawnNextBlock();assert.equal(g.isGameOver,true);});
for (const count of [1,2,3,4]) test(`line-clear delay awards ${count}-line score once`,()=>{
  const events=[],g=new GameState({onEvent:e=>events.push(e)});prepareClear(g,Array.from({length:count},(_,i)=>19-i));
  g.hardDrop();assert.equal(g.isLocking,true);assert.equal(g.currentBlock,null);assert.equal(g.lines,0);
  g.update(299);assert.equal(g.lines,0);g.update(1);
  assert.equal(g.lines,count);assert.equal(g.score,[0,40,100,300,1200][count]);assert.equal(g.isLocking,false);
  g.update(1);assert.equal(events.filter(e=>e.type==='clearEnd').length,1);
});
test('reset during line clear discards all previous pending work',()=>{
  const g=game();prepareClear(g);g.hardDrop();assert.equal(g.isLocking,true);g.reset();const p=g.currentBlock;
  g.update(300);assert.equal(g.currentBlock,p);assert.equal(g.score,0);assert.equal(g.lines,0);assert.equal(g.board.grid.flat().filter(Boolean).length,0);
});
test('pause freezes both gravity and line-clear delay',()=>{
  const g=game();prepareClear(g);g.hardDrop();g.isPaused=true;g.update(5000);assert.equal(g.clearTimer,300);
  g.isPaused=false;g.update(300);assert.equal(g.lines,1);g.isPaused=true;const y=g.currentBlock.y;g.update(5000);assert.equal(g.currentBlock.y,y);
});
for (const flag of ['isPaused','isGameOver','isLocking']) test(`${flag} rejects every gameplay input`,()=>{
  const g=game();g[flag]=true;const before=JSON.stringify(g);
  g.moveBlock(1,0);g.rotateBlock();g.hold();g.hardDrop();g.softDrop();g.lockBlock();assert.equal(JSON.stringify(g),before);
});
test('hard drop agrees with ghost landing and starts a fresh fall timer',()=>{
  const g=game();const p=g.currentBlock;const y=g.board.getGhostY(p,p.x,p.y);g.fallTimer=799;
  assert.equal(g.hardDrop(),y);assert.equal(g.board.grid.flat().filter(Boolean).length,4);const next=g.currentBlock;g.update(1);assert.equal(next.y,0);
});
test('invalid deltas do not poison gravity',()=>{const g=game();for(const d of [NaN,Infinity,-1])g.update(d);assert.equal(g.fallTimer,0);g.update(800);assert.equal(g.currentBlock.y,1);});
test('combo and back-to-back scores preserve existing rules',()=>{
  const g=game();g.handleLineClear(4);g.handleLineClear(4);assert.equal(g.score,1200+1875);assert.equal(g.combo,2);
  g.handleLineClear(1);assert.equal(g.backToBack,false);assert.equal(g.score,3215);assert.equal(g.maxCombo,3);
  g.hardDrop();assert.equal(g.combo,0);
});
test('T floor kick moves up and left from spawn rotation',()=>{
  const g=game();g.currentBlock=new Tetromino('T');g.currentBlock.x=4;g.currentBlock.y=18;
  assert.equal(g.rotateBlock(),true);assert.deepEqual([g.currentBlock.x,g.currentBlock.y,g.currentBlock.rotation],[3,17,1]);
});
test('I floor kick uses its separate two-cell correction',()=>{
  const g=game();g.currentBlock=new Tetromino('I');g.currentBlock.x=3;g.currentBlock.y=18;
  assert.equal(g.rotateBlock(),true);assert.deepEqual([g.currentBlock.x,g.currentBlock.y,g.currentBlock.rotation],[4,16,1]);
});
test('clockwise wall kicks work at both walls',()=>{
  for(const [rotation,x,expected] of [[1,-1,0],[3,8,7]]){
    const g=game();g.currentBlock=new Tetromino('T');g.currentBlock.rotation=rotation;g.currentBlock.x=x;g.currentBlock.y=5;
    assert.equal(g.rotateBlock(),true);assert.equal(g.currentBlock.x,expected);assert.equal(g.board.isValidPosition(g.currentBlock,g.currentBlock.x,g.currentBlock.y),true);
  }
});
test('blocked rotation restores original piece exactly',()=>{
  const g=game(),p=new Tetromino('T');p.x=4;p.y=5;g.currentBlock=p;
  g.board.grid.forEach(row=>row.fill(1));p.getShape().forEach((row,y)=>row.forEach((cell,x)=>{if(cell)g.board.grid[p.y+y][p.x+x]=0;}));
  const before=JSON.stringify(p);assert.equal(g.rotateBlock(),false);assert.equal(JSON.stringify(p),before);
});
test('four rotations return every piece to its original shape on an open board',()=>{
  for(const type of ['I','O','T','L','J','S','Z']){const g=game();g.currentBlock=new Tetromino(type);g.currentBlock.y=6;const before=JSON.stringify(g.currentBlock);for(let i=0;i<4;i++)assert.equal(g.rotateBlock(),true);assert.equal(JSON.stringify(g.currentBlock),before);}
});
test('seeded games keep every active piece valid and never mutate paused/terminal boards',()=>{
  let seed=19273;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const g=new GameState({random});
  for(let i=0;i<12000;i++){
    if(g.isGameOver)g.reset();
    switch(Math.floor(random()*7)){
      case 0:g.moveBlock(-1,0);break;case 1:g.moveBlock(1,0);break;case 2:g.rotateBlock();break;
      case 3:g.hold();break;case 4:g.hardDrop();break;case 5:g.softDrop();break;default:g.update(300);
    }
    assert.equal(g.board.grid.length,20);
    assert.ok(g.board.grid.every(row=>row.length===10));
    if(g.currentBlock)assert.ok(g.board.isValidPosition(g.currentBlock,g.currentBlock.x,g.currentBlock.y));
    if(g.isLocking)assert.equal(g.currentBlock,null);
  }
});
