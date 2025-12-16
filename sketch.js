let spriteSheet;
let walkSpriteSheet;
let runSpriteSheet;
let jumpSpriteSheet;
let shootSpriteSheet;
let projectileSpriteSheet;
// NPC 相關圖片
let npcSpriteSheet1; 
let npcSpriteSheet2; 
let npcSpriteSheet3; 
let helperSpriteSheet;
// 背景圖片
let backgroundImage;

// ===================================
// 背景滾動系統變數
// ===================================
let backgroundOffsetX = 0; // 背景的水平偏移量
let backgroundImageWidth = 0; // 背景圖片的寬度（會在 preload 後設定）

// 爆炸效果與勝利判定
let explosions = []; // 每個爆炸: {x,y,timer,duration,maxRadius}
let gameWon = false;

let shootFrameWidth;
let shootFrameHeight;
let projFrameWidth;
let projFrameHeight;
let frameWidth;
let frameHeight;
let walkFrameWidth;
let walkFrameHeight;
let runFrameWidth;
let runFrameHeight;
let jumpFrameWidth;
let jumpFrameHeight;
let currentFrame = 0;
let frameCount = 0;
let animationSpeed = 10; // 控制播放速度，值越小越快
let isWalking = false;
let isRunning = false;
let isJumping = false;
let shiftPressed = false;
let isFinishingRun = false; // 標記是否在完成跑步動畫
let isFinishingJump = false; // 標記是否在完成跳躍動畫
let isShooting = false;
let shootCurrentFrame = 0;
let shootFrameTimer = 0;
let shootFrameSpeed = 6;
let walkDirection = 1; // 1 = 向右, -1 = 向左
let characterDirection = 1; // 1 = 向右, -1 = 向左（持續方向）
let characterScale = 2; // 角色放大倍數
let characterX = 0; // 角色 X 位置
let characterY = 0; // 角色 Y 位置
let moveSpeed = 5; // 走路速度
let runSpeed = 8; // 跑步速度

// 子彈系統
let bullets = []; // 每個子彈: {stage:'attach'|'fly', dir, frameIndex, timer, x, y, vx}
let bulletAnimSpeed = 8;
let bulletSpeed = 12;
let lastFireTime = 0;
let fireRate = 160; // ms, 按住空白時的持續開火速率

// ===================================
// 新增：NPC/問答 系統變數
// ===================================
let npcs = []; // 儲存提問者 NPC
let helperNPC; // 提示者 NPC
let currentQuestion = null; // 儲存當前顯示的問題
let interactionDistance = 150; // 玩家與 NPC 互動的距離
let quizActive = false; // 標記問答介面是否開啟，開啟時鎖定角色移動

// 題庫結構 (保持不變)
const quizBank = [
  { id: 1, npcNmae: '提問者1', question: "Q1: 什麼是光合作用？", answer: "A", options: ["A. 植物利用光能製造養分", "B. 動物吸入氧氣", "C. 水的循環"], hint: "這跟植物的食物製造有關。" },
  { id: 2, npcNmae: '提問者1', question: "Q2: 太陽系的中心是什麼？", answer: "B", options: ["A. 地球", "B. 太陽", "C. 月亮"], hint: "它提供光和熱給所有行星。" },
  { id: 3, npcNmae: '提問者2', question: "Q1: 台北101有多少樓？", answer: "A", options: ["A. 101層", "B. 90層", "C. 105層"], hint: "名字本身就包含了答案！" },
  { id: 4, npcNmae: '提問者2', question: "Q2: 哪個是台灣的國花？", answer: "C", options: ["A. 玫瑰", "B. 櫻花", "C. 梅花"], hint: "在寒冷的冬天依然綻放。" },
  { id: 5, npcNmae: '提問者3', question: "Q1: 程式碼中 `let` 的用途是什麼？", answer: "A", options: ["A. 宣告區塊作用域變數", "B. 宣告常數", "C. 宣告全域變數"], hint: "它是 ES6 後常用的變數宣告方式。" },
  { id: 6, npcNmae: '提問者3', question: "Q2: P5.js 中 `draw()` 函式的執行頻率？", answer: "B", options: ["A. 只執行一次", "B. 每秒約 60 次", "C. 只有事件發生時"], hint: "這是動畫能夠連續播放的關鍵。" }
];

