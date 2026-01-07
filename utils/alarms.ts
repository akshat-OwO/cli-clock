import type {
  ASCIIFontRenderable,
  BoxRenderable,
  CliRenderer,
  KeyEvent,
} from "@opentui/core";
import * as hintsUtility from "./hints";

let renderer: CliRenderer | null = null;
let container: BoxRenderable | null = null;
let hour: ASCIIFontRenderable | null = null;
let minute: ASCIIFontRenderable | null = null;
let second: ASCIIFontRenderable | null = null;
let period: ASCIIFontRenderable | null = null;

export interface Alarm {
  id: string;
  hour: string;
  minute: string;
  second: string;
  period: "AM" | "PM" | null;
  is12Hour: boolean;
  triggered?: boolean;
}

let selectedPosition: number = 0;
let is12HourMode: boolean = false;
let digitBuffer: string = "";
let isSecondDigit: boolean = false;

const DEFAULT_COLOR = "#ffffff";
const SELECTED_COLOR = "#00A300";

let keyHandler: ((key: KeyEvent) => void) | null = null;
let onAlarmSave: ((alarm: Alarm) => void) | null = null;
let onExit: (() => void) | null = null;

function keyNavigation(key: KeyEvent) {
  if (!hour || !minute || !second || !period) return;

  const positionCount = is12HourMode ? 4 : 3;

  if (key.name === "s") {
    saveAlarm();
    return;
  }

  if (key.name === "left" || key.name === "h") {
    selectedPosition = (selectedPosition - 1 + positionCount) % positionCount;
    digitBuffer = "";
    isSecondDigit = false;
    updateSelectedDigit();
  } else if (key.name === "right" || key.name === "l") {
    selectedPosition = (selectedPosition + 1) % positionCount;
    digitBuffer = "";
    isSecondDigit = false;
    updateSelectedDigit();
  } else if (key.name === "up" || key.name === "k") {
    incrementDigit();
  } else if (key.name === "down" || key.name === "j") {
    decrementDigit();
  } else if (key.number) {
    handleNumberInput(parseInt(key.sequence));
  }
}

function updateSelectedDigit() {
  if (!hour || !minute || !second || !period) return;

  hour.color = selectedPosition === 0 ? SELECTED_COLOR : DEFAULT_COLOR;
  minute.color = selectedPosition === 1 ? SELECTED_COLOR : DEFAULT_COLOR;
  second.color = selectedPosition === 2 ? SELECTED_COLOR : DEFAULT_COLOR;

  if (is12HourMode) {
    period.color = selectedPosition === 3 ? SELECTED_COLOR : DEFAULT_COLOR;
  }
}

export function setIs12HourMode(value: boolean) {
  is12HourMode = value;
  if (container) {
    container.title = "set new alarm";
  }
  updateSelectedDigit();
}

function incrementDigit() {
  if (!hour || !minute || !second || !period) return;

  switch (selectedPosition) {
    case 0: {
      const h = parseInt(hour.text);
      const max = is12HourMode ? 12 : 23;
      const next = (h % max) + 1;
      hour.text = String(next).padStart(2, "0");
      break;
    }
    case 1: {
      const m = parseInt(minute.text);
      const next = (m + 1) % 60;
      minute.text = String(next).padStart(2, "0");
      break;
    }
    case 2: {
      const s = parseInt(second.text);
      const next = (s + 1) % 60;
      second.text = String(next).padStart(2, "0");
      break;
    }
    case 3: {
      if (is12HourMode) {
        period.text = period.text === "AM" ? "PM" : "AM";
      }
      break;
    }
  }
}

function decrementDigit() {
  if (!hour || !minute || !second || !period) return;

  switch (selectedPosition) {
    case 0: {
      const h = parseInt(hour.text);
      const max = is12HourMode ? 12 : 23;
      const next = h === 1 ? max : h - 1;
      hour.text = String(next).padStart(2, "0");
      break;
    }
    case 1: {
      const m = parseInt(minute.text);
      const next = m === 0 ? 59 : m - 1;
      minute.text = String(next).padStart(2, "0");
      break;
    }
    case 2: {
      const s = parseInt(second.text);
      const next = s === 0 ? 59 : s - 1;
      second.text = String(next).padStart(2, "0");
      break;
    }
    case 3: {
      if (is12HourMode) {
        period.text = period.text === "AM" ? "PM" : "AM";
      }
      break;
    }
  }
}

