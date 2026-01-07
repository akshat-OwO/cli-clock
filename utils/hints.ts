import {
  TextRenderable,
  BoxRenderable,
  CliRenderer,
  bold,
  t,
} from "@opentui/core";

export type HintItem = {
  key: string;
  label: string;
};

export type HintConfig = {
  id: string;
  hints: HintItem[];
};

const DEFAULT_HINTS: HintConfig = {
  id: "default",
  hints: [
    { key: "a", label: "set new alarm" },
    { key: "t", label: "change time format" },
    { key: "q", label: "quit" },
  ],
};

const ALARM_HINTS: HintConfig = {
  id: "alarm",
  hints: [
    { key: "s", label: "save alarm" },
    { key: "esc", label: "cancel" },
    { key: "↑/↓", label: "change value" },
    { key: "←/→", label: "select digit" },
    { key: "0-9", label: "direct input" },
    { key: "t", label: "change time format" },
    { key: "q", label: "quit" },
  ],
};

let renderer: CliRenderer | null = null;
let container: BoxRenderable | null = null;
let currentHints: Map<string, TextRenderable> = new Map();
let configs: Map<string, HintConfig> = new Map();
let currentConfigId: string | null = null;

configs.set("default", DEFAULT_HINTS);
configs.set("alarm", ALARM_HINTS);

export function initialize(
  rendererInstance: CliRenderer,
  containerInstance: BoxRenderable,
) {
  if (renderer !== null) {
    destroy();
  }
  renderer = rendererInstance;
  container = containerInstance;
  showHints("default");
}

export function addConfig(config: HintConfig) {
  configs.set(config.id, config);
}

export function removeConfig(configId: string) {
  configs.delete(configId);
}

export function showHints(configId: string) {
  const config = configs.get(configId);
  if (!config || !renderer || !container) return;

  if (currentConfigId === configId) return;

  clearHints();
  currentConfigId = configId;

  config.hints.forEach((hint) => {
    const textRenderable = new TextRenderable(renderer!, {
      id: `${configId}-${hint.key}-hint`,
      content: t`${bold(`${hint.key}:`)} ${hint.label}`,
    });
    container!.add(textRenderable);
    currentHints.set(hint.key, textRenderable);
  });
}

export function clearHints() {
  currentHints.forEach((renderable) => {
    renderable.destroy();
  });
  currentHints.clear();
}

export function destroy() {
  clearHints();
  renderer = null;
  container = null;
  currentConfigId = null;
}
