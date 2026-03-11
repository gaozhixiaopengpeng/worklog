# Worklog MVP 设计

目标：
在 **2 周内完成可用版本**。

核心功能：

1. 获取 Git commit
2. 获取 commit diff
3. AI 生成日报
4. CLI 命令调用

---

# MVP功能范围

必须实现：

### 1 获取 Git Commit

支持：

* 本地 Git 仓库
* GitHub
* GitLab

示例：

```
git log --since="today"
```

获取信息：

```
commit id
author
date
message
```

---

### 2 获取代码 diff

示例：

```
git show <commit>
```

或者

```
git diff HEAD~1
```

获取：

* 修改文件
* 代码变更

---

### 3 AI 生成日报

输入：

```
commit message
diff
```

输出：

```
1. 完成用户登录功能
2. 修复支付异常
3. 优化列表加载速度
```

---

### 4 CLI 使用

示例：

```
worklog today
```

输出：

```
今日工作总结
```

---

# MVP不做的功能

第一版 **不做**：

* UI界面
* 团队管理
* 自动发送日报
* 多人协作
* SaaS平台

只做：

**CLI 单机工具**
