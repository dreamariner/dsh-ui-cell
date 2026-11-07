# docs/wiki — dsh-ui-cell 组件 Wiki

shadcn 式的新手教程 + 可视组件文档站。

## 怎么看

| 内容 | 入口 |
|---|---|
| **组件文档站**（用法 + 实时效果 + 暗色切换） | [`index.html`](./index.html)（自包含单文件，双击打开即可；重建：`DSH_CHECKOUT=<checkout> pnpm docs:build`） |
| **新手教程**（从安装到跑起第一个面板） | [01-新手教程.md](./01-新手教程.md) |
| **token 纪律与升级**（两道闸 + 上游同步流程） | [02-token纪律与升级.md](./02-token纪律与升级.md) |
| **依赖分层**（atom/content 两档 + add 的依赖交接 + bundle 影响） | [03-依赖分层.md](./03-依赖分层.md) |

## 站点的三个「真」

1. **真组件**：demo 源直接 `import ../../src/*`，不是手仿的静态 markup
2. **真转换**：本仓源的 `.css` 导入由 esbuild 插件现场调 `buildStyleModule`（`duc-` 前缀 +
   类名表），即 **add 交付给插件的同一条管线**——你在站点里看到的就是插件会拿到的样式
3. **真主题**：token 从 `DSH_CHECKOUT` 的 ui-theme styles 全量拼装（含明暗两套），
   右上角「切换暗色」按钮 = 宿主同机制的 `body[data-ds-dark-theme]`

## 结构

```
docs/wiki/
├── README.md            # 本文件
├── index.html           # 组件文档站（生成物，勿手改；pnpm docs:build 重建）
├── 01-新手教程.md        # shadcn 式上手教程
├── 02-token纪律与升级.md  # 两道闸 + 命名空间 + DSH 升级同步流程
├── 03-依赖分层.md        # atom/content 两档 + add 的依赖交接 + bundle 影响
├── demo.tsx             # 站点 shell（侧栏 + 快速开始 + 组装各分类）
├── demo-cell.tsx         # Demo 原语（用法 + 效果 + 代码三段式）
└── demos/               # 五个分类的演示源（atoms/containers/overlays/inputs/content）
```

## 维护约定

- 加新组件：`src/` 里落地并登记 registry.json → 在 `demos/` 对应分类补一个 section
  （typecheck 会兜住 props 拼写）→ `pnpm docs:build` 重建 index.html
- 站点构建需要 `DSH_CHECKOUT`（token 同源），与 vendor 同一个环境变量
- `index.html` 是生成物：每次重建后随源一起提交，GitHub Pages 可直接指向本目录
