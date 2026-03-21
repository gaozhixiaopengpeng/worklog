import type { Command } from 'commander';
import { copyToClipboard } from '../utils/clipboard.js';
import { readLastReportOutput } from '../utils/last-output.js';

/** 子命令末尾可选位置参数的唯一合法取值 */
export const POST_ACTION_COPY = 'copy';

export const ARG_POST_ACTION_COPY = '[postAction]';

export const DESC_POST_ACTION_COPY_REPORT =
  '传入 copy 则在输出后同时写入系统剪贴板';

export const DESC_POST_ACTION_COPY_COMMIT =
  '传入 copy 则在展示 message 后同时写入系统剪贴板';

export function assertOptionalCopyWord(
  cliName: string,
  postAction: string | undefined,
  commandName: string
): boolean {
  if (postAction === undefined) return true;
  if (postAction === POST_ACTION_COPY) return true;
  process.stderr.write(
    `未知参数 "${postAction}"；若需在生成后复制到剪贴板，请使用: ${cliName} ${commandName} ${POST_ACTION_COPY}\n`
  );
  process.exitCode = 1;
  return false;
}

export async function maybeCopyToClipboard(
  postAction: string | undefined,
  text: string
): Promise<void> {
  if (postAction !== POST_ACTION_COPY) return;
  try {
    await copyToClipboard(text);
    process.stderr.write('已复制到剪贴板。\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write('复制到剪贴板失败: ' + msg + '\n');
    process.exitCode = 1;
  }
}

/**
 * 校验末尾 `copy` 后执行 producer，再按需写入剪贴板。
 * producer 须负责写入 stdout 与 `saveLastReportOutput`（若适用）。
 */
export async function runWithCopyPostAction(
  cliName: string,
  commandName: string,
  postAction: string | undefined,
  producer: () => Promise<string>
): Promise<void> {
  if (!assertOptionalCopyWord(cliName, postAction, commandName)) return;
  const text = await producer();
  await maybeCopyToClipboard(postAction, text);
}

export async function readStdinUtf8(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function registerCopyCommand(program: Command, cliName: string): void {
  program
    .command('copy')
    .description(
      '复制到系统剪贴板：可用管道、--text，或复制最近一次报表 / commit message 等缓存正文'
    )
    .option('-t, --text <string>', '直接复制该字符串（无需管道）')
    .action(async (opts: { text?: string }) => {
      let content: string;
      if (opts.text !== undefined) {
        content = opts.text;
      } else if (process.stdin.isTTY) {
        const last = await readLastReportOutput();
        if (last !== null) {
          content = last;
        } else {
          process.stderr.write(
            `没有可复制的缓存内容。请先在同一台机器上执行 ${cliName} day / week / month / commit 生成输出，或使用：\n` +
              `  ${cliName} day | ${cliName} copy\n` +
              `  ${cliName} copy --text "一段说明"\n`
          );
          process.exitCode = 1;
          return;
        }
      } else {
        content = await readStdinUtf8();
        if (content === '') {
          const last = await readLastReportOutput();
          if (last !== null) {
            content = last;
          } else {
            process.stderr.write(
              `标准输入为空，且没有已缓存内容。请使用：\n` +
                `  ${cliName} day | ${cliName} copy\n` +
                `  ${cliName} copy --text "一段说明"\n`
            );
            process.exitCode = 1;
            return;
          }
        }
      }
      try {
        await copyToClipboard(content);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        process.stderr.write('复制到剪贴板失败: ' + msg + '\n');
        process.exitCode = 1;
        return;
      }
      process.stderr.write('已复制到剪贴板。\n');
    });
}
