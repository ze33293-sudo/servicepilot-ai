---
name: "ServicePilot AI"
description: "本地优先、可信可审计的企业售后工单运营工作台"
colors:
  commander-blue: "#1e40af"
  commander-blue-deep: "#172f86"
  signal-blue: "#3b82f6"
  focus-blue: "#2563eb"
  handoff-amber: "#b45309"
  warning-amber-deep: "#9a4d00"
  closure-green: "#087a55"
  escalation-red: "#b42318"
  cool-mist: "#f5f7fb"
  work-surface: "#ffffff"
  work-surface-soft: "#f8fafc"
  deep-ink: "#132143"
  muted-slate: "#526078"
  cool-border: "#d8e2f1"
typography:
  headline:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "clamp(22px, 2.3vw, 30px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
  control:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
  metadata:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.35
  comparison-title:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  metric-compact:
    fontFamily: "Cascadia Code, SFMono-Regular, Consolas, monospace"
    fontSize: "clamp(20px, 6vw, 23px)"
    fontWeight: 700
    lineHeight: 1.2
  data:
    fontFamily: "Cascadia Code, SFMono-Regular, Consolas, monospace"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  compact: "7px"
  control: "8px"
  field: "9px"
  state: "10px"
  callout: "11px"
  navigation: "12px"
  panel: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.commander-blue}"
    textColor: "{colors.work-surface}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.commander-blue-deep}"
    textColor: "{colors.work-surface}"
  button-secondary:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.commander-blue}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
    height: "46px"
  text-field:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "44px"
  tab-active:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.commander-blue}"
    rounded: "{rounded.control}"
    padding: "8px 18px"
    height: "44px"
  status-chip:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.muted-slate}"
    rounded: "{rounded.pill}"
    padding: "7px 11px"
  panel:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
---

# Design System: ServicePilot AI

## Overview

**Creative North Star: "可信赖的运营驾驶舱"**

ServicePilot AI 是一套克制、可信、清晰且数据密集的运营界面。它像一张始终可核验的工单控制台：主要动作明确，状态信号稳定，业务证据与操作轨迹能被快速扫描，不用视觉噱头替代信息层级。

视觉系统以冷雾背景、白色工作面和深墨文本建立安静基底，以指挥蓝组织操作焦点，并让接管琥珀、闭环绿和升级红只承担真实状态含义。界面明确拒绝消费级聊天气泡、霓虹科幻感、营销式渐变和装饰性玻璃效果。

**Key Characteristics:**

- 高密度但不拥挤的双栏运营布局。
- 由语义色、清晰边界和可审计数据组成的可信反馈。
- 中文界面字体负责阅读，等宽字体只标记证据与数据。
- 桌面端并置操作与结果，移动端按任务顺序纵向展开。

## Colors

颜色以低饱和冷中性色承载大面积界面，以少量高辨识度语义色表达操作、接管、成功和风险。

### Primary

- **指挥蓝** (`#1e40af`)：主按钮、已选导航、关键指标与可操作链接的统一主色。
- **深舱蓝** (`#172f86`)：指挥蓝的悬停状态，强化动作反馈但不引入新色相。
- **信号蓝** (`#3b82f6`)：品牌标记的亮部与必要的次级蓝色信号。
- **焦点蓝** (`#2563eb`)：键盘焦点轮廓，必须在所有交互控件上保持可见。

### Secondary

- **接管琥珀** (`#b45309`)：人工接管、模拟假设和需要关注但非错误的强调。
- **深预警琥珀** (`#9a4d00`)：待人工指标和更高对比度的预警数字。

### Tertiary

- **闭环绿** (`#087a55`)：本地服务可用、自动处理成功和已通过状态。
- **升级红** (`#b42318`)：失败、危险、输入错误与必须升级处理的状态。

### Neutral

- **冷雾背景** (`#f5f7fb`)：页面底色，降低长时间操作的视觉疲劳。
- **白色工作面** (`#ffffff`)：面板、输入和已选导航的主要承载面。
- **柔白工作面** (`#f8fafc`)：指标单元、次级分组和弱层级背景。
- **深墨文本** (`#132143`)：标题与正文的最高信息对比。
- **静默石板** (`#526078`)：说明、辅助标签与次要元数据。
- **冷灰边界** (`#d8e2f1`)：面板、表格、标签和分隔线的结构边界。

