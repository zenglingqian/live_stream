# 今晚去哪播？——直播平台选择分析报告

一个纯静态的单页数据报告站点，对比 **抖音 / 虎牙 / 微信视频号 / 小红书** 四家平台在 **35 类直播**场景下的适配度，给出选型结论、类目准入、门槛成本与风险清单。

- 线上地址：<https://live-platform-report-tlnf9rzuoui.qoder.zone/>
- 界面语言：简体中文（默认）、繁體中文、English、日本語、Русский
- 外观：浅色（默认）/ 深色可切换，落后于日落的时段会弹出深色建议

## 目录结构

```
.
├─ web/                       # 站点根目录：发布与预览都只看这里
│  ├─ index.html              # 唯一页面（内容 + 样式 + 图表脚本内联）
│  ├─ i18n.js                 # 由 i18n/build.py 生成的产物，不要手改
│  ├─ bg-light.jpg / bg-dark.jpg   # 首屏背景（浅色 / 深色各一张）
│  └─ vendor/chart.umd.min.js # Chart.js 4.4.7，本地 vendored，不走 CDN
├─ i18n/                      # 多语言：引擎模板 + 词表 + 构建/校验脚本
└─vibe_images/               # 背景图的生成源文件（未发布）
```

页面包含 11 个结论章节（`h2`）、13 张对比表格、6 个 Chart.js 图表。

## 本地运行

没有构建步骤、没有 `package.json`、没有需要安装的依赖。

```bash
# 方式一：直接双击/打开
open web/index.html          # Windows: start web\index.html

# 方式二：起一个静态服务（推荐，localStorage 与相对路径行为更接近线上）
python -m http.server 8000 --directory web
# 然后访问 http://localhost:8000/
```

## 多语言系统

### 文件职责

| 文件 | 作用 |
| --- | --- |
| `i18n/strings.json` | 待翻译清单：`{ total, chars, strings: [{ zh, where }] }`，`zh` 就是页面里出现的简体原文 |
| `i18n/zh-TW.json` `en.json` `ja.json` `ru.json` | 各语言的扁平字典：`{ "简体原文": "译文" }`，键必须与 `strings.json` 逐字一致 |
| `i18n/engine.template.js` | 翻译引擎源码（人工维护的地方） |
| `i18n/build.py` | 把字典内联进模板，生成 `web/i18n.js` |
| `i18n/verify.py` | 覆盖率检查：缺键 / 多键 / 空值 / 未翻译 |

翻译全部由人工撰写，未使用机器翻译服务；每个语言 376 条键。

### 常用命令

```bash
python i18n/build.py            # 改完字典或引擎后重新生成 web/i18n.js
python i18n/verify.py all       # 四个语言一起体检
python i18n/verify.py ru        # 只看俄语
```

`verify.py` 正常输出形如 `ru: need 376 have 376 missing 0 extra 0 empty 0 untranslated 0`。
其中 `zh-TW` 的 `untranslated` 约 22 条是正常的——那些串简繁同形（如「专业号」「GMV」），原文即译文。

### 运行时机制（改引擎前必读）

- **原文即键**：不做占位符改造，运行时用 `TreeWalker` 扫文本节点，再用简体原文去字典里查；`[aria-label]` / `[title]` 属性同样翻译。
- **幂等靠 WeakMap**：每个文本节点/属性的原始中文第一次遇到时缓存进 `SRC` / `ASRC`，因此任意语言之间来回切换都从原始中文重新派生，不会出现"译文套译文"。新增翻译路径时请沿用这两个缓存，不要直接读 `node.nodeValue`。
- **`SUPP` 覆盖表优先于字典**：单位后缀、图表坐标轴这类需要按语言特殊处理的短串走 `SUPP`，它总是赢。
- **`data-no-i18n` 不参与翻译**：导航品牌字、首屏艺术字标题、语言菜单本身（各语言用自己的文字书写，这是有意保留中文的原因）。
- **图表跟随语言重绘**：每个 Chart 实例上缓存 `__src`（原始 `labels` 与 `dataset.label`），切语言时回填译文并 `update('none')`；字体只通过 `Chart.defaults.font.family` 全局切换。**不要**改 `options.scales.r.pointLabels`——那是个 options 对象而不是数组，赋值会触发 Chart.js Proxy 递归并报 `Maximum call stack size exceeded`。
- **数字单位按语言换算**：`I18N.num.yi(亿值)` 在中日输出「亿」，在英俄把量级换算成 `B`/`млрд`；俄语复数走 `ruPlural()`，所以「18 категорий / 1 категория」这类形式正确。

