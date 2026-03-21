import { getCommits } from '../git/log.js';
import { getDiffsForCommits } from '../git/diff.js';
import { formatCommitList } from '../utils/format.js';
import { summarize } from '../ai/summarize.js';
import { formatReportTitle, fallbackReport } from './generate.js';
import { saveLastReportOutput } from '../utils/last-output.js';
import { startLoading } from '../utils/loading.js';

export type ReportPromptName = 'daily' | 'weekly' | 'monthly';
export type ReportTitleKind = 'today' | 'day' | 'week' | 'month';

/** 返回与写入 stdout 一致的完整文本，并写入「上次报表」缓存供 copy 使用 */
export async function runReport(
  repo: string,
  since: string,
  until: string,
  promptName: ReportPromptName,
  titleKind: ReportTitleKind,
  language?: string
): Promise<string> {
  const commits = await getCommits(repo, since, until);
  if (commits.length === 0) {
    const title = formatReportTitle(titleKind, language);
    const rest = '（所选时间范围内无 commit）\n';
    const full = title + rest;
    process.stdout.write(title);
    process.stdout.write(rest);
    await saveLastReportOutput(full);
    return full;
  }
  const commitList = formatCommitList(commits);
  let report: string;
  const stopLoading = startLoading(
    '正在根据 commit 与 diff 调用 AI 生成工作报告，可能需要数秒'
  );
  try {
    const diffBlock = await getDiffsForCommits(repo, commits);
    report = await summarize(promptName, commitList, diffBlock, language);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('OPEN_AI_API_KEY') ||
      msg.includes('DEEPSEEK_API_KEY') ||
      msg.includes('AI_PROVIDER')
    ) {
      report = fallbackReport(commits.map((c) => c.message));
      process.stderr.write('提示: ' + msg + '\n');
    } else {
      stopLoading();
      throw e;
    }
  }
  stopLoading();
  const header = '\n' + formatReportTitle(titleKind, language) + '\n\n';
  const body = report + '\n';
  const full = header + body;
  process.stdout.write(header);
  process.stdout.write(body);
  await saveLastReportOutput(full);
  return full;
}