let npcQuizzes = {
    '提問者1': [1, 2],
    '提問者2': [3, 4],
    '提問者3': [5, 6]
};

// ===================================
// NPC 類別 (保持不變)
// ===================================
class NPC {
  constructor(name, x, y, sprite, frameCount, frameW, frameH, isInterrogator = true) {
    this.name = name;
    this.worldX = x;  // 世界坐標
    this.worldY = y;  // 世界坐標
    this.sprite = sprite;
    this.frameCount = frameCount;
    this.frameW = frameW;
    this.frameH = frameH;
    this.isInterrogator = isInterrogator;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.animationSpeed = 15;
    this.scale = characterScale;
  }

  display() {
    let displayWidth = this.frameW * this.scale;
    let displayHeight = this.frameH * this.scale;
    // 根據背景偏移量計算屏幕坐標
    let screenX = this.worldX + backgroundOffsetX;
    let drawX = screenX - displayWidth / 2;
    let drawY = this.worldY - displayHeight / 2;

    let sx = (floor(this.currentFrame) % this.frameCount) * this.frameW;
    image(this.sprite, drawX, drawY, displayWidth, displayHeight, sx, 0, this.frameW, this.frameH);

    fill(0);
    textSize(18);
    textAlign(CENTER);
    text(this.name, screenX, drawY - 10);
  }

  update() {
    this.frameTimer++;
    if (this.frameTimer >= this.animationSpeed) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1);
    }
  }

  checkInteraction(playerX, playerY) {
    // 將玩家的屏幕坐標轉換為世界坐標
    let playerWorldX = playerX - backgroundOffsetX;
    let d = dist(playerWorldX, playerY, this.worldX, this.worldY);
    return d < interactionDistance;
  }
}

