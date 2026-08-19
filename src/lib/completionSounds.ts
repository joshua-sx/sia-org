import { play } from "cuelume";

/**
 * Short, low-volume feedback for intentional completion events. Keeping the
 * library behind these helpers prevents navigation and ordinary UI controls
 * from accidentally becoming noisy.
 */
export function playSuccessCue() {
  play("success", { volume: 0.24 });
}

export function playSetupCompleteCue() {
  play("ready", { volume: 0.3 });
}
