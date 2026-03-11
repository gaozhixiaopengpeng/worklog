# Worklog 技术架构

整体架构：

```
CLI
 ↓
Git Parser
 ↓
Diff Analyzer
 ↓
AI Summary
 ↓
Report Generator
```

---

# 技术栈

Node.js CLI

核心库：

* commander（CLI框架）
* simple-git（Git操作）
* axios（API请求）

---

# 模块设计

## CLI模块

负责解析命令：

```
worklog today
worklog week
```

---

## Git模块

读取：

```
git log
git diff
```

---

## AI模块

输入：

```
commit
diff
```

输出：

```
工作总结
```

---

## Report模块

输出格式：

```
日报
周报
Markdown
```

---

# 代码结构

```
worklog
 ├─ bin
 │   └─ worklog
 ├─ src
 │   ├─ cli
 │   ├─ git
 │   ├─ ai
 │   ├─ report
 │   └─ utils
 ├─ package.json
 └─ README.md
```