**信号纪律。** 指挥蓝承担主操作和已选状态；接管琥珀、闭环绿、升级红只表达业务语义，不作为大面积装饰。

## Typography

**Display Font:** Segoe UI（中文回退为 Microsoft YaHei UI、Microsoft YaHei）

**Body Font:** Segoe UI（中文回退为 Microsoft YaHei UI、Microsoft YaHei）

**Label/Mono Font:** Cascadia Code（回退为 SFMono-Regular、Consolas）

**Character:** 正文字体中性、紧凑并适合高频运营；等宽字体提供可核验的数据节奏，让工单 ID、指标和工具轨迹一眼区别于说明文字。

### Hierarchy

- **Headline**（700，`clamp(22px, 2.3vw, 30px)`，1.2）：页面和主要任务标题，使用轻微紧字距（`-0.03em`）。
- **Title**（700，20px，1.25）：面板标题与结果区标题。
- **Section Title**（700，16px）：内容分组与结果证据标题。
- **Body**（400，16px，1.55）：表单、说明与主要阅读文本。
- **Label**（700，13px，1.4）：字段标签、指标说明和状态元数据。
- **Control**（700，14px，1.4）：表单字段名、紧凑操作和结果回答。
- **Metadata**（600，12px，1.4）：辅助说明、来源代码和次级状态。
- **Caption**（600，11px，1.35）：空间受限的字段说明和指标单位。
- **Comparison Title**（700，17px，1.3）：优化前后对比模块的唯一标题层级。
- **Metric Compact**（700，`clamp(20px, 6vw, 23px)`，1.2）：移动端运营指标。
- **Data**（700，18px，1.2）：分类结果、优先级、置信度与关键指标；较小的代码值使用同一等宽字体降级到 12px。

**数据即证据。** 等宽字体只用于品牌字标、工单 ID、指标、来源代码与工具轨迹；普通说明和操作文本始终使用界面正文字体。

## Layout

页面使用最大 1480px 的居中工作区，桌面两侧各保留 16px 安全边距，移动端缩为 10px。主要间距以 8px、12px、16px、20px 递进，相关控件紧密成组，面板之间保持 14px 的清晰分隔。

运营指标在宽屏使用四列，在 900px 以下变为两列。智能受理采用表单略宽、结果略窄的双栏结构，并在 900px 以下按“输入 → 结果”顺序纵向排列。评测与 ROI 同样在该断点转为单列；640px 以下，表单、结果摘要、评测指标和 ROI 输入全部单列。360px 以下导航固定为三个等宽标签，所有触控目标至少 44px 高。

**桌面并置，移动顺序。** 宽屏让输入与反馈同时可见；窄屏不压缩内容，而是保持任务顺序和完整信息宽度。

## Elevation & Depth

系统采用“边界定义结构，浅影只提示层级”的混合策略。大多数层级由背景差与 1px 冷灰边界建立；阴影保持低对比，只用于白色工作面、品牌标记和主操作按钮，不用多层投影制造装饰性悬浮。

### Shadow Vocabulary

- **基础面板**（`0 1px 2px rgba(15, 23, 42, .06)`）：静态面板、指标卡与已选导航的轻度分离。
- **品牌信号**（`0 10px 24px rgba(30, 64, 175, .08)`）：仅用于品牌标记的柔和蓝色环境影。
- **主操作抬升**（`0 8px 18px rgba(30, 64, 175, .18)`）：只用于页面当前最重要的主按钮，禁用时移除。

**边界先于阴影。** 先用背景差和 1px 冷灰边框建立层次；阴影只用于品牌标记、基础面板和主操作的轻度抬升。

## Shapes

形状语言以紧凑、略带圆角的矩形为主。主要面板与指标卡使用 14px 圆角，导航容器使用 12px，评测对比区使用 11px，状态分组使用 10px，输入与按钮使用 9px，小型控制使用 7–8px。仅状态标签、计数和服务指示使用 999px 胶囊；大面积容器不得做成胶囊。

