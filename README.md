# Flow Diagram Editor

[![Tech used](https://skillicons.dev/icons?i=react,typescript,vite\&theme=dark)](https://skillicons.dev)

A web-based flow diagram editor built with **React**, **TypeScript**, and **Vite**.

---

## Preview

<img src="image.png" alt="Flowchart editor preview" width="800" />

---

## Features

### Core Functionality

#### Nodes

* Create nodes with different shapes
* Drag and resize nodes freely
* Select nodes to edit content and apply styles

#### Canvas

* Pan by dragging the background
* Zoom via scroll wheel or on-screen controls
* All interactions respect canvas transforms

#### Edges

* Connect nodes using directed edges
* Create edges via arrow handles on selected nodes
* Edges automatically update when connected nodes move
* Edge endpoints snap to the nearest anchor point

#### Export

* Export diagrams as **PNG** or **JPEG**
* Export is viewport-based by design (only what is visible is rendered)
* Optional image cropping before export
* Export via file download or clipboard (copy + paste)

---

### Styling Options

* Background color
* Border color, width, and radius
* Line width
* Text color and font size

---

## Notes

* Exporting is handled from the rendered viewport rather than reconstructing the full graph off-screen.

---

## Installation

### Requirements

* Node.js 18 or newer
* Modern browser

### Setup

```bash
git clone <repo-url.git>
cd <repo-name>
npm install
npm run dev
```

---

## License

MIT
