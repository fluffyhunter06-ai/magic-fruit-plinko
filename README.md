# 🍒 Magic Fruit - Plinko Game

An interactive arcade-style Plinko game built with **Matter.js** physics engine and **Vite**. Drop coins through pegs and buckets to match numbers, complete rows, and win payouts!

## 🎮 Game Features

### Core Gameplay

- **Physics Simulation**: Realistic coin physics with gravity and collision detection
- **Swaying Bars**: Animated obstacles that sway side-to-side
- **Dual Bucket System**:
  - 13 main buckets (9-16 numbers) at the bottom
  - 8 custom buckets (1-8 numbers) in the middle
  - Moving slot machine bucket that triggers spins
  - GAME OVER buckets that reset the game

### Table & Rows

- **6 Emoji Rows**: 🏆 Trophy, 🍉 Watermelon, 🍑 Plum, 🍇 Grape, 🍊 Orange, 🍒 Cherry
- **Complex Number Sharing**: Numbers are intelligently distributed across rows with dependencies
- **SLOT Cells**: Trophy (2 slots) and Watermelon (1 slot) rows have special SLOT cells
- **Completion Highlighting**: Rows turn yellow when complete with payout values in gold

### Coin System

- **Starting Balance**: 50 coins
- **Cost**: 1 coin per drop
- **Earnings**: Cashout completed rows for dynamic payouts
- **Anti-Spam**: 0.75-second cooldown between coin drops

### Visual Features

- **Pulsing Buckets**: Buckets that complete rows glow and pulse
- **Confetti Celebration**: Colorful confetti burst when you cashout
- **Vibrant Color Scheme**:
  - Purple (#CE05EB) - Primary accent
  - Pink (#DC0073) - Buttons
  - Gold (#F5B700) - Coin panel & payouts
  - Lime (#B0FC00) - Game border
  - Blue (#0088FB) - Coin buttons
  - Cyan (#00d4ff) - Buckets

### Slot Machine

- **3-Second Spin**: Realistic spinning animation
- **6 Symbols**: 🏆 🍉 🍑 🍇 🍊 🍒
- **Smart Highlighting**:
  - Trophy and Watermelon rows prioritize SLOT cells
  - Other rows highlight numbers strategically

## 🚀 Getting Started

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/magic-fruit-plinko.git
cd magic-fruit-plinko
```

2. **Install dependencies**

```bash
npm install
```

3. **Run development server**

```bash
npm run dev
```

The game will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder. You can deploy these files to any static hosting service (GitHub Pages, Vercel, Netlify, etc.).

## 🎯 How to Play

### Controls

- **LEFT Button**: Drop coin from left side
- **RIGHT Button**: Drop coin from right side
- **SPIN Button**: (Removed - slots trigger automatically when coins hit moving bucket)
- **CASHOUT Button**: Collect your winnings from completed rows

### Game Mechanics

1. **Drop Coins**: Use LEFT/RIGHT buttons to drop coins into the game
2. **Navigate Pegs**: Coins bounce off pegs and bars
3. **Land in Buckets**: Each bucket has a number (1-16)
4. **Match Numbers**: Numbers highlight in corresponding table rows
5. **Complete Rows**: Fill all cells in a row to make it eligible for cashout
6. **Cashout**: Click CASHOUT button to collect your payout and reset the game

### Payout Values

- **Cherry** (🍒): 7 or 11-14 coins
- **Orange** (🍊): 13-18 coins
- **Plum** (🍑): 45-58 coins
- **Grape** (🍇): 14-22 coins
- **Watermelon** (🍉): 72-80 coins
- **Trophy** (🏆): 200 coins (requires 2 SLOT cells!)

## 🛠 Technology Stack

- **Physics Engine**: [Matter.js v0.20.0](https://brm.io/matter-js/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **JavaScript**: ES6 Modules
- **Confetti**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

## 📁 Project Structure

```
magic-fruit-plinko/
├── index.html              # Main HTML file
├── package.json            # Project dependencies
├── vite.config.js         # Vite configuration (optional)
├── src/
│   ├── main.js            # Entry point
│   ├── game.js            # Game engine & logic
│   └── style.css          # Styling
└── README.md              # This file
```

## 🎨 Customization

### Adjust Game Parameters

Edit `src/game.js`:

```javascript
// Physics gravity
this.engine.gravity.y = 1.8; // Increase for faster coin fall

// Coin drop cooldown (milliseconds)
this.coinDropCooldown = 750; // Change to 500 for faster drops

// Pulse animation speed
this.pulseSpeed = 0.05; // Higher = faster pulse
```

### Modify Payout Ranges

In `generatePayouts()` method:

```javascript
this.payouts.cherry = Math.floor(Math.random() * 4) + 11; // 11-14
```

## 🐛 Troubleshooting

### Numbers Not Appearing in Table

- Ensure all 8 custom bucket numbers (1-8) are generated in the number generation methods
- Numbers are filtered to avoid duplicates across rows

### Coins Not Dropping

- Check that you have coins remaining (display shows current balance)
- Wait 0.75 seconds between drops (anti-spam cooldown)

### Game Not Running

- Make sure all dependencies are installed: `npm install`
- Check that you're using the dev server: `npm run dev`
- Verify Matter.js is properly imported in `game.js`

## 📤 Deploying to GitHub Pages

1. **Create a GitHub repository** named `magic-fruit-plinko`

2. **Build for production**:

```bash
npm run build
```

3. **Deploy using GitHub Pages**:
   - Push the `dist/` folder to the `gh-pages` branch, or
   - Enable GitHub Pages in repository settings to deploy from main branch

4. **Access your game**: `https://yourusername.github.io/magic-fruit-plinko`

## 📝 License

MIT License - Feel free to use, modify, and share!

## 🤝 Contributing

Found a bug or have a feature idea? Feel free to open an issue or submit a pull request!

## 🎉 Enjoy!

Have fun playing Magic Fruit! Share your high scores with friends and challenge them to beat your record!

---

**Made with ❤️ using Matter.js and Vite**