function handleNumberInput(num: number) {
  if (!hour || !minute || !second) return;

  const positionCount = is12HourMode ? 4 : 3;

  if (!isSecondDigit) {
    digitBuffer = String(num);
    isSecondDigit = true;
    
    switch (selectedPosition) {
      case 0: {
        const max = is12HourMode ? 12 : 23;
        hour.text = String(num).padStart(2, "0");
        break;
      }
      case 1: {
        minute.text = String(num).padStart(2, "0");
        break;
      }
      case 2: {
        second.text = String(num).padStart(2, "0");
        break;
      }
    }
  } else {
    digitBuffer += String(num);
    const value = parseInt(digitBuffer);
    
    switch (selectedPosition) {
      case 0: {
        const max = is12HourMode ? 12 : 23;
        const validValue = value <= max ? value : max;
        hour.text = String(validValue).padStart(2, "0");
        
        if (selectedPosition < positionCount - 1) {
          selectedPosition++;
        }
        break;
      }
      case 1: {
        const validValue = value <= 59 ? value : 59;
        minute.text = String(validValue).padStart(2, "0");
        
        if (selectedPosition < positionCount - 1) {
          selectedPosition++;
        }
        break;
      }
      case 2: {
        const validValue = value <= 59 ? value : 59;
        second.text = String(validValue).padStart(2, "0");
        
        if (selectedPosition < positionCount - 1) {
          selectedPosition++;
        }
        break;
      }
    }
    
    digitBuffer = "";
    isSecondDigit = false;
    updateSelectedDigit();
  }
}

function saveAlarm() {
  if (!hour || !minute || !second || !period) return;

  const alarm: Alarm = {
    id: Date.now().toString(),
    hour: hour.text,
    minute: minute.text,
    second: second.text,
    period: is12HourMode ? (period.text === "AM" ? "AM" : "PM") : null,
    is12Hour: is12HourMode,
  };

  if (container) {
    container.title = `alarm saved: ${alarm.hour}:${alarm.minute}:${alarm.second}${alarm.period ? " " + alarm.period : ""}`;
  }

  if (onAlarmSave) {
    onAlarmSave(alarm);
  }

  setTimeout(() => {
    if (onExit) {
      onExit();
    }
  }, 2000);
}

export function initialize(
  rendererInstance: CliRenderer,
  containerInstance: BoxRenderable,
  hourInstance: ASCIIFontRenderable,
  minuteInstance: ASCIIFontRenderable,
  secondsInstance: ASCIIFontRenderable,
  periodTextInstance: ASCIIFontRenderable,
  is12Hour: boolean,
  alarmSaveCallback: (alarm: Alarm) => void,
  exitCallback: () => void,
) {
  renderer = rendererInstance;
  container = containerInstance;
  hour = hourInstance;
  minute = minuteInstance;
  second = secondsInstance;
  period = periodTextInstance;
  is12HourMode = is12Hour;
  selectedPosition = 0;
  digitBuffer = "";
  isSecondDigit = false;
  onAlarmSave = alarmSaveCallback;
  onExit = exitCallback;

  hintsUtility.showHints("alarm");
  container.border = true;
  container.borderColor = "#00A300";
  container.title = "set new alarm";

  updateSelectedDigit();

  if (!keyHandler) {
    keyHandler = keyNavigation;
    renderer.keyInput.on("keypress", keyHandler);
  }
}

export function triggerAlarmNotification(alarm: Alarm) {
  const timeStr = `${alarm.hour}:${alarm.minute}:${alarm.second}${alarm.period ? " " + alarm.period : ""}`;

  try {
    Bun.spawn(["notify-send", "CLI Clock Alarm", `Time: ${timeStr}`], {
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export function destroy() {
  hintsUtility.showHints("default");
  if (container) {
    container.border = false;
    container.title = "";
  }

  if (hour) hour.color = DEFAULT_COLOR;
  if (minute) minute.color = DEFAULT_COLOR;
  if (second) second.color = DEFAULT_COLOR;
  if (period) period.color = DEFAULT_COLOR;

  if (renderer && keyHandler) {
    renderer.keyInput.off("keypress", keyHandler);
    keyHandler = null;
  }

  hour = null;
  minute = null;
  second = null;
  period = null;
  renderer = null;
  container = null;
  onAlarmSave = null;
  onExit = null;
}
