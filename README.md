# Flowchart Maker
[![Tech used](https://skillicons.dev/icons?i=react,typescript,vite&theme=dark)](https://skillicons.dev)

A web-based flowchart editor built with Vite, React, and TypeScript. Users can create, manipulate, style, and connect nodes on an interactive canvas.

## Snapshot
<img src="image.png" alt="snapshot" width="800" />

## Project Status

The core canvas features are implemented: dragging, resizing, text editing, panning, zooming, and rendering nodes and edges from mock data. Styling tools for nodes and edges such as for editing font size, fill color, border color, and etc.
Creation, deletion, and duplication of nodes and edges are implemented. Rectangle and diamond node shapes are currently supported. The flowchart data gets persisted to local storage.

## Features

### Core Functionality

* **Node Creation and Manipulation**
  * Drag and resize nodes
  * Select nodes to apply styling and edit content
  * Create nodes with shape options
* **Canvas Interaction**
  * Pan by dragging the background
  * Zoom using the scroll wheel or on-screen controls 
* **Edges**
  * Connect nodes with directed edges
  * Create new edges using the arrow handles when a node is selected
  * Connected edges automatically update when nodes move
  * Edges snap to the nearest anchor point

### Styling

* Background color
* Border color and width
* Rounded or square border
* Text color, font size, and font weight
* Supports rectangle and diamond shapes

## Technologies Used

* React
* TypeScript
* Vite
* Zustand for state management
* Lucide React for SVG icons
* React Colorful for color-picker

## To do

* User testing and bugfixes
* Optional text labels for edges
* Additional shapes (circles, ellipses, parallelograms)
* Undo/redo system
* Node grouping
* Overall improvement of UI/UX for mobile users
* Orthogonal edge routing (Manhattan routing)
* Automated Tests

## Install

```bash
# using npm
git clone <repo-url>
cd <repo-name>
npm install
npm run dev
```
