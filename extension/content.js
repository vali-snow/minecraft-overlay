if (!window.minesweeperHelperState) {
  window.minesweeperHelperState = {
    refreshHandler: null,
    intervalId: null,
    active: false
  };
}

function getState() {
	return window.minesweeperHelperState;
}

function setStateActive(active) {
	window.minesweeperHelperState.active = active;
}

function setRefreshHandler(refreshHandler) {
	window.minesweeperHelperState.refreshHandler = refreshHandler;
}

function setIntervalId(intervalId) {
	window.minesweeperHelperState.intervalId = intervalId;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "activate") {
    activateHelper();
  }

  if (message.action === "deactivate") {
    deactivateHelper();
  }
});

function activateHelper() {
  if (getState().active) {
    return;
  }
  
  refreshOverlays();

  setRefreshHandler(() => {
    setTimeout(refreshOverlays, 50);
  });

  document.addEventListener("click", getState().refreshHandler, true);
  
  setIntervalId(setInterval(refreshOverlays, 1*1000));
  
  setStateActive(true);
}

function deactivateHelper() {
  clearCells();

  if (getState().refreshHandler) {
    document.removeEventListener("click", getState().refreshHandler, true);
    setRefreshHandler(null);
  }
  
  if (getState().intervalId) {
	clearInterval(getState().intervalId);
    setIntervalId(null);
  }
  
  setStateActive(false);
}

function refreshOverlays() {
  clearCells();
  
  const matrix = getBoardMatrix();

  let changes;
  do {
    changes = processMatrix(matrix);
  }
  while( changes > 0);

  createOverlay(matrix);
}

function getBoardMatrix() {
  const cells = [...document.querySelectorAll('[id^="field-"][data-x][data-y]')];

  const maxX = Math.max(...cells.map(cell => Number(cell.dataset.x)));
  const maxY = Math.max(...cells.map(cell => Number(cell.dataset.y)));

  const matrix = Array.from({ length: maxY + 1 }, () =>
    Array.from({ length: maxX + 1 }, () => undefined)
  );

  for (const cell of cells) {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const isHidden = cell.dataset.hidden === "true";

    if (isHidden) {
      matrix[y][x] = undefined;
      continue;
    }

    const text = cell.innerText.trim();

    if (/^[1-8]$/.test(text)) {
      matrix[y][x] = Number(text);
    } else if (cell.querySelector("svg")) {
      matrix[y][x] = "*";
    } else {
      matrix[y][x] = 0;
    }
  }

  return matrix;
}

function processMatrix(matrix) {
  let count = 0;

  const height = matrix.length;
  const width = matrix[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = matrix[y][x];

      if (value === 0 || value === "bomb" || value === "safe" || typeof value !== "number") {
        continue;
      }

      const neighbors = getNeighbors(x, y, height, width, matrix);

      const knownBombs = neighbors.filter(n => n.value === "*" || n.value === "bomb");
      const remainingBombs = value - knownBombs.length;
      const unknowns = neighbors.filter(n => n.value === undefined);

      if (knownBombs.length === value) {
        for (const cell of unknowns) {
          matrix[cell.y][cell.x] = "safe";
          count++;
        }
      }

      if (remainingBombs > 0 && remainingBombs === unknowns.length) {
        for (const cell of unknowns) {
          matrix[cell.y][cell.x] = "bomb";
          count++;
        }
      }
    }
  }

  return count;
}

function getNeighbors(x, y, height, width, matrix) {
    const neighbors = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          neighbors.push({ x: nx, y: ny, value: matrix[ny][nx] });
        }
      }
    }

    return neighbors;
}

function createOverlay(matrix) {
  const height = matrix.length;
  const width = matrix[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      var value = matrix[y][x];

      if(value !== "safe" && value !== "bomb") continue;

      const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);

      if (!cell) continue;
      if (cell.querySelector(".safe-overlay")) continue;

      const overlay = document.createElement("div");
      overlay.className = `${value}-overlay`;

      Object.assign(overlay.style, overlayTemplate(value));

      cell.style.position = "relative";
      cell.appendChild(overlay);
    }
  };
}

function overlayTemplate(value) {
  let backgroundColor;

  switch (value) {
    case "safe":
      backgroundColor = "rgba(0, 255, 0, 0.25)";
      break;
    case "bomb":
      backgroundColor = "rgba(255, 0, 0, 0.25)";
      break;
    default:
      backgroundColor = "rgba(0, 0, 0, 0)";
      break;
  }

  return {
    position: "absolute",
    top: "2px",
    left: "2px",
    right: "3px",
    bottom: "3px",
    background: backgroundColor,
    pointerEvents: "none",
    zIndex: "10"
  }
}

function clearCells() {
  document.querySelectorAll(".safe-overlay, .bomb-overlay").forEach(el => el.remove());
}