function preload() {
  spriteSheet = loadImage('攻擊鋼彈/不動.png');
  walkSpriteSheet = loadImage('攻擊鋼彈/走.png');
  runSpriteSheet = loadImage('攻擊鋼彈/跑.png');
  jumpSpriteSheet = loadImage('攻擊鋼彈/跳.png');
  shootSpriteSheet = loadImage('攻擊鋼彈/射.png');
  projectileSpriteSheet = loadImage('攻擊鋼彈/彈.png');

  // ===================================
  // 圖片載入修改：使用專屬 NPC 圖片名稱
  // ===================================
  npcSpriteSheet1 = loadImage('攻擊鋼彈/提問者1.png'); 
  npcSpriteSheet2 = loadImage('攻擊鋼彈/提問者2.png'); 
  npcSpriteSheet3 = loadImage('攻擊鋼彈/提問者3.png'); 
  helperSpriteSheet = loadImage('攻擊鋼彈/提示博士.png');
  
  // 加載背景圖片
  backgroundImage = loadImage('背景/origbig.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 不動：6 個圖像排成一排
  frameWidth = spriteSheet.width / 6;
  frameHeight = spriteSheet.height;
  // 走：12 個圖像排成一排
  walkFrameWidth = walkSpriteSheet.width / 12;
  walkFrameHeight = walkSpriteSheet.height;
  // 跑：10 個圖像排成一排
  runFrameWidth = runSpriteSheet.width / 10;
  runFrameHeight = runSpriteSheet.height;
  // 跳：15 個圖像排成一排
  jumpFrameWidth = jumpSpriteSheet.width / 15;
  jumpFrameHeight = jumpSpriteSheet.height;
  // 射：5 個圖像排成一排
  shootFrameWidth = shootSpriteSheet.width / 5;
  shootFrameHeight = shootSpriteSheet.height;
  // 彈：4 個圖像排成一排
  projFrameWidth = projectileSpriteSheet.width / 4;
  projFrameHeight = projectileSpriteSheet.height;
  
  // 背景寬度
  backgroundImageWidth = backgroundImage.width;
  
  // 初始化角色位置為螢幕中心（固定在中心）
  characterX = windowWidth / 2;
  characterY = windowHeight / 2;

  // 計算每個 NPC 的幀寬度
  // 提問者1：8張圖，總寬483
  let npc1FrameW = npcSpriteSheet1.width / 8;
  let npc1FrameH = npcSpriteSheet1.height;
  
  // 提問者2：8張圖，總寬475
  let npc2FrameW = npcSpriteSheet2.width / 8;
  let npc2FrameH = npcSpriteSheet2.height;
  
  // 提問者3：3張圖，總寬135
  let npc3FrameW = npcSpriteSheet3.width / 3;
  let npc3FrameH = npcSpriteSheet3.height;
  
  // 提示博士：3張圖，總寬381
  let helperFrameW = helperSpriteSheet.width / 3;
  let helperFrameH = helperSpriteSheet.height;

  // 提問者 NPC（使用世界坐標）
  npcs.push(new NPC('提問者1', 300, windowHeight * 0.75, npcSpriteSheet1, 8, npc1FrameW, npc1FrameH));
  npcs.push(new NPC('提問者2', 1200, windowHeight * 0.75, npcSpriteSheet2, 8, npc2FrameW, npc2FrameH));
  npcs.push(new NPC('提問者3', 2100, windowHeight * 0.75, npcSpriteSheet3, 3, npc3FrameW, npc3FrameH));
  
  // 提示者 NPC (放在畫面左上角 - 屏幕坐標)
  helperNPC = new NPC('提示博士', 150, 150, helperSpriteSheet, 3, helperFrameW, helperFrameH, false);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  
  // ===================================
  // 繪製無縫滾動背景（三張圖片）
  // ===================================
  let bgY = windowHeight - backgroundImage.height;
  // 左邊的背景
  image(backgroundImage, backgroundOffsetX - backgroundImageWidth, bgY);
  // 中間的背景
  image(backgroundImage, backgroundOffsetX, bgY);
  // 右邊的背景
  image(backgroundImage, backgroundOffsetX + backgroundImageWidth, bgY);
  
  // NPC 繪製與互動更新
  let nearNPC = null;
  for (let npc of npcs) {
    if (npc.removed) continue; // 跳過已消失的 NPC
    npc.update();
    npc.display();
    if (npc.checkInteraction(characterX, characterY) && npcQuizzes[npc.name].length > 0) {
        nearNPC = npc;
    }
  }
  
  // 讓提示博士固定在畫面左上角並跟著移動（以螢幕座標表示）
  let helperScreenX = 120; // 左上角偏移 X（右移一點）
  let helperScreenY = 120; // 左上角偏移 Y（下移一點）
  // 將螢幕座標轉成世界座標儲存在 helperNPC.worldX/worldY
  helperNPC.worldX = helperScreenX - backgroundOffsetX;
  helperNPC.worldY = helperScreenY;
  helperNPC.update();
  helperNPC.display();

  // 根據按下的鍵更新背景位置 (問答介面開啟時鎖定移動)
  if (!quizActive) {
    let currentSpeed = isRunning ? runSpeed : moveSpeed;
    if (keyIsDown(LEFT_ARROW)) {
      backgroundOffsetX += currentSpeed; // 向左走，背景向右移動
      isWalking = true;
      walkDirection = -1;
      characterDirection = walkDirection;
      currentFrame = 0;
      frameCount = 0;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      backgroundOffsetX -= currentSpeed; // 向右走，背景向左移動
      isWalking = true;
      walkDirection = 1;
      characterDirection = walkDirection;
      currentFrame = 0;
      frameCount = 0;
    }
    if (keyIsDown(UP_ARROW)) {
      characterY -= currentSpeed;
      isJumping = true;
      currentFrame = 0;
      frameCount = 0;
    }
    if (keyIsDown(DOWN_ARROW)) {
      characterY += currentSpeed;
      isJumping = true;
      currentFrame = 0;
      frameCount = 0;
    }
    
    // 按住空白時自動連發 (fireRate)
    if (keyIsDown(32)) {
      let now = millis();
      if (now - lastFireTime >= fireRate) {
        spawnBullet();
        lastFireTime = now;
        // 觸發射擊動畫
        isShooting = true;
        shootCurrentFrame = 0;
        shootFrameTimer = 0;
      }
    }
  } else {
    // 鎖定狀態時，停止走路/跑步動畫
    isWalking = false;
    isRunning = false;
    isFinishingRun = false;
    isJumping = false;
    isFinishingJump = false;
    currentFrame = 0;
  }
  
  // 計算顯示尺寸
  let displayWidth = frameWidth * characterScale;
  let displayHeight = frameHeight * characterScale;
  
  // 根據角色位置計算繪製位置（中心點對齐）
  let drawX = characterX - displayWidth / 2;
  let drawY = characterY - displayHeight / 2;
  
  // 保存畫布狀態
  push();
  
  // 根據方向進行水平翻轉
  if (characterDirection === -1) {
    translate(drawX + displayWidth / 2, drawY);
    scale(-1, 1);
    translate(-displayWidth / 2, 0);
  } else {
    translate(drawX, drawY);
  }
  
  // 顯示當前幀 (射擊優先)
  let sx, srcWidth, srcHeight;
  if (isShooting) {
    // 射擊動畫：5 幀
    sx = shootCurrentFrame * shootFrameWidth;
    srcWidth = shootFrameWidth;
    srcHeight = shootFrameHeight;
    image(shootSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, shootFrameWidth, shootFrameHeight);
  } else if (isJumping || isFinishingJump) {
    // 跳躍動畫邏輯 (不變)
    let jumpFrame = currentFrame;
    if (!isFinishingJump) {
      if (currentFrame < 9) {
        jumpFrame = currentFrame;
      } else {
        jumpFrame = 5 + ((currentFrame - 9) % 4);
      }
    } else {
      jumpFrame = 9 + currentFrame;
    }
    sx = jumpFrame * jumpFrameWidth;
    srcWidth = jumpFrameWidth;
    srcHeight = jumpFrameHeight;
    image(jumpSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, jumpFrameWidth, jumpFrameHeight);
  } else if (isRunning || isFinishingRun) {
    // 跑步動畫邏輯 (不變)
    let runFrame = currentFrame;
    if (shiftPressed) {
      if (currentFrame < 5) {
        runFrame = currentFrame;
      } else {
        runFrame = 3 + ((currentFrame - 5) % 2);
      }
    } else {
      runFrame = 5 + currentFrame;
    }
    sx = runFrame * runFrameWidth;
    srcWidth = runFrameWidth;
    srcHeight = runFrameHeight;
    image(runSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, runFrameWidth, runFrameHeight);
  } else if (isWalking) {
    sx = currentFrame * walkFrameWidth;
    srcWidth = walkFrameWidth;
    srcHeight = walkFrameHeight;
    image(walkSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, walkFrameWidth, walkFrameHeight);
  } else {
    sx = currentFrame * frameWidth;
    srcWidth = frameWidth;
    srcHeight = frameHeight;
    image(spriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, frameWidth, frameHeight);
  }
  
  // 恢復畫布狀態
  pop();
  
  // ------------------ 子彈更新與繪製 ------------------ (不變)
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];

    b.timer++;
    if (b.stage === 'attach') {
      if (b.timer >= bulletAnimSpeed) {
        b.timer = 0;
        b.frameIndex++;
        if (b.frameIndex > 2) {
          b.stage = 'fly';
          b.frameIndex = 3;
          b.vx = b.dir * bulletSpeed;
          let attachOffset = displayWidth * 0.45 * b.dir;
          b.x = characterX + attachOffset;
        }
      }
    } else if (b.stage === 'fly') {
      b.x += b.vx;
    }

    let bulletDisplayW = projFrameWidth * characterScale;
    let bulletDisplayH = projFrameHeight * characterScale;
    let bx, by;
    if (b.stage === 'attach') {
      let attachOffset = displayWidth * 0.45 * b.dir;
      bx = characterX + attachOffset;
      by = characterY - bulletDisplayH / 2;
    } else {
      bx = b.x;
      by = characterY - bulletDisplayH / 2;
    }

    push();
    if (b.dir === -1) {
      translate(bx + bulletDisplayW / 2, by);
      scale(-1, 1);
      translate(-bulletDisplayW / 2, 0);
      image(projectileSpriteSheet, 0, 0, bulletDisplayW, bulletDisplayH, b.frameIndex * projFrameWidth, 0, projFrameWidth, projFrameHeight);
    } else {
      translate(bx, by);
      image(projectileSpriteSheet, 0, 0, bulletDisplayW, bulletDisplayH, b.frameIndex * projFrameWidth, 0, projFrameWidth, projFrameHeight);
    }
    pop();

    if (b.stage === 'fly') {
      if (b.x > width + 200 || b.x < -200) {
        bullets.splice(i, 1);
      }
    }
  }

  // ------------------ 射擊動畫更新 ------------------ (不變)
  if (isShooting) {
    shootFrameTimer++;
    if (shootFrameTimer >= shootFrameSpeed) {
      shootFrameTimer = 0;
      shootCurrentFrame++;
      if (shootCurrentFrame >= 5) {
        isShooting = false;
        shootCurrentFrame = 0;
      }
    }
  }
  
  // 更新幀計數
  frameLoopUpdate();
  
  // 更新與繪製爆炸效果
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.timer++;
    let t = e.timer / e.duration;
    let r = e.maxRadius * t;
    push();
    translate(e.x, e.y);
    noStroke();
    fill(255, 200, 0, 200 * (1 - t));
    ellipse(0, 0, r * 2);
    fill(255, 120, 0, 200 * (1 - t));
    ellipse(0, 0, r);
    pop();
    if (e.timer >= e.duration) {
      explosions.splice(i, 1);
    }
  }

  // 問題介面顯示
  displayQuizInterface(nearNPC);

  // 若通關，顯示大字恭喜
  if (gameWon) {
    push();
    fill(255, 220, 0);
    stroke(0);
    strokeWeight(6);
    textAlign(CENTER, CENTER);
    textSize(96);
    text("恭喜通關", width / 2, height / 2);
    pop();
  }
}

