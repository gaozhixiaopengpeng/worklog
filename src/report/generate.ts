/**
 * 格式化最终输出（stdout 用）
 * language:
 * - 默认 zh：中文标题
 * - 例如 en：英文标题
 */
export function formatReportTitle(
  kind: 'today' | 'day' | 'week' | 'month',
  language: string = 'zh'
): string {
  const lang = language.toLowerCase();
  const isEn = lang === 'en';

  if (kind === 'month') {
    return isEn ? "This Month's Work Summary:" : '本月工作总结:';
  }
  if (kind === 'week') {
    return isEn ? "This Week's Work Summary:" : '本周工作总结:';
  }
  if (kind === 'day') {
    return isEn ? "Work Summary for Selected Day:" : '指定日期工作总结:';
  }
  // today
  return isEn ? "Today's Work Summary:" : '今日工作总结:';
}

/**
 * 无 AI 时的占位输出
 */
export function fallbackReport(commitMessages: string[]): string {
  if (commitMessages.length === 0) return '(所选时间范围内无 commit，无法生成总结)\n';
  const lines = commitMessages.map((m, i) => `${i + 1}. ${m}`);
  return '今日工作 (仅 commit 摘要，未调用 AI): \n\n' + lines.join('\n') + '\n';
}