边界通常为 1px。分隔线保持冷灰且克制，不通过厚重彩色侧边制造普通卡片的视觉权重。

## Components

组件遵循“克制而果断”：按钮明确、输入框安静、卡片紧凑，状态标签只传达运行状态。

### Buttons

- **Shape:** 紧凑圆角矩形（9px），主次按钮高度 46px，内部留白 10px × 16px。
- **Primary:** 指挥蓝底、白色文字与轻度蓝色抬升；一个操作区域只设置一个主按钮。
- **Hover / Focus:** 悬停切换为深舱蓝；键盘焦点使用 3px 焦点蓝轮廓并外移 2px。
- **Disabled:** 保留按钮位置，透明度降到 65%，移除阴影，并使用等待光标。
- **Secondary / Text:** 次按钮为白底指挥蓝边界；文本按钮使用柔和蓝底，仅服务于示例载入等轻量动作。

### Chips

- **Style:** 13px 半粗体、细边框与胶囊轮廓，文字和背景随状态语义变化。
- **State:** 默认使用白色与静默石板；成功、转人工、失败和模拟假设分别使用对应语义色及其浅色背景。

### Cards / Containers

- **Corner Style:** 主要容器使用柔和面板圆角（14px），内部摘要使用 8–10px。
- **Background:** 主工作面为白色，次级信息区使用柔白工作面。
- **Shadow Strategy:** 默认只使用基础面板浅影，信息分组优先通过边界和背景差建立层级。
- **Border:** 1px 冷灰边界；警示卡可改用同色系浅边界和浅背景。
- **Internal Padding:** 桌面主要面板 20px，移动端 15px；紧凑分组通常为 8–14px。

### Inputs / Fields

- **Style:** 白底、1px 蓝灰边界、9px 圆角、最小高度 44px，左右内边距 12px。
- **Focus:** 3px 焦点蓝外轮廓，保持键盘路径清楚且不改变布局。
- **Error / Disabled:** 错误使用升级红边界和低透明红色外环；异步禁用状态降低透明度并保留原尺寸。

### Navigation

- **Style:** 三项标签位于冷灰蓝容器中，未选项透明，已选项使用白色工作面、指挥蓝文字和基础面板浅影。
- **Behavior:** 悬停只增加轻微白色底；每个标签至少 44px 高。360px 以下使用三个等宽列，禁止横向挤出页面。

### Decision & Evidence

决策横幅用浅语义背景、细边框和明确标题表达自动处理或人工接管。知识回答和引用位于默认阅读层级；信息抽取与工具轨迹保留为可展开审计证据，不与核心决策争夺首屏注意力。

### Browser Surfaces

文本选择使用低透明信号蓝，输入光标使用指挥蓝，滚动条使用静默石板与冷雾背景。浏览器原生表面必须延续同一语义颜色，并保留清晰的键盘焦点。

**状态不装饰。** 胶囊、横幅和语义色必须对应真实运行状态、风险或审核结果；没有状态含义时使用中性色。

## Do's and Don'ts

### Do:

- **Do** 在每个操作区域只保留一个指挥蓝主动作。
- **Do** 让分类、优先级、引用和工具结果以可扫描、可审计的结构呈现。
- **Do** 使用冷灰边界和表面色组织密集信息，再按需增加浅影。
- **Do** 在 900px 和 640px 断点保持任务顺序、44px 触控目标与完整内容宽度。
- **Do** 为成功、预警、危险和人工接管保留稳定且互斥的语义颜色。

### Don't:

- **Don't** 使用消费级聊天气泡承载企业工单工作流。
- **Don't** 使用霓虹科幻、营销式渐变或装饰性玻璃效果暗示 AI 能力。
- **Don't** 把等宽字体扩展到普通说明、长正文或表单标签。
- **Don't** 用胶囊包裹普通容器，或用厚重彩色侧边装饰常规卡片。
- **Don't** 为了桌面密度而在移动端压缩、截断或隐藏关键业务证据。
