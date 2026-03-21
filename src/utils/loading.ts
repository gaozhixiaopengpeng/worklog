/** 进度提示写到 stderr，避免污染 stdout 的正式输出 */
export function startLoading(message: string): () => void {
  let stopped = false;
  process.stderr.write(message);
  const interval = setInterval(() => {
    if (stopped) return;
    process.stderr.write('.');
  }, 1000);
  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(interval);
    process.stderr.write('\n');
  };
}
