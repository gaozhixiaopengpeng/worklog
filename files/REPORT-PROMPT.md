# Worklog 日报生成 Prompt

用于将多个 commit 汇总为日报。

---

# 输入

多个 commit：

```
commit1
commit2
commit3
```

---

# Prompt

```
你是一名技术助理。

根据开发者今天的 Git commit 生成一份工作日报。

要求：

1. 使用简洁中文
2. 不要包含代码
3. 总结为工作事项
4. 每条一句话
5. 不超过5条
6. 适合发给领导

输入：

{commit_list}

输出：

今日工作：

1.
2.
3.
```

---

# 示例输入

```
commit1: implement login API
commit2: fix payment bug
commit3: optimize list performance
```

---

# 示例输出

```
今日工作：

1. 完成用户登录接口开发
2. 修复支付流程中的异常问题
3. 优化列表页面性能
```
