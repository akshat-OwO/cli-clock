import {
  createCliRenderer,
  CliRenderer,
  BoxRenderable,
  ASCIIFontRenderable,
  TextRenderable,
  bold,
  t,
} from "@opentui/core";
import { readArgs } from "./utils/args";

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
let hints: {
  quit: TextRenderable | null;
  alarm: TextRenderable | null;
  format: TextRenderable | null;
} = {
  quit: null,
  alarm: null,
  format: null,
};

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
  interval = setInterval(() => {
    const time = getCurrentTime();
    if (hour) hour.text = time.hours;
    if (minute) minute.text = time.minutes;
    if (seconds) seconds.text = time.seconds;
  }, 1000);
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

  /* hints setup */
  hints = {
    alarm: new TextRenderable(renderer, {
      id: "alarm-text",
      content: t`${bold("a:")} set new alarm`,
    }),
    format: new TextRenderable(renderer, {
      id: "format-text",
      content: t`${bold("t:")} change time format`,
    }),
    quit: new TextRenderable(renderer, {
      id: "quit-text",
      content: t`${bold("q:")} quit`,
    }),
  };

  Object.entries(hints).forEach(([, renderable]) => {
    hintsContainer?.add(renderable);
  });

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

function setupKeybinds(rendererInstance: CliRenderer) {
  rendererInstance.keyInput.on("keypress", (key) => {
    if (key.name === "q" || (key.name === "c" && key.ctrl)) {
      destroy();
    } else if (key.name === "a") {
      console.log("set new alarm...");
    } else if (key.name === "t") {
      is12Hour = !is12Hour;
      const time = getCurrentTime();
      if (hour) hour.text = time.hours;
      if (minute) minute.text = time.minutes;
      if (seconds) seconds.text = time.seconds;
    }
  });
}

function destroy() {
  container?.destroy();

  container = null;
  hintsContainer = null;
  ((is12Hour = false), (period = "AM"));
  periodText = null;
  hints = {
    quit: null,
    alarm: null,
    format: null,
  };
  timerContainer = null;
  hour = null;
  minute = null;
  seconds = null;
  separator1 = null;
  separator2 = null;
  if (interval) clearInterval(interval);
  interval = null;

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