// 獨立出來的動畫更新函式 (不變)
function frameLoopUpdate() {
  frameCount++;
  let currentAnimationSpeed = animationSpeed;
  
  if (isFinishingRun) {
    currentAnimationSpeed = animationSpeed + 5;
  } else if (isFinishingJump) {
    currentAnimationSpeed = animationSpeed - 3;
  }
  
  if (frameCount >= currentAnimationSpeed) {
    frameCount = 0;
    if (isFinishingJump) {
      currentFrame++;
      if (currentFrame >= 6) {
        isFinishingJump = false;
        isJumping = false;
        currentFrame = 0;
      }
    } else if (isJumping) {
      if (currentFrame < 8) {
        currentFrame++;
      } else {
        currentFrame++;
      }
    } else if (isFinishingRun) {
      currentFrame++;
      if (currentFrame >= 5) {
        isFinishingRun = false;
        isRunning = false;
        currentFrame = 0;
      }
    } else if (isRunning) {
      if (shiftPressed) {
        if (currentFrame < 4) {
          currentFrame++;
        } else {
          currentFrame++;
        }
      } else {
        currentFrame++;
      }
    } else if (isWalking) {
      currentFrame = (currentFrame + 1) % 12;
    } else {
      currentFrame = (currentFrame + 1) % 6;
    }
  }
}

