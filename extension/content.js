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
  const safeCells = getSafeCells(matrix);
  markSafeCells(safeCells);
  
  const bombCells = getBombCells(matrix);
  markBombCells(bombCells);
  
  console.log('overlay reset');
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

function markOverlayCells(matrix) {
  const height = matrix.length;
  const width = matrix[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = matrix[y][x];

      if (typeof value !== "number" || value === 0) {
        continue;
      }

      const neighbors = getNeighbors(x, y, height, width, matrix);

      const knownBombs = neighbors.filter(n => n.value === "*");
      const unknowns = neighbors.filter(n => n.value === undefined);

      if (knownBombs.length === value) {
        for (const cell of unknowns) {
          safeCells.push({ x: cell.x, y: cell.y });
        }
      }
    }
  }

  return removeDuplicateCells(safeCells);
}

function getBombCells(matrix) {
  const bombCells = [];

  const height = matrix.length;
  const width = matrix[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = matrix[y][x];

      if (typeof value !== "number" || value === 0) continue;

      const neighbors = getNeighbors(x, y, height, width, matrix);

      const knownBombs = neighbors.filter(n => n.value === "*");
      const unknowns = neighbors.filter(n => n.value === undefined);

      const remainingBombs = value - knownBombs.length;

      if (remainingBombs > 0 && remainingBombs === unknowns.length) {
        for (const cell of unknowns) {
          bombCells.push({ x: cell.x, y: cell.y });
        }
      }
    }
  }

  return removeDuplicateCells(bombCells);
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

function removeDuplicateCells(cells) {
  const seen = new Set();

  return cells.filter(cell => {
    const key = `${cell.x},${cell.y}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function markSafeCells(safeCells) {
  for (const { x, y } of safeCells) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);

    if (!cell) continue;
	  if (cell.querySelector(".safe-overlay")) continue;

    const overlay = document.createElement("div");
    overlay.className = "safe-overlay";

    Object.assign(overlay.style, {
      position: "absolute",
      top: "2px",
      left: "2px",
      right: "3px",
      bottom: "3px",
      background: "rgba(0, 255, 0, 0.25)",
      pointerEvents: "none",
      zIndex: "10"
    });

    cell.style.position = "relative";

    cell.appendChild(overlay);
  }
}



function markBombCells(bombCells) {
  for (const { x, y } of bombCells) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);

    if (!cell) continue;
	if (cell.querySelector(".bomb-overlay")) continue;

    const overlay = document.createElement("div");
    overlay.className = "bomb-overlay";

    Object.assign(overlay.style, {
      position: "absolute",
      top: "2px",
      left: "2px",
      right: "3px",
      bottom: "3px",
      background: "rgba(255, 0, 0, 0.25)",
      pointerEvents: "none",
      zIndex: "10"
    });

    cell.style.position = "relative";

    cell.appendChild(overlay);
  }
}

function clearCells() {
  document.querySelectorAll(".safe-overlay, .bomb-overlay").forEach(el => el.remove());
}