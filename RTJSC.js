(function () {
  const style = document.createElement("style");
  style.textContent = `
    #corruptorGUI {
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 260px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      font-family: Arial, sans-serif;
      padding: 10px;
      border-radius: 8px;
      z-index: 9999;
      user-select: none;
    }
    #corruptorGUI h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      text-align: center;
    }
    #corruptorGUI input[type=range], #corruptModeSelect {
      width: 100%;
      margin-top: 4px;
    }
    #corruptBtn {
      margin-top: 8px;
      width: 100%;
      background: #009900;
      border: none;
      padding: 8px;
      font-size: 14px;
      color: white;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    #corruptBtn:hover {
      background: #009900;
    }
    #incrementalLabel {
      display: flex;
      align-items: center;
      margin-top: 8px;
      user-select: none;
    }
    #incrementalLabel input {
      margin-right: 6px;
      cursor: pointer;
    }
    #intervalRange {
      width: 100%;
      margin-top: 4px;
    }
    #intervalRange[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    #intervalValue {
      font-size: 12px;
      text-align: right;
      user-select: none;
      margin-top: 2px;
    }
    #pauseBtn, #resumeBtn {
      width: 48%;
      margin-top: 8px;
      padding: 8px;
      font-size: 14px;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    #pauseBtn {
      background: #555555;
      float: left;
    }
    #pauseBtn:hover:not([disabled]) {
      background: #777777;
    }
    #pauseBtn[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
    #resumeBtn {
      background: #007700;
      float: right;
    }
    #resumeBtn:hover:not([disabled]) {
      background: #009900;
    }
    #resumeBtn[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
    /* Clear floats */
    #buttonContainer::after {
      content: "";
      display: block;
      clear: both;
    }
  `;
  document.head.appendChild(style);

  const gui = document.createElement("div");
  gui.id = "corruptorGUI";
  gui.setAttribute("data-corruptor-safe", "true"); // Mark as safe element
  gui.innerHTML = `
    <h4>JSRTC Corrupter</h4>
    <label for="corruptionRange">Corruption Level: <span id="levelDisplay">0.3</span></label>
    <input type="range" id="corruptionRange" min="0" max="1" step="0.01" value="0.3" />

    <label id="incrementalLabel">
      <input type="checkbox" id="incrementalCheckbox" />
      Incremental Corruption
    </label>

    <label for="corruptModeSelect">Corruption Mode:</label>
    <select id="corruptModeSelect">
      <option value="both">Both</option>
      <option value="math">Math Only</option>
      <option value="dom">DOM Only</option>
    </select>

    <label for="intervalRange">Interval (ms): <span id="intervalValue">1000</span></label>
    <input type="range" id="intervalRange" min="100" max="5000" step="100" value="1000" disabled />

    <div id="buttonContainer">
      <button id="pauseBtn" disabled>Pause</button>
      <button id="resumeBtn" disabled>Resume</button>
    </div>

    <button id="corruptBtn">Corrupt Now</button>
  `;
  document.body.appendChild(gui);

  const corruptionRange = document.getElementById("corruptionRange");
  const levelDisplay = document.getElementById("levelDisplay");
  const corruptBtn = document.getElementById("corruptBtn");
  const incrementalCheckbox = document.getElementById("incrementalCheckbox");
  const intervalRange = document.getElementById("intervalRange");
  const intervalValue = document.getElementById("intervalValue");
  const corruptModeSelect = document.getElementById("corruptModeSelect");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");

  let incrementalIntervalId = null;
  let isPaused = false;

  // Track protected keys and objects to skip corruption
  const protectedKeys = new Set([
    "corruptorGUI",
    "corruptBtn",
    "corruptionRange",
    "incrementalCheckbox",
    "intervalRange",
    "corruptModeSelect",
    "pauseBtn",
    "resumeBtn",
    "levelDisplay",
    "intervalValue",
    "buttonContainer",
  ]);
  let internalCallFlag = false;

  function isSafeElement(el) {
    return el && el.closest && el.closest('[data-corruptor-safe="true"]');
  }

  function corruptMath(level) {
    if (internalCallFlag) return; 

    internalCallFlag = true;
    const originalMath = { ...Math };
    window.Math = new Proxy(originalMath, {
      get(target, prop) {
        const orig = target[prop];
        if (typeof orig === "function") {
          return function (...args) {
            if (internalCallFlag) {
              return orig.apply(target, args);
            }
            internalCallFlag = true;
            const result = orig.apply(target, args);
            internalCallFlag = false;
            const error = (Math.random() * 2 - 1) * level * (Math.abs(result) + 1);
            return result + error;
          };
        } else if (typeof orig === "number") {
          const error = (Math.random() * 2 - 1) * level * orig;
          return orig + error;
        }
        return orig;
      },
    });

    const originalValueOf = Number.prototype.valueOf;
    Number.prototype.valueOf = function () {
      if (internalCallFlag) return originalValueOf.call(this);
      internalCallFlag = true;
      const val = originalValueOf.call(this);
      internalCallFlag = false;
      const error = (Math.random() * 2 - 1) * level * (Math.abs(val) + 1);
      return val + error;
    };
    internalCallFlag = false;
  }

  function corruptDOM(level) {
    const keys = Object.keys(window);
    const targetKeys = keys.filter((k) => Math.random() < level && !protectedKeys.has(k));
    targetKeys.forEach((key) => {
      try {
        const rand = Math.random();
        if (typeof window[key] === "function" && rand < 0.5) {
          window[key] = () => console.log(`Function ${key} has been corrupted.`);
        } else if (typeof window[key] === "object" && rand < 0.8) {
          window[key] = null;
        } else if (typeof window[key] === "number") {
          window[key] = Math.floor(Math.random() * 99999);
        }
      } catch (e) {
        console.warn(`Could not corrupt ${key}:`, e);
      }
    });

    const allElems = document.querySelectorAll("*");
    for (let i = 0; i < allElems.length * level; i++) {
      const el = allElems[Math.floor(Math.random() * allElems.length)];
      if (!el) continue;
      if (isSafeElement(el)) continue;

      const rand = Math.random();
      if (rand < 0.3) {
        el.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
      } else if (rand < 0.6 && el.textContent) {
        const text = el.textContent;
        const corruptionAmount = Math.floor(text.length * level);
        const chars = text.split("");
        const garbageChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        for (let i = 0; i < corruptionAmount; i++) {
          const idx = Math.floor(Math.random() * chars.length);
          const randChar = garbageChars.charAt(Math.floor(Math.random() * garbageChars.length));
          chars[idx] = randChar;
        }
        el.textContent = chars.join("");
      } else {
        el.remove();
      }
    }
  }

  function corruptNow(level) {
    const mode = corruptModeSelect.value;
    if (mode === "math") {
      corruptMath(level);
      console.log("Math corruption executed.");
    } else if (mode === "dom") {
      corruptDOM(level);
      console.log("DOM corruption executed.");
    } else {
      corruptDOM(level);
      corruptMath(level);
      console.log("Both Math + DOM corruption executed.");
    }
  }

  function startIncremental() {
    if (incrementalIntervalId) clearInterval(incrementalIntervalId);
    incrementalIntervalId = setInterval(() => {
      corruptNow(parseFloat(corruptionRange.value));
    }, parseInt(intervalRange.value));
    isPaused = false;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }

  function stopIncremental() {
    if (incrementalIntervalId) {
      clearInterval(incrementalIntervalId);
      incrementalIntervalId = null;
    }
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
  }

  corruptionRange.addEventListener("input", (e) => {
    levelDisplay.textContent = e.target.value;
  });

  intervalRange.addEventListener("input", (e) => {
    intervalValue.textContent = e.target.value;
    if (incrementalCheckbox.checked && incrementalIntervalId && !isPaused) {
      startIncremental();
    }
  });

  incrementalCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      intervalRange.disabled = false;
      pauseBtn.disabled = true;
      resumeBtn.disabled = true;
      stopIncremental();
    } else {
      intervalRange.disabled = true;
      stopIncremental();
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (incrementalIntervalId && !isPaused) {
      clearInterval(incrementalIntervalId);
      isPaused = true;
      pauseBtn.disabled = true;
      resumeBtn.disabled = false;
      console.log("Incremental corruption paused.");
    }
  });

  resumeBtn.addEventListener("click", () => {
    if (incrementalCheckbox.checked && isPaused) {
      startIncremental();
      console.log("Incremental corruption resumed.");
    }
  });

  corruptBtn.addEventListener("click", () => {
    const level = parseFloat(corruptionRange.value);
    if (incrementalCheckbox.checked) {
      if (incrementalIntervalId) {
        startIncremental();
      } else {
        startIncremental();
      }
    } else {
      corruptNow(level);
    }
  });
})();
