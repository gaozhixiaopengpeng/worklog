#!/usr/bin/env node
import path from 'node:path';
import { createInterface } from 'readline';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import {
  getWorkingDiff,
  type WorkingDiffMode,
} from '../git/working-diff.js';
import {
  ARG_POST_ACTION_COPY,
  DESC_POST_ACTION_COPY_COMMIT,
  assertOptionalCopyWord,
  runWithCopyPostAction,
  registerCopyCommand,
} from './copy-support.js';
import { registerReportCommands } from './report-commands.js';
import { generateCommitMessageWithCopy } from './commit-generate.js';

/** 全局安装时可为 workpilot 或 wp；本地 node 入口为 index，统一显示为 workpilot */
function cliCommandName(): string {
  const { name } = path.parse(process.argv[1] ?? '');
  if (!name || name === 'index' || name === 'node') return 'workpilot';
  return name;
}

const cliName = cliCommandName();

const program = new Command();
program
  .name(cliName)
  .description('根据 Git commit 与 diff 用 AI 生成工作日报/周报/月报')
  .version('0.1.0');

function applyProvider(provider?: string): void {
  if (provider) {
    process.env.AI_PROVIDER = provider;
  }
}

registerReportCommands(program, cliName, applyProvider);

function askLine(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

program
  .command('commit')
  .description('根据 diff 用 AI 生成 commit message，确认后提交（需已暂存）')
  .argument(ARG_POST_ACTION_COPY, DESC_POST_ACTION_COPY_COMMIT)
  .option('-r, --repo <path>', '仓库路径', process.cwd())
  .option(
    '--staged',
    '仅使用暂存区 diff（默认 auto：有暂存则用暂存，否则用工作区 diff 仅生成不提交）'
  )
  .option(
    '--work',
    '仅使用未暂存 diff（只生成 message，不执行 git commit）'
  )
  .option('--no-commit', '只生成并打印 message，不提交')
  .option('--provider <name>', 'AI 提供方: openai（默认）| deepseek')
  .action(
    async (
      postAction: string | undefined,
      opts: {
        repo: string;
        staged?: boolean;
        work?: boolean;
        commit?: boolean;
        provider?: string;
      }
    ) => {
      if (!assertOptionalCopyWord(cliName, postAction, 'commit')) return;
      applyProvider(opts.provider);
      const repo = opts.repo;
      const git = simpleGit(repo);
      const status = await git.status();
      const hasStaged = status.staged.length > 0;
      const hasUnstaged =
        status.not_added.length > 0 ||
        status.modified.length > 0 ||
        status.deleted.length > 0 ||
        status.renamed.length > 0;

      let mode: WorkingDiffMode = 'auto';
      if (opts.work) mode = 'unstaged';
      else if (opts.staged) mode = 'staged';

      const shouldAskAddFirst =
        mode === 'auto' && hasUnstaged && !hasStaged;
      if (shouldAskAddFirst) {
        const addAnswer = await askLine(
          '检测到未暂存变更，是否需要先执行 git add -A? [Y/N] '
        );
        if (addAnswer.toLowerCase() === 'y' || addAnswer.toLowerCase() === 'yes') {
          try {
            await git.add('.');
            process.stdout.write('已执行 git add -A\n');
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            process.stderr.write('git add 失败: ' + msg + '\n');
            process.exitCode = 1;
            return;
          }
          const { diff: stagedDiff } = await getWorkingDiff(repo, 'staged');
          if (!stagedDiff.trim()) {
            process.stderr.write('暂存后无 diff，请检查。\n');
            process.exitCode = 1;
            return;
          }
          const stagedResult = await generateCommitMessageWithCopy(
            stagedDiff,
            '正在根据暂存区 diff 调用 AI 生成 commit message，请等待',
            postAction
          );
          if (!stagedResult.ok) return;
          const stagedMessage = stagedResult.message;
          const commitAnswer = await askLine(
            '是否使用上述 message 提交暂存区? [Y/N] '
          );
          if (
            commitAnswer.toLowerCase() !== 'y' &&
            commitAnswer.toLowerCase() !== 'yes'
          ) {
            process.stdout.write('已取消提交。\n');
            return;
          }
          try {
            await git.commit(stagedMessage);
            process.stdout.write('已提交。\n');
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            process.stderr.write('git commit 失败: ' + msg + '\n');
            process.exitCode = 1;
          }
          return;
        }
      }

      const { diff, source } = await getWorkingDiff(repo, mode);
      if (!diff.trim()) {
        if (mode === 'staged' && hasUnstaged && !hasStaged) {
          process.stderr.write(
            '当前没有任何暂存的改动，但检测到未暂存变更。\n' +
              `请先使用 git add 将需要提交的改动暂存后，再运行 ${cliName} commit --staged，\n` +
              '或去掉 --staged，仅基于工作区改动生成提交信息（不会自动提交）。\n'
          );
        } else {
          process.stderr.write('没有可分析的 diff（工作区与暂存区均无变更）。\n');
        }
        process.exitCode = 1;
        return;
      }

      const isUnstagedOnly =
        (mode === 'auto' && source === 'unstaged') || mode === 'unstaged';
      if (isUnstagedOnly) {
        const unstagedResult = await generateCommitMessageWithCopy(
          diff,
          '正在根据未暂存 diff 调用 AI 生成 commit message，可能需要数秒',
          postAction
        );
        if (!unstagedResult.ok) return;
        process.stdout.write(
          `当前 diff 来自未暂存变更，未执行提交。请先 git add 后使用 ${cliName} commit\n`
        );
        return;
      }

      const mainResult = await generateCommitMessageWithCopy(
        diff,
        '正在根据 diff 调用 AI 生成 commit message，可能需要数秒',
        postAction
      );
      if (!mainResult.ok) return;
      const message = mainResult.message;

      const noCommit = opts.commit === false || opts.work;
      if (noCommit || source !== 'staged') {
        if (source !== 'staged') {
          process.stdout.write(
            `当前 diff 来自未暂存变更，未执行提交。请先 git add 后使用 ${cliName} commit\n`
          );
        } else {
          process.stdout.write('已使用 --no-commit，未执行提交。\n');
        }
        return;
      }

      const answer = await askLine('是否使用上述 message 提交暂存区? [Y/N] ');
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        process.stdout.write('已取消提交。\n');
        return;
      }

      try {
        await git.commit(message);
        process.stdout.write('已提交。\n');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        process.stderr.write('git commit 失败: ' + msg + '\n');
        process.exitCode = 1;
      }
    }
  );

registerCopyCommand(program, cliName);

program.parse();
