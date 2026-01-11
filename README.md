# Flow Diagram Editor

[![Tech used](https://skillicons.dev/icons?i=react,typescript,vite&theme=dark)](https://skillicons.dev)

A web-based flow diagram application built with **React**, **TypeScript**, and **Vite**.

Designed as a **Diagram Editor User Interface** powered by a custom **Diagramming Engine**, this project focuses on the interactive rendering and editing of flowchart diagrams. It provides an open canvas for managing diagram elements and it's styling.

[**View Live Application**](https://flow-diagram-editor.vercel.app)

## Preview

<img src="public/image.png" alt="Flowchart editor preview" width="600" />
<img src="public/export-image.png" alt="Flowchart export preview" width="300" />

---
## Features

### Core Functionality

#### Canvas

* Pan by dragging the background
* Zoom via scroll wheel or on-screen controls

#### Nodes (Shapes)

* Create nodes with different shapes
* Drag and resize nodes
* Select nodes to edit content and apply styles

#### Edges (Lines)

* Connect nodes using directed edges
* Choose between straight or stepped (elbow) connectors
* Create edges via arrow handles on selected nodes
* Edge endpoints snap to the nearest anchor point

#### Export

* Use a [Flameshot](https://flameshot.org/)-inspired interface for exporting your diagrams
* Export diagrams as **PNG** or **JPEG**
* Export is viewport-based by design (only what is visible is rendered)
* Export via file download or clipboard (copy + paste)

---
### Styling Options

* Background color
* Border color, width, and radius
* Line width
* Text color and font size

## Built With

This project stands on the shoulders of these awesome open-source libraries:

* **[Zustand](https://github.com/pmndrs/zustand)** - Managing the complex diagram state without the boilerplate.
* **[Lucide React](https://lucide.dev/)** - Clean, consistent UI icons.
* **[html-to-image](https://github.com/bubkoo/html-to-image)** - Powering the "Export to PNG/JPEG" functionality.
* **[react-colorful](https://github.com/omgovich/react-colorful)** - Lightweight color picker component.
* **[downloadjs](https://github.com/rndme/download)** - Handling the browser file downloads.
* **[uuid](https://github.com/uuidjs/uuid)** - Generating unique IDs.
 
---
## Installation

### Requirements

* Node.js 18 or newer
* Modern browser

### Setup

```bash
git clone <repository-url-goes-here>.git
cd <repository-name-goes-here>
npm install
npm run dev
```

---

## License

**MIT License**
