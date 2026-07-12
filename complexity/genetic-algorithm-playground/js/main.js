import { bindEvents } from "./ui/events.js";
import { updateProblemUI } from "./ui/problemUI.js";
import { clearOutput } from "./ui/results.js";

updateProblemUI();
clearOutput();
bindEvents();
