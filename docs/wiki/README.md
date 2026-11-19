# docs/wiki — dsh-ui-cell 组件 Wiki

shadcn 式的新手教程 + 可视组件文档站。

## 怎么看

| 内容 | 入口 |
|---|---|
| **组件文档站**（用法 + 实时效果 + 暗色切换） | [`index.html`](./index.html)（自包含单文件，双击打开即可；重建：`DSH_CHECKOUT=<checkout> pnpm docs:build`） |
| **新手教程**（从安装到跑起第一个面板） | [01-新手教程.md](./01-新手教程.md) |
| **token 纪律与升级**（两道闸 + 上游同步流程） | [02-token纪律与升级.md](./02-token纪律与升级.md) |
| **依赖分层**（atom/content 两档 + add 的依赖交接 + bundle 影响） | [03-依赖分层.md](./03-依赖分层.md) |
| **间距与动效规范**（官方底座 + 本仓刻度 + 归一规则 + 护栏） | [04-间距与动效规范.md](./04-间距与动效规范.md) |
| **DSH 升级 SOP**（维护者用：八步流程 + 发版清单 + 十个教训 + 常见上游变化对照） | [05-DSH升级SOP.md](./05-DSH升级SOP.md) |

## 站点的三个「真」

1. **真组件**：demo 源直接 `import ../../src/*`，不是手仿的静态 markup
2. **真转换**：本仓源的 `.css` 导入由 esbuild 插件现场调 `buildStyleModule`（`duc-` 前缀 +
   类名表），即 **add 交付给插件的同一条管线**——你在站点里看到的就是插件会拿到的样式
3. **真主题**：token 从 `DSH_CHECKOUT` 的 ui-theme styles 全量拼装（含明暗两套），
   侧栏右上角的切换按钮 = 宿主同机制的 `body[data-ds-dark-theme]`

## 演示的四条约定（2026-11-18 起，第四条 2026-11-19 补）

1. **每种状态标出配色构成**：像 Tag 的 neutral / quiet、Pill 的未激活这类「安静档」，
   底色本来就与面板同色或只差几个百分点，**肉眼看不出差别不等于组件坏了**。
   演示里给每个状态配一行构成说明（背景 token / 字色 / 描边），
   让差别写在明面上，而不是让读者去猜。
2. **安静档要说明它为什么安静**：这类状态的设计意图就是「不抢眼」（幽灵态、纯文字），
   演示里要写清它靠什么显形（hover 底色、激活态描边），否则会被当成样式缺失。
3. **窄列要写 `align-items: flex-start`**：组件 + 说明文字这种「上面组件、下面注解」的列
   是 `flex-direction: column`，默认 `align-items: stretch` 会把里面的组件拉成整行宽
   （Tag / Pill 这类按内容宽度收缩的胶囊会被撑成一条）。不写这一条，组件就不再
   「自适应内容宽度」了 —— 那是演示的锅，不是组件的。
4. **插槽内容不必自己写字号**：组件**内部**文字都钉在 `--dsw-font-*` 档位，
   但插槽里的 DOM（Modal 正文、卡片段落……）是**消费端自己写的**，跟真插件一样
   继承宿主的字号。站点的 `body` 已设 14px（模拟 DSH 应用的
   `--dsh-content-font-size` 默认值），所以演示里的段落照常写就行；
   组件自身的字号不要在演示里改（那是组件的账，不是演示的）。

## 结构

```
docs/wiki/
├── README.md            # 本文件
├── index.html           # 组件文档站（生成物，勿手改；pnpm docs:build 重建）
├── 01-新手教程.md        # shadcn 式上手教程
├── 02-token纪律与升级.md  # 两道闸 + 命名空间 + DSH 升级同步流程
├── 03-依赖分层.md        # atom/content 两档 + add 的依赖交接 + bundle 影响
├── 04-间距与动效规范.md   # 官方分工 + 间距刻度 + 动效档位 + 组合值例外 + 护栏
├── 05-DSH升级SOP.md      # 维护者用：升级八步流程 + 发版清单（判据看 registry）+ 十个教训
└── demos/               # 文档站源码：demo.tsx（shell）+ demo-cell.tsx（Demo 原语）
                          # + 五个分类的演示（atoms/containers/overlays/inputs/content）
                          # + spec.tsx（间距刻度与动效档位的可看效果）
```

## 维护约定

- 加新组件：`src/` 里落地并登记 registry.json → 在 `demos/` 对应分类补一个 section
  （typecheck 会兜住 props 拼写）→ `pnpm docs:build` 重建 index.html
- 站点构建需要 `DSH_CHECKOUT`（token 同源），与 vendor 同一个环境变量
- `index.html` 是生成物：每次重建后随源一起提交，GitHub Pages 可直接指向本目录