// 問題介面函式 (不變)
function displayQuizInterface(nearNPC) {
    if (currentQuestion) {
        fill(255, 255, 200, 240);
        rect(50, height - 250, width - 100, 200, 15);
        
        fill(0);
        textSize(24);
        textAlign(LEFT, TOP);
        
        text(`[${currentQuestion.npcNmae}] 請回答：`, 70, height - 230);
        
        textSize(20);
        text(currentQuestion.question, 70, height - 200);
        
        textSize(18);
        text(currentQuestion.options[0], 70, height - 160);
        text(currentQuestion.options[1], 70, height - 130);
        text(currentQuestion.options[2], 70, height - 100);
        
        textSize(16);
        fill(100);
        textAlign(RIGHT, BOTTOM);
        text("提示：按下 'H' 尋求提示博士幫助 | 答題：按下 'A', 'B', 'C' ", width - 70, height - 60);

    } else if (nearNPC) {
        let screenX = nearNPC.worldX + backgroundOffsetX;
        let screenY = nearNPC.worldY;
        fill(0, 150);
        rect(screenX - 100, screenY - 100, 200, 30, 5);
        fill(255);
        textAlign(CENTER);
        textSize(16);
        text(`按下 'E' 提問`, screenX, screenY - 80);
    }
}

// 處理玩家答題 (不變)
function checkAnswer(playerAnswer) {
    if (currentQuestion && quizActive) {
        quizActive = false;
        let resultMessage;
        
        if (playerAnswer === currentQuestion.answer) {
          resultMessage = "✅ 恭喜你，答對了！";

          let npcName = currentQuestion.npcNmae;
          let questionId = currentQuestion.id;
          let index = npcQuizzes[npcName].indexOf(questionId);
          if (index > -1) {
            npcQuizzes[npcName].splice(index, 1);
          }

          // 如果該 NPC 的題庫已清空，觸發爆炸並標記為已消失
          if (npcQuizzes[npcName].length === 0) {
            let targetNpc = npcs.find(n => n.name === npcName);
            if (targetNpc) {
              targetNpc.removed = true;
              // 在螢幕座標生成爆炸
              let ex = targetNpc.worldX + backgroundOffsetX;
              let ey = targetNpc.worldY;
              explosions.push({ x: ex, y: ey, timer: 0, duration: 60, maxRadius: 140 });
            }

            // 判斷是否所有提問者都已消失（通關）
            let remaining = npcs.filter(n => n.isInterrogator && !n.removed).length;
            if (remaining === 0) {
              gameWon = true;
            }
          }
        } else {
          resultMessage = `❌ 答錯了，正確答案是 ${currentQuestion.answer}。`;
        }

        currentQuestion = null;
        alert(resultMessage);
    }
}


