# Cookie Clicker Features for Blob Head

This document describes the Cookie Clicker-style features that have been added to the blob head game.

## Features Overview

### 🎮 Game Mechanics

- **Tap Counter**: Taps are now the primary currency
- **Auto Tapping**: Upgrades that automatically generate taps per second
- **Tap Multipliers**: Upgrades that multiply your tap power
- **Persistent Progress**: All progress is saved to localStorage

### 🏗️ Upgrades System

- **Auto Tapper**: Automatically taps once per second (10 levels, max 10)
- **Tap Power**: Doubles your tap power (5 levels, max 5)
- **Super Auto Tapper**: Automatically taps 5 times per second (5 levels, max 5) - Unlocks at 50 taps
- **Mega Tap Power**: Triples your tap power (3 levels, max 3) - Unlocks at 200 taps

### 🎨 Decorations System

- **2D Decorations**: Flat decorative elements that float in the scene
  - 2D Star (50 taps) - Golden star decoration
  - 2D Heart (75 taps) - Pink heart decoration
- **3D Decorations**: Three-dimensional objects that float and rotate
  - 3D Cube (150 taps) - Green floating cube
  - 3D Sphere (200 taps) - Blue floating sphere

### 🎭 Themes System

- **Default Theme**: The original theme (free)
- **Dark Mode** (300 taps): Sleek dark theme with purple accents
- **Neon** (500 taps): Vibrant neon theme with bright colors
- **Pastel** (400 taps): Soft pastel theme with gentle colors

## How to Play

### Accessing the Game UI

1. Click the 🎮 button in the top-right corner of the screen
2. This opens the game menu with three tabs: Upgrades, Decorations, and Themes

### Earning Taps

- Click the blob head to earn 1 tap (multiplied by your current tap multiplier)
- Purchase auto-tapping upgrades to earn taps automatically
- Your total taps per second is displayed in the stats panel

### Purchasing Upgrades

- Upgrades have increasing costs based on their level
- Some upgrades unlock at certain tap thresholds
- Each upgrade has a maximum level

### Buying Decorations

- Decorations are one-time purchases
- Once purchased, they appear in the 3D scene
- 2D decorations float gently, 3D decorations rotate and float

### Applying Themes

- Purchase themes to unlock them
- Click "Activate" to apply a theme to the entire application
- Themes change colors, fonts, and overall appearance

## Technical Implementation

### Store Management

- Uses Zustand for state management
- Persistent storage with localStorage
- Auto-save functionality

### 3D Integration

- Decorations are rendered as 3D objects in the scene
- Smooth animations and floating effects
- Theme changes apply to the entire application

### UI Components

- GameUI: Main game interface with tabs and menus
- SceneDecorations: 3D decoration renderer
- ThemeProvider: Global theme application

## File Structure

```
src/
├── store/
│   └── gameStore.ts          # Game state management
├── molecules/
│   └── GameUI.tsx           # Game user interface
├── 3d-objects/
│   └── Decorations.tsx      # 3D decoration components
├── components/
│   └── ThemeProvider.tsx    # Theme application
└── hooks/
    └── useBlobEmotions.ts   # Updated to integrate with game store
```

## Future Enhancements

### Potential Additions

- More upgrade types (click multipliers, critical hits, etc.)
- Achievement system
- Prestige mechanics
- Sound effects and music
- Particle effects for purchases
- More decoration types
- Seasonal themes
- Multiplayer features

### Technical Improvements

- Performance optimization for high tap counts
- Better mobile support
- Accessibility improvements
- Analytics and statistics
- Export/import save data

## Development Notes

### Adding New Upgrades

1. Add to `initialUpgrades` array in `gameStore.ts`
2. Define cost, effects, and unlock conditions
3. Update UI to display new upgrade

### Adding New Decorations

1. Add to `initialDecorations` array in `gameStore.ts`
2. Create 3D component in `Decorations.tsx`
3. Add rendering logic for new decoration type

### Adding New Themes

1. Add to `initialThemes` array in `gameStore.ts`
2. Define color palette and font
3. Test theme application across the app

### Performance Considerations

- Auto-tap interval runs every second
- 3D decorations use optimized geometries
- Theme changes are debounced to prevent excessive re-renders
- Local storage is used efficiently with partial state persistence
