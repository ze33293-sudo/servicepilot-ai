# 3 分钟演示视频制作与交付

ServicePilot AI 的产品演示采用 Ink Press 视觉语言，由 Remotion 生成。画面使用本项目真实 Web Demo 的 2× 截图，客户、订单、企业制度和 ROI 数据全部为虚构演示内容。

## 交付物

| 交付物 | 路径 | 说明 |
|---|---|---|
| 最终成片 | `video/out/servicepilot-ai-demo-final.mp4` | 1920×1080、30fps、约 180 秒；H.264 + AAC；包含可开关简体中文字幕轨 |
| 烧录字幕成片 | `video/out/servicepilot-ai-demo.mp4` | 画面已显示完整中文旁白字幕 |
| 外挂字幕 | `video/subtitles/servicepilot-ai.zh-CN.srt` | UTF-8 简体中文 |
| 旁白稿 | `video/narration/voiceover.md` | 17 个定时段落 |
| 旁白时间数据 | `video/narration/segments.json` | 供 Remotion 和字幕生成脚本共用 |
| 封面图 | `video/cover.png` | 1920×1080 |
| 视频工程 | `video/src/` | 可复现的 Remotion 源码 |

`video/out/` 属于本地渲染产物，不提交 Git；最终成片通过 GitHub Release 分发。

## 时间结构

| 时间 | 内容 |
|---|---|
| 0:00—0:12 | 品牌开场与本地优先定位 |
| 0:12—0:44 | 自动分类、P0—P3 与信息抽取 |
| 0:44—1:10 | 分类感知 RAG、引用允许列表与原文来源 |
| 1:10—1:48 | 工单创建、查询、乐观锁状态更新与审计轨迹 |
| 1:48—2:25 | 敏感场景、低置信度、工具重试失败与 40 条评测 |
| 2:25—2:40 | 同一 Bad Case 的 Baseline → Optimized 对比 |
| 2:40—2:54 | 架构、人机协作闭环与模拟 ROI |
| 2:54—3:00 | 品牌收尾 |

## 本地重渲染

要求：Node.js、npm、FFmpeg。首次进入 `video/` 后运行：

```powershell
npm install
npm run typecheck
npm run render
```

生成 Windows 离线中文旁白、字幕和旁白稿：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate_voiceover.ps1
```

批量渲染入口、中段和停留帧：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\render_qa_stills.ps1
```

给成片挂载可开关字幕轨：

```powershell
ffmpeg -i .\out\servicepilot-ai-demo.mp4 `
  -i .\subtitles\servicepilot-ai.zh-CN.srt `
  -map 0:v -map 0:a -map 1:0 `
  -c:v copy -c:a copy -c:s mov_text `
  -metadata:s:s:0 language=zho `
  .\out\servicepilot-ai-demo-final.mp4
```

## 真实页面素材映射

- 智能受理与自动处理：`video/public/textures/intake-full.png`
- 敏感问题转人工：`video/public/textures/handoff-full.png`
- 工具两次失败：`video/public/textures/failure-full.png`
- 工单队列与状态更新：`video/public/textures/queue-full.png`
- 40 条评测与 ROI：`video/public/textures/insights-full.png`
- 精确裁切位置：`video/public/textures/layout.json`

截图由 `video/scripts/capture.py` 在 1920×1080 视口、2× device scale 下从本地 Demo 捕获。

## 音频与版权

- 中文旁白使用 Windows 本地语音离线合成，不调用云端服务。
- 成片只使用轻量转场、点击、冲击和氛围音效，不使用背景音乐。
- 音效来源和许可记录见 `video/public/audio/ATTRIBUTION.md`。

## 终检基线

- FFprobe：180.05 秒、1920×1080、30fps、H.264、48kHz 双声道 AAC。
- 音频积分响度：`-23.1 LUFS`；真峰值：`-3.0 dBFS`，无削波。
- 预览阶段检查 25 张静帧；修正版从最终 MP4 解码 29 张关键帧再次检查。
- 最终 MP4 另由独立审查 Agent 按带帧号规范检查。

最终终检结论及复核帧见 [视频终检报告](VIDEO_QA.md)。