对外只有 `window.I18N` 一个全局：

```js
I18N.T('原文')            // 查当前语言译文
I18N.lang()              // 当前语言码
I18N.set('en')           // 切换
I18N.langs               // ['zh-CN','zh-TW','en','ja','ru']
I18N.num.yi(10)          // 亿 → '100 億' / '1B' / '1 млрд'
I18N.chartFont()         // 当前语言的图表字体栈
I18N.boot()              // 引擎自己挂到 DOMContentLoaded 上调用（页面脚本无需调用，
                         // 这样图表初始化用的仍是简体原文，随后整体换语言）
```

### 新增一条文案

1. 在 `web/index.html` 里写简体原文；
2. 把同一段原文补进 `i18n/strings.json` 和四个字典（译文可以留空，先跑通）；
3. `python i18n/build.py && python i18n/verify.py all`；
4. 打开页面切到 English 和 Русский，肉眼检查是否还有漏翻的中文残留——`verify.py` 只能证明字典齐了，证明不了页面里出现了新串。

### 新增一种语言

改三处：`i18n/build.py` 的 `LOCALES`、`i18n/engine.template.js` 的 `LANGS` / `TITLES` / `DESCS` / `CODE` / `FONT_LANG`（以及需要时的 `SUPP`），再补一个 `<locale>.json`，最后在 `web/index.html` 的语言菜单里加一个 `.lang-item[data-lang="<locale>"]`。

## 设计与交互约定

- 设计语言参考 Apple 产品发布页：单一约束列宽 `--col: 1068px`、发丝线 `--hairline`、胶囊控件 `border-radius: 980px`、毛玻璃 `saturate(180%) blur(20px)`，动效时长统一走 `--t-mid` / `--ease` / `--site-motion` 变量。
- 首屏背景不加遮罩，滚出首屏后才淡入磨砂遮罩（线性过渡），深浅两版背景图对应两套主题。
- 深色模式：用户点切换，或日落后浏览一段时间弹出询问；选择记在 `localStorage` 的 `site-theme`，弹询问只问一次（`theme-prompt-dismissed`）。
- 移动端自动适配（`is-mobile` 类 + `MOBILE_MQ`）：图表关闭 `maintainAspectRatio`、表格横向滚动并冻结首列、导航可横滑、语言按钮收成语言码。

## 发布

站点通过 Qoder Sites 发布，发布目录只有 `web/`（`webDirectory: "web"`，`spa: false`），因此 `i18n/`、`vibe_images/` 不会进入线上包。

```
准备 → 校验产物 → 写入描述文件 → 发布 → 线上一致性核对
```

线上 `index.html` 会被宿主注入一段 `<script data-qoder-watermark="v1">`，对比线上与本地字节时先剥掉这一段，其余应当完全一致。改动 `i18n/` 或 `web/index.html` 后必须重新跑 `build.py` 再发布，否则线上仍是旧产物。

> GitHub Pages：仓库 `origin` 指向 `zenglingqian/live_stream`。项目根目录原先有个跳转到 `web/index.html` 的 `index.html`，已按需求移除；如果之后仍要用 GitHub Pages，请把站点源指向 `/web` 目录，否则根路径会 404。

## 数据口径说明

- 数据以平台官方公告、财报与第三方（QuestMobile 等）测算为主，来源在页面每节末尾列出。
- 2025–2026 各家规则变动频繁（免佣终止、公会开放、AI 内容标注义务等），签约与投放前以官方后台为准。
- 存在口径分歧处页面已注明，例如小红书 MAU 官方 3.5–4 亿（含海外）与 QuestMobile 国内 2.42 亿相差近一倍，图表取国内可比口径；电商 GMV 无官方披露，份额图采用站内直播口径估算。
