import * as Matter from 'matter-js';

const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Events = Matter.Events;
const Body = Matter.Body;

// Slot Machine class - Realistic Spinning Animation
class SlotMachine {
    constructor() {
        this.symbols = ['🏆', '🍉', '🍑', '🍇', '🍊', '🍒'];
        this.canvas = document.getElementById('slotMachineCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.currentSymbolIndex = 0;
        this.isSpinning = false;
        this.spinDuration = 3.0; // 3 seconds
        this.spinElapsed = 0;
        this.selectedIndex = 0;
        this.bounceAmount = 0;
    }

    spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.spinElapsed = 0;
        this.selectedIndex = Math.floor(Math.random() * this.symbols.length);
    }

    update(deltaTime) {
        if (!this.isSpinning) return;

        this.spinElapsed += deltaTime;
        const progress = this.spinElapsed / this.spinDuration;
        
        if (this.spinElapsed >= this.spinDuration) {
            // Spin finished
            this.currentSymbolIndex = this.selectedIndex;
            this.isSpinning = false;
            this.spinElapsed = 0;
            this.bounceAmount = 0;
        } else {
            // Spinning phase with easing
            if (progress < 0.7) {
                // Fast spinning phase (0-70%)
                const spinSpeed = 15 * (1 - progress * 0.5); // Slow down gradually
                this.currentSymbolIndex = Math.floor((this.spinElapsed * 60 * spinSpeed) % this.symbols.length);
            } else if (progress < 0.9) {
                // Slowing down phase (70-90%)
                const slowProgress = (progress - 0.7) / 0.2;
                const cycleIndex = Math.floor(this.selectedIndex + slowProgress * 2) % this.symbols.length;
                this.currentSymbolIndex = cycleIndex;
            } else {
                // Landing phase with bounce (90-100%)
                const bounceProgress = (progress - 0.9) / 0.1;
                this.currentSymbolIndex = this.selectedIndex;
                // Bounce animation
                const bounceValue = Math.sin(bounceProgress * Math.PI * 3) * (1 - bounceProgress) * 15;
                this.bounceAmount = bounceValue;
            }
        }
    }

    draw() {
        // Draw background
        this.ctx.fillStyle = 'rgba(20, 10, 30, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw single symbol box
        const boxSize = 120;
        const x = (this.canvas.width - boxSize) / 2;
        const y = (this.canvas.height - boxSize) / 2 + this.bounceAmount;

        // Box background with glow when spinning
        if (this.isSpinning) {
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fillStyle = 'rgba(40, 20, 60, 0.8)';
        this.ctx.fillRect(x, y, boxSize, boxSize);

        // Box border
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = this.isSpinning ? '#ffff00' : '#ffff00';
        this.ctx.lineWidth = this.isSpinning ? 4 : 3;
        this.ctx.strokeRect(x, y, boxSize, boxSize);

        // Draw symbol with scale animation
        this.ctx.save();
        const scale = this.isSpinning ? 1.0 : 1.0 + Math.sin(this.spinElapsed) * 0.05;
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 + this.bounceAmount);
        this.ctx.scale(scale, scale);
        
        this.ctx.font = 'bold 80px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(this.symbols[this.currentSymbolIndex], 0, 0);
        
        this.ctx.restore();
    }

    getResult() {
        return this.symbols[this.selectedIndex];
    }
}

