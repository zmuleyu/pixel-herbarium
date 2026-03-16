import { useState } from "react";

const T = {
  bg: "#0a0c10",
  bgCard: "#0f1218",
  bgHover: "#151a22",
  border: "#1e2530",
  borderBright: "#2a3545",
  deepBlue: "#1a4a7a",
  deepBlueDim: "#0d2540",
  teal: "#00c9a7",
  tealDim: "#00c9a715",
  tealGlow: "#00c9a740",
  gold: "#e8b84b",
  goldDim: "#e8b84b18",
  purple: "#8b5cf6",
  purpleDim: "#8b5cf615",
  coral: "#f97316",
  coralDim: "#f9731615",
  text: "#e8edf5",
  textSub: "#8a97a8",
  textMuted: "#4a5568",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
};

const stages = [
  {
    id: "capture",
    label: "01 · 素材录制",
    color: T.teal,
    colorDim: T.tealDim,
    icon: "◉",
    description: "真人表演采集",
    tracks: [
      {
        type: "deepmotion",
        label: "动作动画",
        color: T.teal,
        steps: [
          { name: "着装规范", detail: "深色紧身服 + 浅色背景，避免遮挡" },
          { name: "全身入镜", detail: "头顶到脚掌始终在画面内" },
          { name: "动作分类录制", detail: "每类动作独立片段：idle / 交互 / 情绪" },
          { name: "帧率要求", detail: "≥30fps，1080p，自然光或均匀补光" },
        ],
      },
      {
        type: "domoai",
        label: "表情参考",
        color: T.gold,
        steps: [
          { name: "上半身特写", detail: "肩膀以上，面部清晰" },
          { name: "表情夸张化", detail: "脸红/害羞/惊喜等需适度夸张以便识别" },
          { name: "10~15秒片段", detail: "每个表情状态一个独立短片段" },
          { name: "参考图准备", detail: "陆知行立绘图（高清PNG）同步准备" },
        ],
      },
    ],
  },
  {
    id: "process",
    label: "02 · AI 处理",
    color: T.purple,
    colorDim: T.purpleDim,
    icon: "⬡",
    description: "双轨并行生成",
    tracks: [
      {
        type: "deepmotion",
        label: "DeepMotion Animate 3D",
        color: T.teal,
        steps: [
          { name: "上传视频", detail: "Web 界面或 REST API（video2anim pipeline）" },
          { name: "参数设置", detail: "开启 Face Tracking + Hand Tracking + Foot Locking" },
          { name: "物理层", detail: "启用 Physics Simulation，消除浮空感" },
          { name: "导出", detail: "FBX（带蒙皮）+ BVH（纯骨骼）双份保留" },
        ],
      },
      {
        type: "domoai",
        label: "DomoAI Character Animator",
        color: T.gold,
        steps: [
          { name: "上传动作参考视频", detail: "Motion Reference Video（真人片段）" },
          { name: "上传角色图", detail: "陆知行立绘 PNG，≤10MB" },
          { name: "选择动漫风格", detail: "Japanese Anime V2.4 或自定义参考图风格" },
          { name: "生成", detail: "风格化动画视频 MP4，720p~4K" },
        ],
      },
    ],
  },
  {
    id: "retarget",
    label: "03 · 重定向",
    color: T.coral,
    colorDim: T.coralDim,
    icon: "⬢",
    description: "骨骼数据转换",
    tracks: [
      {
        type: "deepmotion",
        label: "BVH → Spine 骨骼",
        color: T.teal,
        steps: [
          { name: "Blender 导入 BVH", detail: "File > Import > BVH，骨骼命名检查" },
          { name: "Mixamo 重定向", detail: "FBX 导入 Mixamo 自动绑骨，导出 T-Pose FBX" },
          { name: "骨骼映射", detail: "BVH关节 → Spine骨骼层级手动对照表" },
          { name: "导出关键帧", detail: "抽帧（30fps→12fps）导出 JSON 关键帧数据" },
        ],
      },
      {
        type: "domoai",
        label: "视频 → 关键帧参考",
        color: T.gold,
        steps: [
          { name: "逐帧截图", detail: "用 ffmpeg 按 6fps 提取关键帧图片" },
          { name: "表情标注", detail: "人工标注每帧对应的情感状态标签" },
          { name: "Spine 复刻", detail: "参照截图在 Spine 中 K 帧，约 3~5 帧/表情" },
          { name: "曲线调优", detail: "使用 Spine 贝塞尔曲线平滑表情过渡" },
        ],
      },
    ],
  },
  {
    id: "spine",
    label: "04 · Spine 集成",
    color: T.teal,
    colorDim: T.tealDim,
    icon: "◈",
    description: "状态机构建",
    tracks: [
      {
        type: "unified",
        label: "三轨混合架构",
        color: T.purple,
        steps: [
          { name: "Track 0 · 基础动作", detail: "idle / walk / sit — DeepMotion 生成，循环播放" },
          { name: "Track 1 · 情感叠加", detail: "blush / shy / happy — DomoAI参考K帧，权重混合" },
          { name: "Track 2 · 触发动作", detail: "react / touch / speak — 事件触发，播完归位" },
          { name: "Additive 模式", detail: "Track1/2 使用 additive blend，不打断 Track0" },
        ],
      },
      {
        type: "unified",
        label: "状态机配置",
        color: T.coral,
        steps: [
          { name: "情感权重映射", detail: "LLM classify → {happy:0.8, shy:0.3} → Track1 权重" },
          { name: "过渡曲线", detail: "情感变化用 0.3s ease-in-out 过渡，避免硬切" },
          { name: "Combo 检测", detail: "连续触发同一区域 ≥3 次 → 升级反应动画" },
          { name: "好感度解锁", detail: "L1~L5 阶段对应动画资产分批解锁" },
        ],
      },
    ],
  },
  {
    id: "output",
    label: "05 · 输出资产",
    color: T.gold,
    colorDim: T.goldDim,
    icon: "✦",
    description: "可复用动画库",
    tracks: [
      {
        type: "asset",
        label: "动作资产库",
        color: T.teal,
        steps: [
          { name: "idle_normal.json", detail: "默认待机，呼吸起伏，目光游移" },
          { name: "idle_work.json", detail: "工作陪伴，低头专注，偶尔抬头偷看" },
          { name: "idle_night.json", detail: "深夜模式，慵懒倚靠，眼神朦胧" },
          { name: "react_touch_[zone].json", detail: "按 hitbox 分区分别对应的触碰反应" },
        ],
      },
      {
        type: "asset",
        label: "情感叠加库",
        color: T.gold,
        steps: [
          { name: "emotion_blush.json", detail: "脸红，双手捂脸微低头" },
          { name: "emotion_shy.json", detail: "害羞，目光偏移，小幅度晃动" },
          { name: "emotion_happy.json", detail: "开心，轻微蹦跳，眉眼弯弯" },
          { name: "emotion_story_[L4].json", detail: "告白场景专属动画（好感度解锁）" },
        ],
      },
    ],
  },
];

