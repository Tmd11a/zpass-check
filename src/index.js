#!/usr/bin/env node
import zxcvbn from 'zxcvbn';
import chalk from 'chalk';
import { Command } from 'commander';


const program = new Command();
program
.name('zpass-check')
.version('1.1.0')
.option('-p, --password <pwd>', 'password to check (one-shot)')
.option('--json', 'output JSON (one-shot mode)')
.option('--emoji', 'add emoji indicator to output')
.option('-n, --no-color', 'disable colorized output')
.option('-s, --short', 'short output (score only)')
.parse(process.argv);


const opts = program.opts();


const COLORS = [
x => x,
chalk.red,
chalk.redBright,
chalk.yellow,
chalk.green,
chalk.greenBright,
];
const EMOJIS = ['🔴', '🟠', '🟡', '🟢', '🔵'];


function colorForScore(score, noColor = false) {
if (noColor) return x => x;
return COLORS[Math.min(5, Math.max(0, score + 1))];
}


function barFromScore(score, width = 20) {
const filled = Math.round(((score + 1) / 5) * width);
return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
}


function emojiForScore(score) {
return EMOJIS[Math.max(0, Math.min(score, 4))];
}


function prettyPrintResult(pwd, res, { noColor = false, short = false, emoji = false } = {}) {
const color = colorForScore(res.score, noColor);
const emojiSymbol = emoji ? `${emojiForScore(res.score)} ` : '';


if (short) {
console.log(`${emojiSymbol}${res.score}`);
return;
}
console.log('');
const masked = '*'.repeat(Math.max(1, pwd.length));
console.log(`Password: ${noColor ? masked : chalk.gray(masked)}`);
console.log(color(`${emojiSymbol}Score: ${res.score} / 4 [${barFromScore(res.score)}]`));
console.log(`Estimated crack time (offline slow hash): ${res.crack_times_display.offline_slow_hashing_1e4_per_second}`);
if (res.feedback && (res.feedback.warning || (res.feedback.suggestions && res.feedback.suggestions.length))) {
if (res.feedback.warning) console.log(chalk.yellow(`Warning: ${res.feedback.warning}`));
if (res.feedback.suggestions && res.feedback.suggestions.length) {
console.log(chalk.gray('Suggestions:'));
for (const s of res.feedback.suggestions) console.log(chalk.gray(` - ${s}`));
}
} else {
console.log(chalk.gray('No suggestions — looks good.'));
}
console.log('');
}


function printJSON(res) {
const out = {
score: res.score,
guesses: res.guesses,
crack_times_display: res.crack_times_display,
feedback: res.feedback,
};
console.log(JSON.stringify(out, null, 2));
}


if (opts.password) {
const res = zxcvbn(opts.password);
if (opts.json) printJSON(res);
else prettyPrintResult(opts.password, res, { noColor: opts.noColor, short: opts.short, emoji: opts.emoji });
process.exit(0);
}


console.log(chalk.cyan('zpass-check — live interactive mode'));
console.log(chalk.dim('Type your password. Backspace edits. Enter to finish. Ctrl+C to exit.'));


const stdin = process.stdin;
if (!stdin.isTTY) {
console.error('Interactive mode requires a TTY. Use -p/--password for non-interactive.');
process.exit(1);
}
stdin.setRawMode(true);
redraw();