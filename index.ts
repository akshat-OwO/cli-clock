import {
  createCliRenderer,
  CliRenderer,
  BoxRenderable,
  TextRenderable,
  TextAttributes,
  ASCIIFontRenderable,
} from "@opentui/core";

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

function getCurrentTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return {
    hours,
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
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  });
  renderer.root.add(container);

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

  updateTime();
}

function setupKeybinds(rendererInstance: CliRenderer) {
  rendererInstance.keyInput.on("keypress", (key) => {
    if (key.name === "q") {
      destroy();
    }
  });
}

function destroy() {
  container?.destroy();

  container = null;
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
  const renderer = await createCliRenderer();
  run(renderer);
  setupKeybinds(renderer);
}