const emotionMap = [
  { from: "LLM 输出文本", arrow: "→", to: "SillyTavern classify", color: T.teal },
  { from: "classify 结果", arrow: "→", to: "{emotion: 'shy', intensity: 0.7}", color: T.purple },
  { from: "intensity 权重", arrow: "→", to: "Spine Track1.setAlpha(0.7)", color: T.gold },
  { from: "Track 混合", arrow: "→", to: "渲染帧输出", color: T.coral },
];

const actionMap = [
  { action: "idle", track: 0, blend: "loop", source: "DeepMotion" },
  { action: "blush", track: 1, blend: "additive", source: "DomoAI参考" },
  { action: "touch_head", track: 2, blend: "oneshot", source: "DeepMotion" },
  { action: "speak", track: 2, blend: "oneshot", source: "TTS口型" },
  { action: "confession", track: "0+1+2", blend: "exclusive", source: "手工K帧" },
];

export default function WorkflowDiagram() {
  const [activeStage, setActiveStage] = useState(null);
  const [activeTab, setActiveTab] = useState("pipeline");

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: T.sans,
      color: T.text,
      padding: "32px 24px",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto 40px" }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{
              fontFamily: T.mono, fontSize: 10, color: T.teal,
              letterSpacing: 4, marginBottom: 10,
            }}>DESKBUDDY · ANIMATION PIPELINE</div>
            <h1 style={{
              fontSize: 28, fontWeight: 700, lineHeight: 1.2, margin: 0,
              background: `linear-gradient(135deg, ${T.text} 0%, ${T.teal} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>真人视频 → Spine 动画资产</h1>
            <div style={{
              fontSize: 13, color: T.textSub, marginTop: 8,
            }}>DeepMotion × DomoAI → 情感状态机整合工作流</div>
          </div>
          <div style={{
            display: "flex", gap: 6,
            background: T.bgCard, borderRadius: 8, padding: 4,
            border: `1px solid ${T.border}`,
          }}>
            {["pipeline", "emotion", "tracks"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? T.teal : "transparent",
                color: activeTab === tab ? "#000" : T.textSub,
                border: "none", borderRadius: 6, padding: "6px 14px",
                fontFamily: T.mono, fontSize: 10, letterSpacing: 2,
                cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s",
                fontWeight: activeTab === tab ? 700 : 400,
              }}>
                {tab === "pipeline" ? "主流程" : tab === "emotion" ? "情感管线" : "轨道架构"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ─── PIPELINE TAB ─────────────────────────────── */}
        {activeTab === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Legend */}
            <div style={{
              display: "flex", gap: 20, padding: "10px 16px",
              background: T.bgCard, borderRadius: 8, border: `1px solid ${T.border}`,
              flexWrap: "wrap",
            }}>
              {[
                { color: T.teal, label: "DeepMotion 路线（骨骼动画数据）" },
                { color: T.gold, label: "DomoAI 路线（风格化视频参考）" },
                { color: T.purple, label: "Spine 整合（状态机构建）" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 3, background: color, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: T.textSub, fontFamily: T.mono }}>{label}</span>
                </div>
              ))}
            </div>

            {stages.map((stage, si) => (
              <div key={stage.id}>
                {/* Stage header */}
                <div
                  onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: "8px 8px 0 0",
                    background: activeStage === stage.id ? stage.colorDim : T.bgCard,
                    border: `1px solid ${activeStage === stage.id ? stage.color + "50" : T.border}`,
                    cursor: "pointer", transition: "all 0.2s",
                    borderBottom: activeStage === stage.id ? "none" : undefined,
                  }}
                >
                  <span style={{ fontSize: 18, color: stage.color }}>{stage.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontFamily: T.mono, fontSize: 11, color: stage.color, letterSpacing: 2,
                      }}>{stage.label}</span>
                      <span style={{
                        fontSize: 12, color: T.textSub,
                      }}>· {stage.description}</span>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: T.mono, fontSize: 10, color: T.textMuted,
                    transform: activeStage === stage.id ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s", display: "inline-block",
                  }}>▶</span>
                </div>

                {/* Stage detail */}
                {activeStage === stage.id && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: stage.tracks.length === 1 ? "1fr" : "1fr 1fr",
                    gap: 1,
                    background: T.border,
                    border: `1px solid ${stage.color}50`,
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    overflow: "hidden",
                  }}>
                    {stage.tracks.map((track, ti) => (
                      <div key={ti} style={{ background: T.bgCard, padding: "16px 18px" }}>
                        <div style={{
                          fontFamily: T.mono, fontSize: 10, color: track.color,
                          letterSpacing: 2, marginBottom: 12, display: "flex",
                          alignItems: "center", gap: 8,
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: track.color,
                          }} />
                          {track.label}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {track.steps.map((step, sii) => (
                            <div key={sii} style={{
                              display: "flex", gap: 10, alignItems: "flex-start",
                            }}>
                              <div style={{
                                width: 18, height: 18, borderRadius: 4,
                                background: track.colorDim || `${track.color}15`,
                                border: `1px solid ${track.color}30`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, marginTop: 1,
                              }}>
                                <span style={{
                                  fontFamily: T.mono, fontSize: 8,
                                  color: track.color,
                                }}>{sii + 1}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                                  {step.name}
                                </div>
                                <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>
                                  {step.detail}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Arrow between stages */}
                {si < stages.length - 1 && (
                  <div style={{
                    display: "flex", alignItems: "center", padding: "4px 20px",
                  }}>
                    <div style={{
                      width: 2, height: 20, background: T.border,
                      margin: "0 auto",
                    }} />
                  </div>
                )}
              </div>
            ))}

            {/* Bottom hint */}
            <div style={{
              padding: "12px 16px", borderRadius: 8,
              background: `${T.teal}08`, border: `1px solid ${T.teal}25`,
              fontSize: 11, color: T.textSub, fontFamily: T.mono,
              textAlign: "center",
            }}>
              点击每个阶段展开详细步骤 · 全程预计工时：约 3~5 天（含学习成本）
            </div>
          </div>
        )}

        {/* ─── EMOTION TAB ─────────────────────────────── */}
        {activeTab === "emotion" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Pipeline flow */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: T.teal,
                letterSpacing: 3, marginBottom: 16,
              }}>CLASSIFY → SPINE 数据流</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {emotionMap.map((row, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 6,
                    background: T.bgHover, border: `1px solid ${T.border}`,
                  }}>
                    <div style={{
                      fontFamily: T.mono, fontSize: 11, color: T.textSub,
                      minWidth: 160,
                    }}>{row.from}</div>
                    <div style={{
                      fontFamily: T.mono, fontSize: 14, color: row.color,
                      flex: 0,
                    }}>{row.arrow}</div>
                    <div style={{
                      fontFamily: T.mono, fontSize: 12, color: row.color,
                      background: `${row.color}10`, padding: "3px 10px",
                      borderRadius: 4, border: `1px solid ${row.color}30`,
                    }}>{row.to}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion intensity diagram */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: T.gold,
                letterSpacing: 3, marginBottom: 16,
              }}>情感强度 → TRACK1 权重映射</div>

              {[
                { emotion: "neutral", val: 0.0, color: T.textMuted, desc: "Track1 alpha = 0，不播放任何叠加动画" },
                { emotion: "shy", val: 0.4, color: T.teal, desc: "轻微低头，眼神偏移，0.4 权重混合" },
                { emotion: "blush", val: 0.7, color: T.gold, desc: "脸红动画 0.7 权重 + 轻微身体后缩" },
                { emotion: "flustered", val: 1.0, color: T.coral, desc: "满权重触发，捂脸/转身完整动作" },
              ].map(({ emotion, val, color, desc }) => (
                <div key={emotion} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color }}>{emotion}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMuted }}>
                      alpha = {val.toFixed(1)}
                    </span>
                  </div>
                  <div style={{
                    height: 6, background: T.border, borderRadius: 3, overflow: "hidden",
                    marginBottom: 4,
                  }}>
                    <div style={{
                      height: "100%", width: `${val * 100}%`,
                      background: `linear-gradient(90deg, ${color}80, ${color})`,
                      borderRadius: 3, transition: "width 0.5s",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textSub }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Transition rules */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: T.purple,
                letterSpacing: 3, marginBottom: 16,
              }}>状态过渡规则</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { rule: "情感强度变化", impl: "0.3s linear 插值到新权重，不硬切" },
                  { rule: "Track2 oneshot", impl: "播完后自动 clearTrack(2)，Track0 继续" },
                  { rule: "Combo 检测", impl: "同一 hitzone ≥3次/2s → 升级 react 动画" },
                  { rule: "好感度门控", impl: "L<3 时 blush 动画资产被 JSON 过滤不加载" },
                  { rule: "冷却计时器", impl: "情感叠加动画 ≥5s 间隔，防止频繁触发" },
                  { rule: "深夜模式", impl: "23:00~6:00 强制降低 alpha 上限到 0.5" },
                ].map(({ rule, impl }) => (
                  <div key={rule} style={{
                    padding: "10px 12px", borderRadius: 6,
                    background: T.bgHover, border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                      {rule}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub }}>{impl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TRACKS TAB ─────────────────────────────── */}
        {activeTab === "tracks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Track architecture */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: T.teal,
                letterSpacing: 3, marginBottom: 20,
              }}>SPINE 三轨混合架构</div>

              {[
                {
                  track: "Track 0",
                  name: "基础动作层",
                  color: T.teal,
                  blend: "LOOP",
                  source: "DeepMotion",
                  anims: ["idle_normal", "idle_work", "idle_night", "walk"],
                  desc: "始终播放，低优先级，构成角色的基础存在感",
                },
                {
                  track: "Track 1",
                  name: "情感叠加层",
                  color: T.gold,
                  blend: "ADDITIVE",
                  source: "DomoAI参考 K帧",
                  anims: ["emotion_blush", "emotion_shy", "emotion_happy", "emotion_curious"],
                  desc: "Additive 模式叠加在 Track0 上，alpha 由情感强度控制",
                },
                {
                  track: "Track 2",
                  name: "触发响应层",
                  color: T.coral,
                  blend: "ONESHOT",
                  source: "DeepMotion + 手工",
                  anims: ["react_touch_head", "react_touch_cheek", "react_poke", "story_confession"],
                  desc: "事件触发，播放完毕后 clearTrack，优先级最高",
                },
              ].map((t) => (
                <div key={t.track} style={{
                  marginBottom: 16, padding: "14px 16px",
                  border: `1px solid ${t.color}30`,
                  borderRadius: 8, background: `${t.color}06`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      background: t.color, color: "#000",
                      fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                      padding: "3px 8px", borderRadius: 4,
                    }}>{t.track}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.name}</span>
                    <span style={{
                      fontFamily: T.mono, fontSize: 9, color: t.color,
                      background: `${t.color}15`, padding: "2px 8px", borderRadius: 20,
                      border: `1px solid ${t.color}30`,
                    }}>{t.blend}</span>
                    <span style={{
                      marginLeft: "auto", fontFamily: T.mono,
                      fontSize: 9, color: T.textMuted,
                    }}>来源: {t.source}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 10px" }}>{t.desc}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {t.anims.map(a => (
                      <span key={a} style={{
                        fontFamily: T.mono, fontSize: 10, color: t.color,
                        background: `${t.color}10`, padding: "3px 8px", borderRadius: 4,
                        border: `1px solid ${t.color}20`,
                      }}>{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action library table */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: T.purple,
                letterSpacing: 3, marginBottom: 16,
              }}>完整动作资产清单</div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr>
                      {["动画名", "轨道", "混合模式", "来源工具", "触发条件"].map(h => (
                        <th key={h} style={{
                          fontFamily: T.mono, fontSize: 9, color: T.textMuted,
                          letterSpacing: 2, textAlign: "left", padding: "6px 10px",
                          borderBottom: `1px solid ${T.border}`, textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["idle_normal", "0", "LOOP", "DeepMotion", "默认状态"],
                      ["idle_work", "0", "LOOP", "DeepMotion", "系统检测用户活跃"],
                      ["idle_night", "0", "LOOP", "DeepMotion", "23:00~6:00"],
                      ["idle_bored", "0", "ONESHOT→LOOP", "手工K帧", "无交互 > 10 分钟"],
                      ["emotion_blush", "1", "ADDITIVE", "DomoAI参考", "classify: blush ≥ 0.5"],
                      ["emotion_shy", "1", "ADDITIVE", "DomoAI参考", "classify: shy ≥ 0.4"],
                      ["emotion_happy", "1", "ADDITIVE", "DomoAI参考", "classify: joy ≥ 0.6"],
                      ["emotion_surprised", "1", "ADDITIVE", "DomoAI参考", "classify: surprise ≥ 0.7"],
                      ["react_touch_head", "2", "ONESHOT", "DeepMotion", "hitzone: head + click"],
                      ["react_touch_cheek", "2", "ONESHOT", "DeepMotion", "hitzone: face + click"],
                      ["react_poke", "2", "ONESHOT", "DeepMotion", "hitzone: any + rapid"],
                      ["react_greeting", "2", "ONESHOT", "DeepMotion", "首次启动 / 每日首次"],
                      ["speak_idle", "2", "ADDITIVE", "TTS口型", "TTS 播放中"],
                      ["story_confession", "0+1+2", "EXCLUSIVE", "手工K帧", "好感度L4 + 触发条件"],
                    ].map(([name, track, blend, source, trigger], i) => {
                      const trackColor = track === "0" ? T.teal : track === "1" ? T.gold
                        : track === "2" ? T.coral : T.purple;
                      return (
                        <tr key={i} style={{
                          borderBottom: `1px solid ${T.border}`,
                          background: i % 2 === 0 ? "transparent" : T.bgHover,
                        }}>
                          <td style={{
                            padding: "7px 10px", fontFamily: T.mono,
                            color: T.text, fontSize: 11,
                          }}>{name}</td>
                          <td style={{ padding: "7px 10px" }}>
                            <span style={{
                              fontFamily: T.mono, fontSize: 10,
                              color: trackColor, background: `${trackColor}15`,
                              padding: "2px 6px", borderRadius: 3,
                            }}>Track {track}</span>
                          </td>
                          <td style={{
                            padding: "7px 10px", fontFamily: T.mono,
                            fontSize: 10, color: T.textSub,
                          }}>{blend}</td>
                          <td style={{ padding: "7px 10px" }}>
                            <span style={{
                              fontSize: 10, color: source.includes("DeepMotion") ? T.teal
                                : source.includes("DomoAI") ? T.gold : T.textSub,
                            }}>{source}</span>
                          </td>
                          <td style={{
                            padding: "7px 10px", fontSize: 10, color: T.textSub,
                          }}>{trigger}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code snippet */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: T.coral,
                letterSpacing: 3, marginBottom: 14,
              }}>SPINE RUNTIME 调用示例 (TypeScript)</div>
              <pre style={{
                fontFamily: T.mono, fontSize: 11, color: T.textSub,
                margin: 0, lineHeight: 1.8, overflowX: "auto",
                background: T.bg, padding: 16, borderRadius: 6,
              }}>{`// 情感状态应用
function applyEmotionState(emotion: string, intensity: number) {
  const track1 = spineInstance.state.getCurrent(1);
  
  // Additive 情感叠加
  spineInstance.state.setAnimation(1, \`emotion_\${emotion}\`, true);
  
  // 平滑过渡到目标权重（0.3s）
  const entry = spineInstance.state.getCurrent(1);
  if (entry) {
    entry.alpha = 0; // 从0开始
    entry.mixBlend = MixBlend.add;
    smoothAlphaTo(entry, intensity, 300); // 300ms过渡
  }
}

// 触发响应动作（Track2 oneshot）
function triggerReaction(hitzone: string) {
  const animName = \`react_touch_\${hitzone}\`;
  const entry = spineInstance.state.setAnimation(2, animName, false);
  entry.listener = {
    complete: () => spineInstance.state.clearTrack(2)
  };
}

// Combo 检测升级
function checkCombo(hitzone: string, count: number) {
  if (count >= 3) triggerReaction("poke"); // 升级反应
  else triggerReaction(hitzone);           // 普通反应
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
