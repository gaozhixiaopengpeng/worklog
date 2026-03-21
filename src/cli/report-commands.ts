import type { Command } from 'commander';
import {
  ARG_POST_ACTION_COPY,
  DESC_POST_ACTION_COPY_REPORT,
  runWithCopyPostAction,
} from './copy-support.js';
import {
  runReport,
  type ReportPromptName,
  type ReportTitleKind,
} from '../report/run-report.js';
import {
  dayRange,
  monthRange,
  todayRange,
  weekRange,
  type IsoTimeRange,
} from '../utils/time-range.js';

type ReportOpts = { repo: string; provider?: string; lang?: string };

function withReportArguments(cmd: Command, description: string): Command {
  return cmd.description(description).argument(
    ARG_POST_ACTION_COPY,
    DESC_POST_ACTION_COPY_REPORT
  );
}

function withReportOptions(cmd: Command): Command {
  return cmd
    .option('-r, --repo <path>', '仓库路径', process.cwd())
    .option(
      '--lang <code>',
      '输出语言代码（默认 zh 中文，如：en 表示仅英文）'
    )
    .option('--provider <name>', 'AI 提供方: openai（默认）| deepseek');
}

export function registerReportCommands(
  program: Command,
  cliName: string,
  applyProvider: (provider?: string) => void
): void {
  withReportOptions(
    withReportArguments(
      program.command('day'),
      '生成今日或指定日期日报'
    ).option('-d, --date <yyyy-mm-dd>', '日期（留空则为今天）')
  ).action(
    async (
      postAction: string | undefined,
      opts: ReportOpts & { date?: string }
    ) => {
      await runWithCopyPostAction(cliName, 'day', postAction, async () => {
        applyProvider(opts.provider);
        const { since, until } = opts.date ? dayRange(opts.date) : todayRange();
        const titleKind: ReportTitleKind = opts.date ? 'day' : 'today';
        return runReport(
          opts.repo,
          since,
          until,
          'daily',
          titleKind,
          opts.lang
        );
      });
    }
  );

  const fixed: Array<{
    name: string;
    description: string;
    range: () => IsoTimeRange;
    prompt: ReportPromptName;
    title: ReportTitleKind;
  }> = [
    {
      name: 'week',
      description: '生成本周工作周报',
      range: weekRange,
      prompt: 'weekly',
      title: 'week',
    },
    {
      name: 'month',
      description: '生成本月工作月报',
      range: monthRange,
      prompt: 'monthly',
      title: 'month',
    },
  ];

  for (const spec of fixed) {
    withReportOptions(
      withReportArguments(program.command(spec.name), spec.description)
    ).action(async (postAction: string | undefined, opts: ReportOpts) => {
      await runWithCopyPostAction(cliName, spec.name, postAction, async () => {
        applyProvider(opts.provider);
        const { since, until } = spec.range();
        return runReport(opts.repo, since, until, spec.prompt, spec.title, opts.lang);
      });
    });
  }
}
