# Worklog AI Prompt 设计

本项目的核心能力是：

**将 Git Commit + Diff 自动生成工作日报。**

因此 Prompt 设计非常关键。

---

# 输入数据结构

AI 输入内容包括：

```
commit message
commit diff
文件变更
```

示例：

```
commit: fix login bug

diff:
src/login.ts
- fix token validation
- add error handling
```

---

# Prompt 设计目标

生成的内容必须：

1. 简洁
2. 适合日报
3. 非技术人员也能看懂
4. 不暴露具体代码细节

---

# Prompt 模板

```
你是一名软件工程师助理。

任务：
根据 Git commit 和代码变更生成工作日报。

要求：
1. 使用简洁中文
2. 总结为工作事项
3. 不要输出代码
4. 每条一句话
5. 不超过5条

输入：

commit message:
{commit_message}

code diff:
{diff}

输出格式：

今日工作：

1.
2.
3.
```

---

# 示例

输入：

```
commit message:
fix login bug

diff:
login.ts
add token validation
```

输出：

```
今日工作：

1. 修复登录模块中的认证问题
2. 优化用户登录流程稳定性
```

---

# 未来优化

未来可以加入：

* 技术型日报
* 领导汇报型日报
* 产品型日报
* 自动周报总结

示例：

```
worklog today --style leader
```
