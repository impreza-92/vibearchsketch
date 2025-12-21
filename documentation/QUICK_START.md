# Quick Start Guide

Welcome to the Floorplan Drawing App! This guide will get you drawing floorplans in 2 minutes.

## 🚀 Getting Started

The development server is already running at: **http://localhost:5173**

Open the Simple Browser panel in VS Code or visit the URL in your web browser.

## 🎨 Your First Floorplan

### 1. Draw Your First Wall

1. Look at the **left sidebar** - the toolbar with drawing tools
2. The **✏️ Draw** button should already be active (highlighted in blue)
3. **Click anywhere** on the dark canvas to place your first point
4. **Move your mouse** - you'll see an orange preview line following your cursor
5. **Click again** to place the second point and create your first wall!
6. The wall is complete! **Click again** to start a new wall from scratch

### 2. Draw a Room

Let's create a simple rectangular room:

1. Click to place the first point of your first wall
2. Click to place the second point (first wall complete)
3. Click on the endpoint of the previous wall to start your next wall connected to it
4. Click to place the other end of the second wall
5. Continue this pattern to create a rectangle
6. When closing the shape, click on your starting point to connect the final wall

### 3. Connecting Walls

The app is smart about connecting walls:

- **Snap to Existing Points**: When you click near an existing point (within 10 pixels), it will automatically use that point instead of creating a new one
- **Build Connected Walls**: To connect walls, click on an existing endpoint when starting or ending a new wall
- Each wall is drawn one at a time (2 clicks per wall)

### 3. Try Grid Snapping

Notice how your clicks snap to the grid? This helps keep things aligned!

- **Toggle off**: Uncheck "Snap to Grid" in the toolbar
- **Change grid size**: Adjust the "Grid Size" number (try 20)
- **Toggle back on**: Check "Snap to Grid" again

### 4. Undo/Redo

Made a mistake? No problem!

- Click **↶ Undo** to remove the last wall
- Click **↷ Redo** to bring it back
- All your actions are saved in history!

## 🛠️ Available Tools

### ✏️ Draw Mode (Active)
- Click to place first point (or click on existing point to reuse it)
- Click again to place second point and create wall
- Each wall requires 2 clicks
- To connect walls, click on existing endpoints
- Automatically snaps to nearby points (within 10 pixels)

### 👆 Select Mode (Coming Soon)
- Will let you click and select walls
- Edit properties in panel
- Move walls around

### ✋ Pan Mode (Coming Soon)
- Will let you drag the canvas
- Zoom in and out
- Navigate large floorplans

### 🗑️ Erase Mode (Coming Soon)
- Will delete walls by clicking
- Quick cleanup tool

## 📋 Toolbar Reference

```
┌─────────────────┐
│ Tools           │
│ ✏️ Draw         │ ← Click to draw walls
│ 👆 Select       │ ← (Future) Select/edit
│ ✋ Pan          │ ← (Future) Move view
│ 🗑️ Erase        │ ← (Future) Delete
├─────────────────┤
│ Options         │
│ ☑ Snap to Grid  │ ← Toggle snapping
│ Grid Size: 10   │ ← Adjust spacing
├─────────────────┤
│ Edit            │
│ ↶ Undo          │ ← Undo last action
│ ↷ Redo          │ ← Redo undone action
│ 🗑️ Clear All    │ ← Delete everything
├─────────────────┤
│ Info            │
│ Walls: 0        │ ← Stats
│ Points: 0       │
│ Mode: draw      │
└─────────────────┘
```

## 🎯 Tips & Tricks

1. **Connect Walls**: To connect walls together, click on an existing endpoint when starting or ending a new wall
2. **Point Reuse**: The app automatically detects when you click near an existing point (within 10 pixels) and reuses it
3. **Escape Key**: Press Escape to cancel current drawing if you've only placed one point
4. **Visual Feedback**: 
   - Orange = Preview (temporary)
   - White = Drawn walls
   - Small circles = Endpoints
5. **Grid Helps**: Keep snap-to-grid on for clean, aligned walls
6. **Adjust Grid**: Use larger grid (20-30) for rough sketches, smaller (5-10) for details

## 🐛 Troubleshooting

### Canvas is Black/Empty
- ✅ This is normal! The dark background is intentional (CAD-style theme)
- The grid is subtle gray lines
- Your walls will appear in white when you draw

### Can't See Grid
- The grid is very subtle (by design)
- Look for faint gray lines
- Try adjusting "Grid Size" to 20 for more visible spacing

### Walls Not Appearing
- Make sure you're in **Draw** mode (button should be blue)
- Click two different points to create a wall
- Check the "Walls" count in the Info section increases

### Orange Line Stuck
- Press **Escape** to cancel the current drawing
- Or switch to a different tool

## 🚀 Next Steps

Now that you've drawn your first walls:

1. **Experiment**: Try different grid sizes and snap settings
2. **Build Something**: Draw a simple floor plan of your room
3. **Test History**: Use undo/redo to see the history in action
4. **Read Docs**: Check out the full documentation in `/documentation/`

## 📚 Learn More

- **README.md** - Full feature list and usage guide
- **ARCHITECTURE.md** - How the app is built with Pixi.js v8
- **DESIGN_DECISIONS.md** - Why we made certain choices
- **IMPLEMENTATION_GUIDE.md** - For developers (includes Pixi.js v8 patterns)

## 🎉 You're Ready!

Start drawing and have fun! The app uses Pixi.js v8 for hardware-accelerated rendering with WebGL.

**Happy Drawing! 🏠✏️**
