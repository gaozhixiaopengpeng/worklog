import { saveLastReportOutput } from '../utils/last-output.js';
import { maybeCopyToClipboard } from './copy-support.js';

/** 展示用：去掉「建议的 commit message」标题行及与交互提示相关的条目 */
export function filterCommitMessageDisplay(msg: string): string {
  return msg
    .split('\n')
    .filter((line) => !line.includes('统一提交确认提示'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 打印过滤后的 commit message、写入 copy 缓存，并按需复制到剪贴板 */
export async function publishCommitMessageForCopy(
  raw: string,
  postAction: string | undefined
): Promise<void> {
  const shown = filterCommitMessageDisplay(raw);
  process.stdout.write('\n' + shown + '\n\n');
  await saveLastReportOutput(shown);
  await maybeCopyToClipboard(postAction, shown);
}