function keyPressed() {
  // 檢查是否正在進行問答，如果是，只處理問答相關按鍵 (不變)
  if (quizActive) {
    if (key === 'a' || key === 'A') {
        checkAnswer('A');
    } else if (key === 'b' || key === 'B') {
        checkAnswer('B');
    } else if (key === 'c' || key === 'C') {
        checkAnswer('C');
    } else if (key === 'h' || key === 'H') {
        if (currentQuestion) {
            alert(`💡 提示博士（在畫面左上角）說：${currentQuestion.hint}`);
        }
    }
    return false;
  }

  // 非問答狀態下的移動/互動/射擊邏輯
  // 左右箭頭：觸發走路動畫（背景在 draw() 中移動）
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    isWalking = true;
    walkDirection = keyCode === RIGHT_ARROW ? 1 : -1;
    characterDirection = walkDirection;
    currentFrame = 0;
    frameCount = 0;
    return false;
  }
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    isJumping = true;
    currentFrame = 0;
    frameCount = 0;
    return false;
  }
  if (keyCode === SHIFT) {
    if (isWalking) {
      isRunning = true;
      shiftPressed = true;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
  if (key === ' ' || keyCode === 32) {
    spawnBullet();
    isShooting = true;
    shootCurrentFrame = 0;
    shootFrameTimer = 0;
    return false;
  }
  
  // 玩家接近 NPC 時按 'E' 提問
  if (key === 'e' || key === 'E') {
      if (!currentQuestion) {
          for (let npc of npcs) {
              if (npc.checkInteraction(characterX, characterY) && npcQuizzes[npc.name].length > 0) {
                  let quizIDs = npcQuizzes[npc.name];
                  let randomID = random(quizIDs);
                  currentQuestion = quizBank.find(q => q.id === randomID);
                  quizActive = true;
                  return false;
              }
          }
      }
  }
}

function spawnBullet() {
  // ... (不變)
  let b = {
    stage: 'attach',
    dir: characterDirection,
    frameIndex: 0,
    timer: 0,
    x: 0,
    y: 0,
    vx: 0
  };
  bullets.push(b);
}

function keyReleased() {
  // 左右箭頭：停止走路動畫
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    if (isRunning || isFinishingRun) {
      isWalking = false;
      if (!isFinishingRun) {
        isFinishingRun = true;
        isRunning = false;
        currentFrame = 0;
        frameCount = 0;
      }
    } else {
      isWalking = false;
      isRunning = false;
      isFinishingRun = false;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    if (isJumping) {
      isFinishingJump = true;
      isJumping = false;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
  if (keyCode === SHIFT) {
    shiftPressed = false;
    if (isRunning) {
      isFinishingRun = true;
      isRunning = false;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
}