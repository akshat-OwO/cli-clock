import {
  createCliRenderer,
  CliRenderer,
  BoxRenderable,
  ASCIIFontRenderable,
} from "@opentui/core";
import { readArgs } from "./utils/args";
import * as hintsUtility from "./utils/hints";
import * as alarmsUtility from "./utils/alarms";
import type { Alarm } from "./utils/alarms";

/* variables */
let renderer: CliRenderer | null = null;
let container: BoxRenderable | null = null;
let timerContainer: BoxRenderable | null = null;
let separator1: ASCIIFontRenderable | null = null;
let separator2: ASCIIFontRenderable | null = null;
let hour: ASCIIFontRenderable | null = null;
let minute: ASCIIFontRenderable | null = null;
let seconds: ASCIIFontRenderable | null = null;
let interval: NodeJS.Timeout | null = null;
let hintsContainer: BoxRenderable | null = null;
let period: "AM" | "PM" = "AM";
let periodText: ASCIIFontRenderable | null = null;
let is12Hour: boolean = false;
let isAlarmMode: boolean = false;
let globalAlarms: Alarm[] = [];
let alarmCheckInterval: NodeJS.Timeout | null = null;

function getCurrentTime() {
  const now = new Date();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  if (is12Hour) {
    period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
  }

  if (periodText) {
    periodText.visible = is12Hour;
    periodText.text = period;
  }

  return {
    hours: String(hours).padStart(2, "0"),
    minutes,
    seconds,
  };
}

function updateTime() {
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    const time = getCurrentTime();
    if (hour) hour.text = time.hours;
    if (minute) minute.text = time.minutes;
    if (seconds) seconds.text = time.seconds;
  }, 1000);
}

function pauseTime() {
  if (interval) clearInterval(interval);
  interval = null;
}

function run(rendererInstance: CliRenderer) {
  renderer = rendererInstance;
  renderer.start();

  /* add container to root */
  container = new BoxRenderable(renderer, {
    id: "container",
    position: "relative",
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  });
  renderer.root.add(container);

  /* hints container */
  hintsContainer = new BoxRenderable(renderer, {
    id: "hints-container",
    position: "absolute",
    width: "100%",
    bottom: 1,
    right: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  });
  container.add(hintsContainer);

  /* initialize hints utility */
  hintsUtility.initialize(renderer, hintsContainer);

  /* timer container */
  timerContainer = new BoxRenderable(renderer, {
    id: "timer-container",
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  });
  container.add(timerContainer);

  const time = getCurrentTime();

  /* hour text */
  hour = new ASCIIFontRenderable(renderer, {
    id: "hour-text",
    text: time.hours,
    font: "tiny",
  });
  timerContainer.add(hour);

  /* separator */
  separator1 = new ASCIIFontRenderable(renderer, {
    id: "separator-1",
    text: ":",
    font: "tiny",
    color: "#b7b7b7",
  });
  timerContainer.add(separator1);

  /* minute text */
  minute = new ASCIIFontRenderable(renderer, {
    id: "minute-text",
    text: time.minutes,
    font: "tiny",
  });
  timerContainer.add(minute);

  /* separator */
  separator2 = new ASCIIFontRenderable(renderer, {
    id: "separator-2",
    text: ":",
    font: "tiny",
    color: "#b7b7b7",
  });
  timerContainer.add(separator2);

  /* seconds text */
  seconds = new ASCIIFontRenderable(renderer, {
    id: "second-text",
    text: time.seconds,
    font: "tiny",
  });
  timerContainer.add(seconds);

  periodText = new ASCIIFontRenderable(renderer, {
    id: "period-text",
    text: period,
    font: "tiny",
    maxHeight: 5,
    visible: is12Hour,
    color: "#b7b7b7",
    marginLeft: 1,
  });
  timerContainer.add(periodText);

  updateTime();
}

function startAlarmChecking() {
  if (alarmCheckInterval) return;
  
  alarmCheckInterval = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    globalAlarms.forEach((alarm) => {
      let alarmHour = parseInt(alarm.hour);
      const alarmMinute = parseInt(alarm.minute);
      const alarmSecond = parseInt(alarm.second);

      if (alarm.is12Hour && alarm.period === "PM" && alarmHour !== 12) {
        alarmHour += 12;
      } else if (alarm.is12Hour && alarm.period === "AM" && alarmHour === 12) {
        alarmHour = 0;
      }

      const alarmTimeInSeconds = alarmHour * 3600 + alarmMinute * 60 + alarmSecond;
      const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

      if (currentTimeInSeconds === alarmTimeInSeconds) {
        if (!alarm.triggered) {
          alarm.triggered = true;
          alarmsUtility.triggerAlarmNotification(alarm);
        }
      } else if (currentTimeInSeconds > alarmTimeInSeconds) {
        alarm.triggered = false;
      }
    });
  }, 1000);
}

function setupKeybinds(rendererInstance: CliRenderer) {
  rendererInstance.keyInput.on("keypress", (key) => {
    if (key.name === "q" || (key.name === "c" && key.ctrl)) {
      destroy();
    } else if (key.name === "a") {
      pauseTime();
      isAlarmMode = true;
      if (renderer && container && hour && minute && seconds && periodText) {
        alarmsUtility.initialize(
          renderer,
          container,
          hour,
          minute,
          seconds,
          periodText,
          is12Hour,
          (alarm: Alarm) => {
            globalAlarms.push(alarm);
            startAlarmChecking();
          },
          () => {
            hintsUtility.showHints("default");
            updateTime();
            alarmsUtility.destroy();
            isAlarmMode = false;
          },
        );
      }
    } else if (key.name === "escape") {
      hintsUtility.showHints("default");
      updateTime();
      alarmsUtility.destroy();
      isAlarmMode = false;
    } else if (key.name === "t") {
      is12Hour = !is12Hour;
      const time = getCurrentTime();
      if (hour) hour.text = time.hours;
      if (minute) minute.text = time.minutes;
      if (seconds) seconds.text = time.seconds;

      if (isAlarmMode) {
        alarmsUtility.setIs12HourMode(is12Hour);
      }
    }
  });
}

function destroy() {
  container?.destroy();

  container = null;
  hintsContainer = null;
  is12Hour = false;
  isAlarmMode = false;
  period = "AM";
  periodText = null;
  timerContainer = null;
  hour = null;
  minute = null;
  seconds = null;
  separator1 = null;
  separator2 = null;
  if (interval) clearInterval(interval);
  interval = null;
  if (alarmCheckInterval) clearInterval(alarmCheckInterval);
  alarmCheckInterval = null;

  hintsUtility.destroy();

  renderer?.destroy();
  renderer = null;
}

if (import.meta.main) {
  const { values } = readArgs();
  if (values["12h"]) {
    is12Hour = true;
  }
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
  });
  run(renderer);
  setupKeybinds(renderer);
}