export class PlinkoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.engine = Engine.create();
        this.engine.gravity.y = 1.8;

        this.helperEnabled = false;
        this.mouseX = 0;
        this.mouseY = 0;

        // Slot machine instance
        this.slotMachine = new SlotMachine();

        // Swaying bars properties
        this.swayBars = [];   // Array to hold all swaying bar bodies
        this.swayBarY = 0;    // Y position for all bars
        this.swayAngle = 0;   // Shared animation angle
        this.swaySpeed = 0.04;
        this.swayMaxAngle = Math.PI / 4; // 45 degrees each direction = 90 degree arc

        // Moving bucket properties
        this.movingBucket = {
            x: 25,
            y: 365,
            width: 55,
            height: 50,
            minX: 25,
            maxX: 675,
            moveSpeed: 3,
            direction: 1, // 1 for right, -1 for left
            currentValue: 0
        };

        this.gameState = {
            coins: [],
            pegs: [],
            buckets: [],
            customBuckets: [],
            landedNumbers: [],
            cherryNumbers: [],
            highlightedCherry: [],
            orangeNumbers: [],
            plumNumbers: [],
            grapeNumbers: [],
            watermelonNumbers: [],
            sevenNumbers: [],
            highlightedOrange: [],
            highlightedPlum: [],
            highlightedGrape: [],
            highlightedWatermelon: [],
            highlightedSeven: [],
            highlightedSlots: {
                trophy: 0,  // 0-2 slots available for trophy
                watermelon: 0  // 0-1 slots available for watermelon
            }
        };

        // Player coin system
        this.playerCoins = 50;
        this.payouts = {
            cherry: 0,
            orange: 0,
            plum: 0,
            grape: 0,
            watermelon: 0,
            trophy: 0
        };
        this.completedRows = new Set();
        this.lastCashout = 0;
        
        // Pulsing animation for nearly-complete buckets
        this.pulseTime = 0;
        this.pulseSpeed = 0.05;
        
        // Coin drop cooldown to prevent spam
        this.lastCoinDropTime = 0;
        this.coinDropCooldown = 750; // milliseconds (0.75 seconds)

        this.setupWorld();
        this.setupControls();
        this.updateUIPanel();
    }

    init() {
        this.gameLoop();
    }

    setupWorld() {
        // Create swaying bars at specified X positions
        [175, 235, 515, 575].forEach(barX => this.createSwayingBar(barX));

        // Create pegs in Plinko pattern
        this.createPegs();

        // Create buckets at bottom
        this.createBuckets();

        // Create custom buckets at middle positions
        this.createCustomBuckets();
        
        // Generate table rows in order of dependency
        this.generateCherryNumbers();
        this.generateOrangeNumbers();
        this.generatePlumNumbers();
        this.generateGrapeNumbers();
        this.generateWatermelonNumbers();
        this.generateSevenNumbers();

        // Add walls
        this.createWalls();
    }

    createSwayingBar(barX) {
        const barWidth = 160;
        const barHeight = 10;

        // Create the swaying bar as STATIC for proper collision detection
        const swayBar = Bodies.rectangle(barX, this.swayBarY, barWidth, barHeight, {
            isStatic: true,
            restitution: 0.9,
            friction: 0.5,
            label: 'swaybar'
        });
        
        // Store initial X position on the body for later reference
        swayBar.swayBarX = barX;

        this.swayBars.push(swayBar);
        World.add(this.engine.world, swayBar);
    }

    createPegs() {
        const startX = 75;
        const startY = 120;
        const spacingX = 55;
        const spacingY = 45;
        const pegRadius = 2;

        // Define exclusion zones (areas where pegs won't be created)
        // Format: { x1, y1, x2, y2 } - rectangular areas to skip
        const exclusionZones = [
            { x1: 180, y1: 120, x2: 590, y2: 270 }  // Center area - adjust coordinates as needed
        ];

        for (let row = 0; row < 6; row++) {
            const pegsInRow = row % 2 === 0 ? 12 : 13;
            const offset = row % 2 === 0 ? 0 : -spacingX / 2;

            for (let col = 0; col < pegsInRow; col++) {
                const x = startX + col * spacingX + offset;
                const y = startY + row * spacingY;

                // Check if peg is in any exclusion zone
                let inExclusionZone = false;
                for (const zone of exclusionZones) {
                    if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
                        inExclusionZone = true;
                        break;
                    }
                }

                // Only create peg if not in exclusion zone
                if (!inExclusionZone) {
                    const peg = Bodies.circle(x, y, pegRadius, {
                        isStatic: true,
                        label: 'peg'
                    });

                    World.add(this.engine.world, peg);
                    this.gameState.pegs.push(peg);
                }
            }
        }

        for (let row = 0; row < 6; row++) {
            const pegsInRow = row % 2 === 0 ? 13 : 14;
            const offset = row % 2 === 0 ? 0 : -spacingX / 2;

            for (let col = 0; col < pegsInRow; col++) {
                const x = 51 + col * spacingX + offset;
                const y = 450 + row * spacingY;

                // Check if peg is in any exclusion zone
                let inExclusionZone = false;
                for (const zone of exclusionZones) {
                    if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
                        inExclusionZone = true;
                        break;
                    }
                }

                // Only create peg if not in exclusion zone
                if (!inExclusionZone) {
                    const peg = Bodies.circle(x, y, pegRadius, {
                        isStatic: true,
                        label: 'peg'
                    });

                    World.add(this.engine.world, peg);
                    this.gameState.pegs.push(peg);
                }
            }
        }
    }

    createBuckets() {
        const bucketWidth = 55;
        const bucketHeight = 50;
        const bucketY = 700;
        const startX = 24;
        
        // Generate bucket values with GAME OVER at positions 0, 3, 6, 9, 12
        const bucketValues = this.generateBucketValues();

        for (let i = 0; i < 13; i++) {
            const x = startX + i * bucketWidth;
            const bucket = {
                x: x,
                y: bucketY,
                width: bucketWidth,
                height: bucketHeight,
                value: bucketValues[i],
                index: i,
                color: i==0||i==3||i==6||i==9||i==12?'#ffffff':this.generateRandomColor()
            };
            this.gameState.buckets.push(bucket);
        }
    }

    generateBucketValues() {
        const values = [];
        const gameOverIndices = [0, 3, 6, 9, 12];
        
        // Create array of unique numbers 9-16
        const uniqueNumbers = [9, 10, 11, 12, 13, 14, 15, 16];
        
        // Shuffle the numbers
        for (let i = uniqueNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueNumbers[i], uniqueNumbers[j]] = [uniqueNumbers[j], uniqueNumbers[i]];
        }
        
        // Distribute numbers to non-GAME OVER positions
        let numberIndex = 0;
        for (let i = 0; i < 13; i++) {
            if (gameOverIndices.includes(i)) {
                values.push('GAME OVER');
            } else {
                values.push(uniqueNumbers[numberIndex++]);
            }
        }
        return values;
    }

    createCustomBuckets() {
        const bucketWidth = 55;
        const bucketHeight = 50;
        
        // Custom positions for 8 buckets
        const customPositions = [
            { x: 80, y: 495 },
            { x: 245, y: 495 },
            { x: 465, y: 495 },
            { x: 625, y: 495 },
            { x: 135, y: 585 },
            { x: 300, y: 585 },
            { x: 410, y: 585 },
            { x: 575, y: 585 }
        ];
        
        // Generate unique numbers 1-8
        const bucketValues = this.generateCustomBucketValues();

        customPositions.forEach((pos, index) => {
            const bucket = {
                x: pos.x,
                y: pos.y,
                width: bucketWidth,
                height: bucketHeight,
                value: bucketValues[index],
                index: index,
                color: this.generateRandomColor()
            };
            this.gameState.customBuckets.push(bucket);
        });
    }

    generateCustomBucketValues() {
        // Create array of unique numbers 1-8
        const uniqueNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
        
        // Shuffle the numbers
        for (let i = uniqueNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueNumbers[i], uniqueNumbers[j]] = [uniqueNumbers[j], uniqueNumbers[i]];
        }
        return uniqueNumbers;
    }

    generateCherryNumbers() {
        // Generate 2-3 random numbers from 1-8
        const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
        const count = Math.random() < 0.5 ? 2 : 3; // 50% chance of 2 or 3 numbers
        
        // Shuffle and pick first 'count' numbers
        for (let i = allNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
        }
        
        this.gameState.cherryNumbers = allNumbers.slice(0, count);
        this.gameState.highlightedCherry = [];
    }

    generatePlumNumbers() {
        // Plum: 4 digits - 3 unique from 9-16, 1 shared from orange
        let plumPool = [9, 10, 11, 12, 13, 14, 15, 16].filter(n => !this.gameState.orangeNumbers.includes(n));
        
        // Shuffle
        for (let i = plumPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [plumPool[i], plumPool[j]] = [plumPool[j], plumPool[i]];
        }
        
        // 3 unique from available pool + 1 from orange
        const num1 = plumPool.length > 0 ? plumPool[0] : 9;
        const num2 = plumPool.length > 1 ? plumPool[1] : 10;
        const num3 = plumPool.length > 2 ? plumPool[2] : 11;
        const orangeShared = this.gameState.orangeNumbers.length > 2 ? this.gameState.orangeNumbers[2] : 12;
        
        this.gameState.plumNumbers = [num1, num2, num3, orangeShared];
        this.gameState.highlightedPlum = [];
    }

    generateOrangeNumbers() {
        // Orange: 3 fixed numbers - ensure all custom bucket numbers (1-8) are used
        let availableFromCustom = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !this.gameState.cherryNumbers.includes(n));
        
        // Shuffle available numbers
        for (let i = availableFromCustom.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableFromCustom[i], availableFromCustom[j]] = [availableFromCustom[j], availableFromCustom[i]];
        }
        
        if (this.gameState.cherryNumbers.length === 3) {
            // Cherry has 3: Copy 2 from cherry, 1 unique from 1-8
            const thirdNum = availableFromCustom.length > 0 ? availableFromCustom[0] : 1;
            this.gameState.orangeNumbers = [
                this.gameState.cherryNumbers[0],
                this.gameState.cherryNumbers[1],
                thirdNum
            ];
        } else {
            // Cherry has 2: 2 unique from 1-8, 1 unique from remaining
            const num1 = availableFromCustom.length > 0 ? availableFromCustom[0] : 1;
            const num2 = availableFromCustom.length > 1 ? availableFromCustom[1] : 2;
            this.gameState.orangeNumbers = [
                num1,
                num2,
                availableFromCustom.length > 2 ? availableFromCustom[2] : 3
            ];
        }
        
        this.gameState.highlightedOrange = [];
    }

    generateGrapeNumbers() {
        // Grape: 4 numbers (up to 3 from 1-8, up to 1 from 9-16)
        const usedInCherry = this.gameState.cherryNumbers;
        const usedInOrange = this.gameState.orangeNumbers;
        const usedInPlum = this.gameState.plumNumbers;
        
        const availableFromCustom = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => 
            !usedInCherry.includes(n) && !usedInOrange.includes(n)
        );
        const available9_16 = [9, 10, 11, 12, 13, 14, 15, 16].filter(n => 
            !usedInPlum.includes(n)
        );
        
        // Shuffle pools
        for (let i = availableFromCustom.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableFromCustom[i], availableFromCustom[j]] = [availableFromCustom[j], availableFromCustom[i]];
        }
        for (let i = available9_16.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available9_16[i], available9_16[j]] = [available9_16[j], available9_16[i]];
        }
        
        // Build grape numbers using available numbers
        const grapeNumbers = [];
        // Add up to 3 from custom (1-8)
        for (let i = 0; i < Math.min(3, availableFromCustom.length); i++) {
            grapeNumbers.push(availableFromCustom[i]);
        }
        // Add from 9-16 to make 4 total
        for (let i = 0; i < Math.min(4 - grapeNumbers.length, available9_16.length); i++) {
            grapeNumbers.push(available9_16[i]);
        }
        
        this.gameState.grapeNumbers = grapeNumbers.length > 0 ? grapeNumbers : [1, 2, 3, 9];
        this.gameState.highlightedGrape = [];
    }

    generateWatermelonNumbers() {
        // Watermelon: 4 unique from 9-16, excluding what plum uses
        let available9_16 = [9, 10, 11, 12, 13, 14, 15, 16].filter(n => !this.gameState.plumNumbers.includes(n));
        
        // Shuffle
        for (let i = available9_16.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available9_16[i], available9_16[j]] = [available9_16[j], available9_16[i]];
        }
        
        // Take first 4 available (or as many as we have)
        this.gameState.watermelonNumbers = available9_16.slice(0, Math.min(4, available9_16.length));
        this.gameState.highlightedWatermelon = [];
    }

    generateSevenNumbers() {
        // 7: 3 numbers - 2 unique from 1-8 (excluding cherry), 1 unique from 9-16 (excluding plum, watermelon, grape)
        let available1_8 = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !this.gameState.cherryNumbers.includes(n) && !this.gameState.orangeNumbers.includes(n) && !this.gameState.grapeNumbers.includes(n));
        let available9_16 = [9, 10, 11, 12, 13, 14, 15, 16].filter(n => !this.gameState.plumNumbers.includes(n) && !this.gameState.watermelonNumbers.includes(n) && !this.gameState.grapeNumbers.includes(n));
        
        // Shuffle
        for (let i = available1_8.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available1_8[i], available1_8[j]] = [available1_8[j], available1_8[i]];
        }
        for (let i = available9_16.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available9_16[i], available9_16[j]] = [available9_16[j], available9_16[i]];
        }
        
        // Ensure we have enough numbers
        const num1_8_1 = available1_8.length > 0 ? available1_8[0] : 1;
        const num1_8_2 = available1_8.length > 1 ? available1_8[1] : 2;
        const num9_16 = available9_16.length > 0 ? available9_16[0] : 9;
        
        this.gameState.sevenNumbers = [num1_8_1, num1_8_2, num9_16];
        this.gameState.highlightedSeven = [];
    }


    generateRandomColor() {
        // Fixed arcade cyan color for all buckets
        return '#00d4ff';
    }

    createWalls() {
        const wallThickness = 7;

        // Left wall
        const leftWall = Bodies.rectangle(wallThickness / 2, 400, wallThickness, 800, {
            isStatic: true,
            label: 'wall'
        });

        // Right wall
        const rightWall = Bodies.rectangle(760 - wallThickness / 2, 400, wallThickness, 800, {
            isStatic: true,
            label: 'wall'
        });

        World.add(this.engine.world, [leftWall, rightWall]);
    }

    dropCoin(x = 375) {
        // Check cooldown to prevent spam
        const now = Date.now();
        if (now - this.lastCoinDropTime < this.coinDropCooldown) {
            return; // Still in cooldown, ignore
        }
        this.lastCoinDropTime = now;
        
        const coinRadius = 18;
        const coin = Bodies.circle(x, 0, coinRadius, {
            restitution: 0.55,
            friction: 0.3,
            frictionAir: 0.02,
            density: 0.5,
            label: 'coin'
        });

        // Add random downward force to randomize power
        const randomForce = 1 + Math.random() * 35;
        Body.applyForce(coin, coin.position, { x: 0, y: randomForce });

        World.add(this.engine.world, coin);
        this.gameState.coins.push({
            body: coin,
            radius: coinRadius,
            collected: false
        });
    }

    checkCoinCollection() {
        this.gameState.coins.forEach((coinObj, index) => {
            if (coinObj.collected) return;

            const coin = coinObj.body;
            
            // Check regular buckets
            for (const bucket of this.gameState.buckets) {
                if (
                    coin.position.x > bucket.x &&
                    coin.position.x < bucket.x + bucket.width &&
                    coin.position.y > bucket.y &&
                    coin.position.y < bucket.y + bucket.height
                ) {
                    coinObj.collected = true;
                    
                    // Check if landed on GAME OVER
                    if (bucket.value === 'GAME OVER') {
                        this.gameOver();
                    } else {
                        // Check if this number is in any special row - highlight in ALL applicable rows
                        if (this.gameState.cherryNumbers.includes(bucket.value)) {
                            if (!this.gameState.highlightedCherry.includes(bucket.value)) {
                                this.gameState.highlightedCherry.push(bucket.value);
                            }
                        }
                        if (this.gameState.orangeNumbers.includes(bucket.value)) {
                            if (!this.gameState.highlightedOrange.includes(bucket.value)) {
                                this.gameState.highlightedOrange.push(bucket.value);
                            }
                        }
                        if (this.gameState.plumNumbers.includes(bucket.value)) {
                            if (!this.gameState.highlightedPlum.includes(bucket.value)) {
                                this.gameState.highlightedPlum.push(bucket.value);
                            }
                        }
                        if (this.gameState.grapeNumbers.includes(bucket.value)) {
                            if (!this.gameState.highlightedGrape.includes(bucket.value)) {
                                this.gameState.highlightedGrape.push(bucket.value);
                            }
                        }
                        if (this.gameState.watermelonNumbers.includes(bucket.value)) {
                            if (!this.gameState.highlightedWatermelon.includes(bucket.value)) {
                                this.gameState.highlightedWatermelon.push(bucket.value);
                            }
                        }
                        if (this.gameState.sevenNumbers.includes(bucket.value)) {
                            if (!this.gameState.highlightedSeven.includes(bucket.value)) {
                                this.gameState.highlightedSeven.push(bucket.value);
                            }
                        }
                        // Add to landed list if not in any row
                        const inAnyRow = this.gameState.cherryNumbers.includes(bucket.value) ||
                                        this.gameState.orangeNumbers.includes(bucket.value) ||
                                        this.gameState.plumNumbers.includes(bucket.value) ||
                                        this.gameState.grapeNumbers.includes(bucket.value) ||
                                        this.gameState.watermelonNumbers.includes(bucket.value) ||
                                        this.gameState.sevenNumbers.includes(bucket.value);
                        if (!inAnyRow && !this.gameState.landedNumbers.includes(bucket.value)) {
                            this.gameState.landedNumbers.push(bucket.value);
                        }
                    }
                    
                    // Update UI after bucket collision
                    this.updateUIPanel();

                    World.remove(this.engine.world, coin);
                    return;
                }
            }

            // Check custom buckets
            for (const bucket of this.gameState.customBuckets) {
                // Only count collision if coin hits the TOP of the bucket
                const topHitboxHeight = 10; // Top 10 pixels of bucket
                if (
                    coin.position.x > bucket.x &&
                    coin.position.x < bucket.x + bucket.width &&
                    coin.position.y > bucket.y &&
                    coin.position.y < bucket.y + topHitboxHeight &&
                    coin.velocity.y >= 0 // Coin is moving downward or at rest
                ) {
                    coinObj.collected = true;
                    
                    // Check if this number is in any special row - highlight in ALL applicable rows
                    if (this.gameState.cherryNumbers.includes(bucket.value)) {
                        if (!this.gameState.highlightedCherry.includes(bucket.value)) {
                            this.gameState.highlightedCherry.push(bucket.value);
                        }
                    }
                    if (this.gameState.orangeNumbers.includes(bucket.value)) {
                        if (!this.gameState.highlightedOrange.includes(bucket.value)) {
                            this.gameState.highlightedOrange.push(bucket.value);
                        }
                    }
                    if (this.gameState.plumNumbers.includes(bucket.value)) {
                        if (!this.gameState.highlightedPlum.includes(bucket.value)) {
                            this.gameState.highlightedPlum.push(bucket.value);
                        }
                    }
                    if (this.gameState.grapeNumbers.includes(bucket.value)) {
                        if (!this.gameState.highlightedGrape.includes(bucket.value)) {
                            this.gameState.highlightedGrape.push(bucket.value);
                        }
                    }
                    if (this.gameState.watermelonNumbers.includes(bucket.value)) {
                        if (!this.gameState.highlightedWatermelon.includes(bucket.value)) {
                            this.gameState.highlightedWatermelon.push(bucket.value);
                        }
                    }
                    if (this.gameState.sevenNumbers.includes(bucket.value)) {
                        if (!this.gameState.highlightedSeven.includes(bucket.value)) {
                            this.gameState.highlightedSeven.push(bucket.value);
                        }
                    }
                    // Add to landed list if not in any row
                    const inAnyRow = this.gameState.cherryNumbers.includes(bucket.value) ||
                                    this.gameState.orangeNumbers.includes(bucket.value) ||
                                    this.gameState.plumNumbers.includes(bucket.value) ||
                                    this.gameState.grapeNumbers.includes(bucket.value) ||
                                    this.gameState.watermelonNumbers.includes(bucket.value) ||
                                    this.gameState.sevenNumbers.includes(bucket.value);
                    if (!inAnyRow && !this.gameState.landedNumbers.includes(bucket.value)) {
                        this.gameState.landedNumbers.push(bucket.value);
                    }
                    
                    // Update UI after bucket collision
                    this.updateUIPanel();

                    World.remove(this.engine.world, coin);
                    return;
                }
            }

            // Check moving bucket collision
            const movingBucket = this.movingBucket;
            const topHitboxHeight = 10; // Top 10 pixels of bucket
            if (
                coin.position.x > movingBucket.x &&
                coin.position.x < movingBucket.x + movingBucket.width &&
                coin.position.y > movingBucket.y &&
                coin.position.y < movingBucket.y + topHitboxHeight &&
                coin.velocity.y >= 0 // Coin is moving downward or at rest
            ) {
                // Trigger slot machine
                this.triggerSlotMachine();
                
                // Don't remove coin - let it pass through
                coinObj.collected = true;
                return;
            }

            // Remove coins that fell off screen
            if (coin.position.y > 850) {
                World.remove(this.engine.world, coin);
            }
        });
    }

    triggerSlotMachine() {
        this.slotMachine.spin();
    }

    processSlotMachineResult() {
        const result = this.slotMachine.getResult();

        if (result === '🏆') {
            // Trophy (7) row - prioritize SLOT cells first
            if (this.gameState.highlightedSlots.trophy < 2) {
                // Highlight SLOT cell
                this.gameState.highlightedSlots.trophy += 1;
            } else if (this.gameState.highlightedSeven.length < this.gameState.sevenNumbers.length) {
                // Then highlight regular numbers
                const unhighlighted = this.gameState.sevenNumbers.filter(n => !this.gameState.highlightedSeven.includes(n));
                if (unhighlighted.length > 0) {
                    this.gameState.highlightedSeven.push(unhighlighted[0]);
                }
            }
        } else if (result === '🍉') {
            // Watermelon row - prioritize SLOT cell first
            if (this.gameState.highlightedSlots.watermelon < 1) {
                // Highlight SLOT cell
                this.gameState.highlightedSlots.watermelon += 1;
            } else if (this.gameState.highlightedWatermelon.length < this.gameState.watermelonNumbers.length) {
                // Then highlight regular numbers
                const unhighlighted = this.gameState.watermelonNumbers.filter(n => !this.gameState.highlightedWatermelon.includes(n));
                if (unhighlighted.length > 0) {
                    this.gameState.highlightedWatermelon.push(unhighlighted[0]);
                }
            }
        } else if (result === '🍑') {
            // Plum row - highlight first unhighlighted
            const unhighlighted = this.gameState.plumNumbers.filter(n => !this.gameState.highlightedPlum.includes(n));
            if (unhighlighted.length > 0) {
                this.gameState.highlightedPlum.push(unhighlighted[0]);
            }
        } else if (result === '🍇') {
            // Grape row - highlight first unhighlighted
            const unhighlighted = this.gameState.grapeNumbers.filter(n => !this.gameState.highlightedGrape.includes(n));
            if (unhighlighted.length > 0) {
                this.gameState.highlightedGrape.push(unhighlighted[0]);
            }
        } else if (result === '🍊') {
            // Orange row - highlight first unhighlighted
            const unhighlighted = this.gameState.orangeNumbers.filter(n => !this.gameState.highlightedOrange.includes(n));
            if (unhighlighted.length > 0) {
                this.gameState.highlightedOrange.push(unhighlighted[0]);
            }
        } else if (result === '🍒') {
            // Cherry row - highlight first unhighlighted
            const unhighlighted = this.gameState.cherryNumbers.filter(n => !this.gameState.highlightedCherry.includes(n));
            if (unhighlighted.length > 0) {
                this.gameState.highlightedCherry.push(unhighlighted[0]);
            }
        }
        
        // Update UI after highlighting
        this.updateUIPanel();
    }

    gameOver() {
        // Reset buckets with new random values (without removing coins)
        this.gameState.buckets = [];
        this.createBuckets();
        
        // Reset custom buckets with new random values
        this.gameState.customBuckets = [];
        this.createCustomBuckets();
        
        // Clear landed numbers
        this.gameState.landedNumbers = [];
        
        // Reset highlighted slots
        this.gameState.highlightedSlots = {
            trophy: 0,
            watermelon: 0
        };
        
        // Clear all highlights
        this.gameState.highlightedCherry = [];
        this.gameState.highlightedOrange = [];
        this.gameState.highlightedPlum = [];
        this.gameState.highlightedGrape = [];
        this.gameState.highlightedWatermelon = [];
        this.gameState.highlightedSeven = [];
        
        // Regenerate all table rows
        this.generateCherryNumbers();
        this.generateOrangeNumbers();
        this.generatePlumNumbers();
        this.generateGrapeNumbers();
        this.generateWatermelonNumbers();
        this.generateSevenNumbers();
        
        // Generate new payouts for the game
        this.generatePayouts();
        
        // Update UI
        this.updateUIPanel();
    }

    drawTable() {
        const startX = 200;
        const startY = 85;
        const endX = 560;
        const endY = 285;
        const cols = 7;
        const rows = 6;
        
        const width = endX - startX;
        const height = endY - startY;
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        // Emojis for the first column
        const emojis = ['🏆', '🍉', '🍑', '🍇', '🍊', '🍒'];
        
        // Draw table grid
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Draw vertical lines
        for (let col = 0; col <= cols; col++) {
            const x = startX + col * cellWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let row = 0; row <= rows; row++) {
            const y = startY + row * cellHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
        
        // Draw emojis in the first column
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        
        for (let row = 0; row < rows; row++) {
            const x = startX + cellWidth / 2;
            const y = startY + row * cellHeight + cellHeight / 2;
            this.ctx.fillText(emojis[row], x, y);
        }
        
        // Draw numbers for each special row
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Row indices: 0=7️⃣, 1=🍉 (watermelon), 2=🍑 (plum), 3=🍇 (grape), 4=🍊 (orange), 5=🍒 (cherry)
        
        // Draw 7 row (row 0, 🏆) - 2 slots + 3 numbers + payout
        const sevenRowY = startY + 0 * cellHeight;
        this.ctx.fillStyle = '#ffffff';
        
        // Draw SLOT cells for trophy row
        for (let slotIdx = 0; slotIdx < 2; slotIdx++) {
            const col = slotIdx + 1;
            const cellX = startX + col * cellWidth;
            
            // Highlight SLOT cells that have been hit
            if (slotIdx < this.gameState.highlightedSlots.trophy) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, sevenRowY, cellWidth, cellHeight);
                this.ctx.fillStyle = '#000000';
            } else {
                this.ctx.fillStyle = '#ffffff';
            }
            
            this.ctx.fillText('SLOT', cellX + cellWidth / 2, sevenRowY + cellHeight / 2);
        }
        
        // Draw numbers for trophy row
        for (let i = 0; i < this.gameState.sevenNumbers.length; i++) {
            const num = this.gameState.sevenNumbers[i];
            const col = i + 3;
            const cellX = startX + col * cellWidth;
            
            if (this.gameState.highlightedSeven.includes(num)) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, sevenRowY, cellWidth, cellHeight);
            }
            
            this.ctx.fillStyle = this.gameState.highlightedSeven.includes(num) ? '#000000' : '#ffffff';
            this.ctx.fillText(num, cellX + cellWidth / 2, sevenRowY + cellHeight / 2);
        }
        
        // Draw payout for trophy row (last cell, column 6)
        const trophyPayoutX = startX + 6 * cellWidth;
        const isCompletedSeven = this.gameState.highlightedSeven.length === this.gameState.sevenNumbers.length && this.gameState.highlightedSlots.trophy === 2;
        this.ctx.fillStyle = isCompletedSeven ? '#ffff00' : 'rgba(245, 183, 0, 0.3)';
        this.ctx.fillRect(trophyPayoutX, sevenRowY, cellWidth, cellHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.payouts.trophy, trophyPayoutX + cellWidth / 2, sevenRowY + cellHeight / 2);
        
        // Draw Watermelon row (row 1, 🍉) - 1 slot + 4 numbers + payout
        const watermelonRowY = startY + 1 * cellHeight;
        this.ctx.fillStyle = '#ffffff';
        
        // Draw SLOT cell for watermelon row
        const slotCellX = startX + cellWidth;
        if (this.gameState.highlightedSlots.watermelon > 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(slotCellX, watermelonRowY, cellWidth, cellHeight);
            this.ctx.fillStyle = '#000000';
        } else {
            this.ctx.fillStyle = '#ffffff';
        }
        this.ctx.fillText('SLOT', slotCellX + cellWidth / 2, watermelonRowY + cellHeight / 2);
        
        // Draw numbers for watermelon row
        for (let i = 0; i < this.gameState.watermelonNumbers.length; i++) {
            const num = this.gameState.watermelonNumbers[i];
            const col = i + 2;
            const cellX = startX + col * cellWidth;
            
            if (this.gameState.highlightedWatermelon.includes(num)) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, watermelonRowY, cellWidth, cellHeight);
            }
            
            this.ctx.fillStyle = this.gameState.highlightedWatermelon.includes(num) ? '#000000' : '#ffffff';
            this.ctx.fillText(num, cellX + cellWidth / 2, watermelonRowY + cellHeight / 2);
        }
        
        // Draw payout for watermelon row (last cell, column 6)
        const watermelonPayoutX = startX + 6 * cellWidth;
        const isCompletedWatermelon = this.gameState.highlightedWatermelon.length === this.gameState.watermelonNumbers.length && this.gameState.highlightedSlots.watermelon === 1;
        this.ctx.fillStyle = isCompletedWatermelon ? '#ffff00' : 'rgba(245, 183, 0, 0.3)';
        this.ctx.fillRect(watermelonPayoutX, watermelonRowY, cellWidth, cellHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.payouts.watermelon, watermelonPayoutX + cellWidth / 2, watermelonRowY + cellHeight / 2);
        
        // Draw Plum row (row 2, 🍑) - 4 numbers + payout
        const plumRowY = startY + 2 * cellHeight;
        for (let i = 0; i < this.gameState.plumNumbers.length; i++) {
            const num = this.gameState.plumNumbers[i];
            const col = i + 1;
            const cellX = startX + col * cellWidth;
            
            if (this.gameState.highlightedPlum.includes(num)) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, plumRowY, cellWidth, cellHeight);
            }
            
            this.ctx.fillStyle = this.gameState.highlightedPlum.includes(num) ? '#000000' : '#ffffff';
            this.ctx.fillText(num, cellX + cellWidth / 2, plumRowY + cellHeight / 2);
        }
        
        // Draw payout for plum row (last cell, column 6)
        const plumPayoutX = startX + 6 * cellWidth;
        const isCompletedPlum = this.gameState.highlightedPlum.length === this.gameState.plumNumbers.length;
        this.ctx.fillStyle = isCompletedPlum ? '#ffff00' : 'rgba(245, 183, 0, 0.3)';
        this.ctx.fillRect(plumPayoutX, plumRowY, cellWidth, cellHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.payouts.plum, plumPayoutX + cellWidth / 2, plumRowY + cellHeight / 2);
        
        // Draw Grape row (row 3, 🍇) - 4 numbers + payout
        const grapeRowY = startY + 3 * cellHeight;
        for (let i = 0; i < this.gameState.grapeNumbers.length; i++) {
            const num = this.gameState.grapeNumbers[i];
            const col = i + 1;
            const cellX = startX + col * cellWidth;
            
            if (this.gameState.highlightedGrape.includes(num)) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, grapeRowY, cellWidth, cellHeight);
            }
            
            this.ctx.fillStyle = this.gameState.highlightedGrape.includes(num) ? '#000000' : '#ffffff';
            this.ctx.fillText(num, cellX + cellWidth / 2, grapeRowY + cellHeight / 2);
        }
        
        // Draw payout for grape row (last cell, column 6)
        const grapePayoutX = startX + 6 * cellWidth;
        const isCompletedGrape = this.gameState.highlightedGrape.length === this.gameState.grapeNumbers.length;
        this.ctx.fillStyle = isCompletedGrape ? '#ffff00' : 'rgba(245, 183, 0, 0.3)';
        this.ctx.fillRect(grapePayoutX, grapeRowY, cellWidth, cellHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.payouts.grape, grapePayoutX + cellWidth / 2, grapeRowY + cellHeight / 2);
        
        // Draw Orange row (row 4, 🍊) - 3 numbers + payout
        const orangeRowY = startY + 4 * cellHeight;
        for (let i = 0; i < this.gameState.orangeNumbers.length; i++) {
            const num = this.gameState.orangeNumbers[i];
            const col = i + 1;
            const cellX = startX + col * cellWidth;
            
            if (this.gameState.highlightedOrange.includes(num)) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, orangeRowY, cellWidth, cellHeight);
            }
            
            this.ctx.fillStyle = this.gameState.highlightedOrange.includes(num) ? '#000000' : '#ffffff';
            this.ctx.fillText(num, cellX + cellWidth / 2, orangeRowY + cellHeight / 2);
        }
        
        // Draw payout for orange row (last cell, column 6)
        const orangePayoutX = startX + 6 * cellWidth;
        const isCompletedOrange = this.gameState.highlightedOrange.length === this.gameState.orangeNumbers.length;
        this.ctx.fillStyle = isCompletedOrange ? '#ffff00' : 'rgba(245, 183, 0, 0.3)';
        this.ctx.fillRect(orangePayoutX, orangeRowY, cellWidth, cellHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.payouts.orange, orangePayoutX + cellWidth / 2, orangeRowY + cellHeight / 2);
        
        // Draw Cherry row (row 5, 🍒) - 2-3 numbers + payout
        const cherryRowY = startY + 5 * cellHeight;
        for (let i = 0; i < this.gameState.cherryNumbers.length; i++) {
            const num = this.gameState.cherryNumbers[i];
            const col = i + 1;
            const cellX = startX + col * cellWidth;
            
            if (this.gameState.highlightedCherry.includes(num)) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(cellX, cherryRowY, cellWidth, cellHeight);
            }
            
            this.ctx.fillStyle = this.gameState.highlightedCherry.includes(num) ? '#000000' : '#ffffff';
            this.ctx.fillText(num, cellX + cellWidth / 2, cherryRowY + cellHeight / 2);
        }
        
        // Draw payout for cherry row (last cell, column 6)
        const cherryPayoutX = startX + 6 * cellWidth;
        const isCompletedCherry = this.gameState.highlightedCherry.length === this.gameState.cherryNumbers.length;
        this.ctx.fillStyle = isCompletedCherry ? '#ffff00' : 'rgba(245, 183, 0, 0.3)';
        this.ctx.fillRect(cherryPayoutX, cherryRowY, cellWidth, cellHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.payouts.cherry, cherryPayoutX + cellWidth / 2, cherryRowY + cellHeight / 2);
    }

    getNearlyCompleteInfo() {
        // Returns object with which buckets need to pulse
        // A row is "nearly complete" if it needs exactly 1 more number
        const nearlyComplete = {};
        
        // Check each row
        const cherryNeeded = this.gameState.cherryNumbers.length - this.gameState.highlightedCherry.length;
        if (cherryNeeded === 1) {
            const unhighlighted = this.gameState.cherryNumbers.find(n => !this.gameState.highlightedCherry.includes(n));
            nearlyComplete[unhighlighted] = 'cherry';
        }
        
        const orangeNeeded = this.gameState.orangeNumbers.length - this.gameState.highlightedOrange.length;
        if (orangeNeeded === 1) {
            const unhighlighted = this.gameState.orangeNumbers.find(n => !this.gameState.highlightedOrange.includes(n));
            nearlyComplete[unhighlighted] = 'orange';
        }
        
        const plumNeeded = this.gameState.plumNumbers.length - this.gameState.highlightedPlum.length;
        if (plumNeeded === 1) {
            const unhighlighted = this.gameState.plumNumbers.find(n => !this.gameState.highlightedPlum.includes(n));
            nearlyComplete[unhighlighted] = 'plum';
        }
        
        const grapeNeeded = this.gameState.grapeNumbers.length - this.gameState.highlightedGrape.length;
        if (grapeNeeded === 1) {
            const unhighlighted = this.gameState.grapeNumbers.find(n => !this.gameState.highlightedGrape.includes(n));
            nearlyComplete[unhighlighted] = 'grape';
        }
        
        const watermelonNeeded = this.gameState.watermelonNumbers.length - this.gameState.highlightedWatermelon.length;
        if (watermelonNeeded === 1) {
            const unhighlighted = this.gameState.watermelonNumbers.find(n => !this.gameState.highlightedWatermelon.includes(n));
            nearlyComplete[unhighlighted] = 'watermelon';
        }
        
        // Trophy/Seven row - needs both SLOT cells and all numbers
        const sevenNeeded = (2 - this.gameState.highlightedSlots.trophy) + (this.gameState.sevenNumbers.length - this.gameState.highlightedSeven.length);
        if (sevenNeeded === 1) {
            if (this.gameState.highlightedSlots.trophy < 2) {
                nearlyComplete['SLOT'] = 'trophy';
            } else {
                const unhighlighted = this.gameState.sevenNumbers.find(n => !this.gameState.highlightedSeven.includes(n));
                nearlyComplete[unhighlighted] = 'trophy';
            }
        }
        
        return nearlyComplete;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update pulse animation
        this.pulseTime += this.pulseSpeed;
        if (this.pulseTime > 1) this.pulseTime = 0;

        // Draw table
        this.drawTable();

        // Draw pegs
        this.ctx.fillStyle = '#00ff88';
        this.gameState.pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.position.x, peg.position.y, peg.circleRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#00cc66';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });

        // Draw coins
        this.gameState.coins.forEach(coinObj => {
            if (!coinObj.collected) {
                const coin = coinObj.body;
                const x = coin.position.x;
                const y = coin.position.y;
                const r = coinObj.radius;

                // Main coin body with metallic gradient
                const gradient = this.ctx.createRadialGradient(
                    x - 2,
                    y - 2,
                    0,
                    x,
                    y,
                    r
                );
                gradient.addColorStop(0, '#ffff99');
                gradient.addColorStop(0.4, '#ffdd00');
                gradient.addColorStop(0.8, '#ffaa00');
                gradient.addColorStop(1, '#cc6600');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, r, 0, Math.PI * 2);
                this.ctx.fill();

                // Outer dark ring (arcade token style)
                this.ctx.strokeStyle = '#664400';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(x, y, r, 0, Math.PI * 2);
                this.ctx.stroke();

                // Inner highlight shine
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(x - 2, y - 2, r * 0.4, 0, Math.PI * 2);
                this.ctx.fill();

                // Secondary shine for depth
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(x + 1, y + 2, r * 0.2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw buckets
        const nearlyComplete = this.getNearlyCompleteInfo();
        this.gameState.buckets.forEach((bucket, index) => {
            // Check if this bucket should pulse
            const shouldPulse = nearlyComplete[bucket.value] !== undefined;
            const pulseAlpha = shouldPulse ? 0.4 + Math.abs(Math.sin(this.pulseTime * Math.PI)) * 0.35 : 0.7;
            
            this.ctx.fillStyle = bucket.color;
            this.ctx.globalAlpha = pulseAlpha;
            this.ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
            this.ctx.globalAlpha = 1;

            // Bucket border - red for GAME OVER, white for others, bright for pulsing
            if (bucket.value === 'GAME OVER') {
                this.ctx.strokeStyle = '#ff0000';
            } else if (shouldPulse) {
                this.ctx.strokeStyle = '#ffff00';
            } else {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            }
            this.ctx.lineWidth = shouldPulse ? 3 : 2;
            this.ctx.strokeRect(bucket.x, bucket.y, bucket.width, bucket.height);

            // Bucket value text
            if (bucket.value === 'GAME OVER') {
                this.ctx.fillStyle = '#ff0000';
            } else {
                this.ctx.fillStyle = 'white';
            }
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            
            let displayText = bucket.value === 'GAME OVER' ? 'X' : bucket.value.toString();
            this.ctx.fillText(
                displayText,
                bucket.x + bucket.width / 2,
                bucket.y + bucket.height / 2 + 5
            );
        });

        // Draw custom buckets
        this.gameState.customBuckets.forEach((bucket, index) => {
            // Check if this bucket should pulse
            const shouldPulse = nearlyComplete[bucket.value] !== undefined;
            const pulseAlpha = shouldPulse ? 0.4 + Math.abs(Math.sin(this.pulseTime * Math.PI)) * 0.35 : 0.7;
            
            this.ctx.fillStyle = bucket.color;
            this.ctx.globalAlpha = pulseAlpha;
            this.ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
            this.ctx.globalAlpha = 1;

            // Bucket border - white for normal, bright for pulsing
            if (shouldPulse) {
                this.ctx.strokeStyle = '#ffff00';
            } else {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            }
            this.ctx.lineWidth = shouldPulse ? 3 : 2;
            this.ctx.strokeRect(bucket.x, bucket.y, bucket.width, bucket.height);

            // Bucket value text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            
            this.ctx.fillText(
                bucket.value.toString(),
                bucket.x + bucket.width / 2,
                bucket.y + bucket.height / 2 + 5
            );
        });

        // Draw moving bucket
        const mb = this.movingBucket;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillRect(mb.x, mb.y, mb.width, mb.height);
        this.ctx.globalAlpha = 1;

        // Moving bucket border
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mb.x, mb.y, mb.width, mb.height);

        // Moving bucket value text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        
        if (mb.currentValue > 0) {
            this.ctx.fillText(
                mb.currentValue.toString(),
                mb.x + mb.width / 2,
                mb.y + mb.height / 2 + 5
            );
        }

        // Draw swaying bars
        this.swayBars.forEach(bar => {
            const vertices = bar.vertices;
            this.ctx.fillStyle = '#0088ff';
            this.ctx.beginPath();
            this.ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                this.ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.strokeStyle = '#0055cc';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    gameLoop = () => {
        Engine.update(this.engine);

        // Update slot machine
        const wasSpinning = this.slotMachine.isSpinning;
        this.slotMachine.update(1 / 60);
        
        // Check if slot machine just finished spinning
        if (wasSpinning && !this.slotMachine.isSpinning) {
            // Slot machine just finished - process result
            this.processSlotMachineResult();
        }

        // Update moving bucket position
        this.movingBucket.x += this.movingBucket.moveSpeed * this.movingBucket.direction;
        
        // Reverse direction at boundaries
        if (this.movingBucket.x >= this.movingBucket.maxX) {
            this.movingBucket.x = this.movingBucket.maxX;
            this.movingBucket.direction = -1;
        } else if (this.movingBucket.x <= this.movingBucket.minX) {
            this.movingBucket.x = this.movingBucket.minX;
            this.movingBucket.direction = 1;
        }

        // Update all swaying bars rotation
        if (this.swayBars.length > 0) {
            this.swayAngle += this.swaySpeed;
            const rotationAngle = Math.sin(this.swayAngle) * this.swayMaxAngle + 300;
            
            this.swayBars.forEach(bar => {
                // Update rotation for static body
                Body.setAngle(bar, rotationAngle);
            });
        }

        this.checkCoinCollection();
        this.draw();
        
        // Draw slot machine on its canvas
        this.slotMachine.draw();
        
        requestAnimationFrame(this.gameLoop);
    };

    generatePayouts() {
        // Generate random payouts based on row configuration
        this.payouts.cherry = this.gameState.cherryNumbers.length === 2 ? 7 : Math.floor(Math.random() * 4) + 11; // 11-14
        this.payouts.orange = Math.floor(Math.random() * 6) + 13; // 13-18
        this.payouts.grape = Math.floor(Math.random() * 9) + 14; // 14-22
        this.payouts.plum = Math.floor(Math.random() * 14) + 45; // 45-58
        this.payouts.watermelon = Math.floor(Math.random() * 9) + 72; // 72-80
        this.payouts.trophy = 200;
    }

    checkCompletedRows() {
        // Check which rows are fully completed
        this.completedRows.clear();
        
        if (this.gameState.highlightedCherry.length === this.gameState.cherryNumbers.length) {
            this.completedRows.add('cherry');
        }
        if (this.gameState.highlightedOrange.length === this.gameState.orangeNumbers.length) {
            this.completedRows.add('orange');
        }
        if (this.gameState.highlightedPlum.length === this.gameState.plumNumbers.length) {
            this.completedRows.add('plum');
        }
        if (this.gameState.highlightedGrape.length === this.gameState.grapeNumbers.length) {
            this.completedRows.add('grape');
        }
        if (this.gameState.highlightedWatermelon.length === this.gameState.watermelonNumbers.length) {
            this.completedRows.add('watermelon');
        }
        if (this.gameState.highlightedSeven.length === this.gameState.sevenNumbers.length && 
            this.gameState.highlightedSlots.trophy === 2) {
            this.completedRows.add('trophy');
        }
    }

    updateUIPanel() {
        const coinCount = document.getElementById('coinCount');
        const payoutList = document.getElementById('payoutList');
        const cashoutBtn = document.getElementById('cashoutBtn');
        
        // Update coin display
        coinCount.textContent = this.playerCoins;
        
        // Check completed rows
        this.checkCompletedRows();
        
        // Calculate potential win
        let potentialWin = 0;
        this.completedRows.forEach(row => {
            potentialWin += this.payouts[row];
        });
        
        // Update payout list with new layout
        payoutList.innerHTML = `
            <div class="payout-item">
                <span>Potential Win</span>
                <span class="payout-amount">${String(potentialWin).padStart(3, '0')}</span>
            </div>
            <div class="payout-item">
                <span>Last Cashout</span>
                <span class="payout-amount">${String(this.lastCashout).padStart(3, '0')}</span>
            </div>
        `;
        
        // Enable/disable cashout button
        cashoutBtn.disabled = this.completedRows.size === 0;
    }

    cashOut() {
        // Calculate total payout
        let totalPayout = 0;
        this.completedRows.forEach(row => {
            totalPayout += this.payouts[row];
        });
        
        if (totalPayout > 0) {
            // Add coins to player and track cashout
            this.playerCoins += totalPayout;
            this.lastCashout = totalPayout;
            this.updateUIPanel();
            
            // Trigger confetti celebration
            this.celebrateWin();
            
            // Reset the game
            setTimeout(() => this.gameOver(), 1000);
        }
    }
    
    celebrateWin() {
        // Burst of confetti from center
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.5, y: 0.5 },
                colors: ['#CE05EB', '#DC0073', '#F5B700', '#B0FC00', '#0088FB']
            });
            
            // Second burst after 300ms
            setTimeout(() => {
                confetti({
                    particleCount: 80,
                    spread: 100,
                    origin: { x: 0.5, y: 0.3 },
                    colors: ['#CE05EB', '#DC0073', '#F5B700', '#B0FC00', '#0088FB']
                });
            }, 300);
        }
    }

    setupControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const helperBtn = document.getElementById('helperBtn');
        const cashoutBtn = document.getElementById('cashoutBtn');
        const helperDisplay = document.getElementById('helperDisplay');
        const positionText = document.getElementById('positionText');
        const canvas = this.canvas;

        // Left coin button - drops at X:205
        leftBtn.addEventListener('click', () => {
            if (this.playerCoins > 0) {
                this.playerCoins -= 1;
                this.updateUIPanel();
                this.dropCoin(205);
            }
        });

        // Right coin button - drops at X:545
        rightBtn.addEventListener('click', () => {
            if (this.playerCoins > 0) {
                this.playerCoins -= 1;
                this.updateUIPanel();
                this.dropCoin(545);
            }
        });

        // Cashout button
        cashoutBtn.addEventListener('click', () => {
            this.cashOut();
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = Math.round(e.clientX - rect.left);
            this.mouseY = Math.round(e.clientY - rect.top);

            if (this.helperEnabled) {
                positionText.textContent = `X: ${this.mouseX} | Y: ${this.mouseY}`;
            }
        });

        canvas.addEventListener('mouseleave', () => {
            helperDisplay.style.display = 'none';
        });

        canvas.addEventListener('mouseenter', () => {
            if (this.helperEnabled) {
                helperDisplay.style.display = 'block';
            }
        });

        helperBtn.addEventListener('click', () => {
            this.helperEnabled = !this.helperEnabled;
            helperDisplay.style.display = this.helperEnabled ? 'block' : 'none';
            helperBtn.classList.toggle('active', this.helperEnabled);
        });
    }
}
