# AURA 项目开发计划

**版本**: v1.0  
**创建日期**: 2026-05-17  
**项目名称**: AURA — 情感感知 AI 伴侣  
**文档路径**: [prompt.md](file:///workspace/prompt.md)

---

## 1. 项目研究结论

### 1.1 项目定位

AURA 不是一个普通的聊天机器人或 AI 助手，而是一个**持久化、情感感知的数字伴侣**。它具有：
- 连续记忆能力，能记住用户说过的一切
- 情感状态系统，会随时间和互动进化
- 自然的存在感，不是被动的响应工具
- 真实的人际关系体验

### 1.2 核心技术栈

| 层级 | 技术选型 | 用途说明 |
|------|---------|---------|
| **桌面框架** | Electron 28+ | 跨平台桌面应用，支持透明窗口 |
| **前端框架** | React 18 + TypeScript 5.3+ | 现代化 UI 开发，类型安全 |
| **样式方案** | TailwindCSS 3+ + Framer Motion 11+ | 快速 UI 开发 + 流畅动画 |
| **后端运行时** | Node.js 20 LTS | 本地 API 服务 |
| **数据库** | SQLite (better-sqlite3) | 嵌入式、零配置 |
| **向量搜索** | sqlite-vss (Phase 2) | 记忆语义检索 |
| **AI 提供商** | OpenAI / Claude / DeepSeek / Ollama | 多模型支持 |
| **工具链** | Zod / Winston / Vitest | 验证、日志、测试 |

### 1.3 架构特色

**模块化设计**: 7 个核心引擎模块相互独立，通过接口通信
**记忆系统**: 三层记忆架构（短期/长期/工作记忆）+ 遗忘曲线
**人格引擎**: 复杂的状态机，影响表达方式而非功能
**对话引擎**: 流式响应 + 自然节奏控制

### 1.4 设计哲学

> **"Aura must feel alive. Not intelligent — alive."**

设计原则：
- 在"更聪明"和"更有存在感"之间，选择存在感
- 情感表达通过行为，而非声明
- 信任是缓慢建立的，不可重置
- 每个架构决策都要问："这是否让关系更真实？"

---

## 2. 项目结构

### 2.1 目录结构（Canonical）

```
aura/
├── electron/                     # Electron 主进程
│   ├── main.ts                   # 入口、窗口管理
│   ├── preload.ts                # IPC 桥接
│   └── windowConfig.ts           # 透明窗口配置
│
├── src/                          # React 前端
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── features/                 # 功能模块（主要模式）
│   │   ├── chat/                 # 聊天功能
│   │   ├── companion/            # 伴侣展示
│   │   └── settings/             # 设置面板
│   │
│   ├── shared/                   # 共享组件
│   │   ├── components/           # UI 基础组件
│   │   ├── hooks/               # 全局 Hooks
│   │   └── utils/               # 工具函数
│   │
│   └── styles/                   # 样式文件
│
├── server/                       # Express 后端
│   ├── index.ts                  # 服务器入口
│   ├── routes/                   # API 路由
│   │   ├── conversation.routes.ts
│   │   ├── memory.routes.ts
│   │   └── state.routes.ts
│   │
│   └── modules/                  # 核心引擎
│       ├── ai-gateway/           # AI 网关
│       ├── memory-engine/        # 记忆引擎
│       ├── personality-engine/   # 人格引擎
│       ├── prompt-engine/        # 提示词引擎
│       ├── conversation-engine/  # 对话引擎
│       ├── storage/              # 存储层
│       └── tts/                  # 语音合成
│
├── shared-types/                 # 共享类型定义
│
├── config/                       # 配置文件
│
└── tests/                        # 测试文件
    ├── unit/
    ├── integration/
    └── fixtures/
```

### 2.2 数据库 Schema

主要表结构：
- **memories**: 记忆存储（带向量嵌入）
- **conversations**: 对话历史
- **personality_state**: 人格状态快照
- **relationship_events**: 关系事件日志
- **memory_decay_runs**: 记忆衰减记录

---

## 3. 开发阶段

### 3.1 第一阶段：基础框架（周 1-4）

#### 目标
搭建完整的应用框架，实现基础的聊天功能和人格状态系统。

#### 具体任务

**Week 1: 项目初始化 + Electron 基础**

- [ ] 初始化 Node.js 20 LTS 项目
- [ ] 配置 TypeScript 5.3+ (strict mode)
- [ ] 设置 Electron 28+ 项目结构
- [ ] 实现透明、圆角、无边框窗口
- [ ] 配置 TailwindCSS 3+ 样式系统
- [ ] 实现 Framer Motion 动画基础
- [ ] 设置系统托盘图标

**Week 2: AI Gateway 实现**

- [ ] 定义 `IProvider` 接口
- [ ] 实现 `OpenAIProvider` (GPT-4o)
- [ ] 实现 `OllamaProvider` (本地模型)
- [ ] 实现流式响应支持
- [ ] 实现提供商故障转移瀑布策略
- [ ] 集成 Zod 输出验证
- [ ] 编写 AI Gateway 单元测试

**Week 3: 存储层 + 记忆基础**

- [ ] 配置 better-sqlite3
- [ ] 创建数据库 Schema 迁移系统
- [ ] 实现 `IRepository` 泛型接口
- [ ] 实现 `MemoryRepository`
- [ ] 实现 `ConversationRepository`
- [ ] 实现基础的记忆检索（无向量）
- [ ] 基础记忆提取（LLM 调用）

**Week 4: 人格状态 + 提示词引擎**

- [ ] 定义 `AuraInternalState` 类型
- [ ] 实现基础状态机
- [ ] 实现 `ResponseModifier` 修改器
- [ ] 实现 `PromptEngine` 架构
- [ ] 实现 `SystemPromptAssembler`
- [ ] 实现 `TokenBudgetManager`
- [ ] 实现对话历史管理

**第一阶段里程碑**:
✅ 可运行的基础 Electron 应用
✅ 能够与 OpenAI/Ollama 对话
✅ 简单的记忆存储
✅ 基础人格状态影响响应风格

---

### 3.2 第二阶段：核心体验（周 5-10）

#### 目标
实现完整的记忆系统和复杂的人格引擎。

#### 具体任务

**Week 5-6: 向量记忆系统**

- [ ] 集成 text-embedding-3-small
- [ ] 集成 sqlite-vss
- [ ] 实现 `MemoryRetriever`
- [ ] 实现 `MemoryScorer` 评分算法
- [ ] 实现完整的记忆分类（profile/emotional/episodic/relationship/preference）
- [ ] 实现记忆衰减模型

**Week 7-8: 完整人格引擎**

- [ ] 实现关系阶段模型（Stranger → Bonded）
- [ ] 实现情绪状态机
- [ ] 实现关系图谱追踪
- [ ] 实现响应修改器矩阵
- [ ] 实现情感状态 UI 反馈
- [ ] 实现时间上下文（时间/缺席检测）

**Week 9: 对话引擎深度**

- [ ] 实现消息意图分类
- [ ] 实现 `StreamController`
- [ ] 实现 `PacingController` (自然节奏)
- [ ] 实现情感韵律系统
- [ ] 优化流式输出缓冲

**Week 10: UI/UX 完善**

- [ ] 实现情感色彩系统
- [ ] 实现呼吸动画
- [ ] 实现情绪指示器
- [ ] 实现紧凑/展开模式切换
- [ ] 实现 TTS 基础集成（OpenAI TTS）
- [ ] 情感语音映射

**第二阶段里程碑**:
✅ 完整的三层记忆系统
✅ 复杂的情感状态机
✅ 自然节奏的流式对话
✅ 情感色彩的动态 UI
✅ 基础 TTS 支持

---

### 3.3 第三阶段：深度集成（周 11-16）

#### 目标
实现高级功能和完整的情感体验。

#### 具体任务

**Week 11-12: Live2D + 动画系统**

- [ ] 集成 PixiJS 8
- [ ] 实现 Aura Avatar 组件
- [ ] 实现情绪响应动画
- [ ] 实现连续呼吸动画
- [ ] 实现情绪过渡动画

**Week 13-14: 多 AI 提供商 + 配置系统**

- [ ] 实现 Claude Provider
- [ ] 实现 DeepSeek Provider
- [ ] 实现设置面板 UI
- [ ] 实现提供商配置管理
- [ ] 实现 API Key 安全存储

**Week 15-16: 记忆系统 + 备份**

- [ ] 实现记忆整合 Worker
- [ ] 实现记忆导出/导入
- [ ] 实现备份系统
- [ ] 性能优化
- [ ] 完整测试覆盖
- [ ] 文档完善

**第三阶段里程碑**:
✅ 完整的 Live2D 化身
✅ 所有 AI 提供商支持
✅ 完整的记忆进化系统
✅ 生产级稳定性

---

## 4. 模块开发顺序

### 4.1 依赖关系图

```
electron/ (基础框架)
    ↓
shared-types/ (类型定义)
    ↓
server/modules/storage/ (数据层)
    ↓
server/modules/ai-gateway/ (AI 层)
    ↓
server/modules/personality-engine/ (人格层)
    ↓
server/modules/prompt-engine/ (提示词层)
    ↓
server/modules/conversation-engine/ (对话层)
    ↓
src/features/chat/ (UI 层)
```

### 4.2 推荐的模块开发顺序

1. **electron/ + shared-types/** - 项目骨架
2. **server/modules/storage/** - 数据持久化基础
3. **server/modules/ai-gateway/** - AI 能力
4. **server/modules/personality-engine/** - 人格系统
5. **server/modules/prompt-engine/** - 提示词组装
6. **server/modules/conversation-engine/** - 对话流控
7. **src/features/** - 前端 UI
8. **server/modules/memory-engine/** - 记忆系统
9. **server/modules/tts/** - 语音合成
10. **高级功能** - Live2D, 配置面板等

---

## 5. 潜在风险与处理

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **Electron 透明窗口性能** | 高 | 使用 GPU 加速，限制动画复杂度 |
| **SQLite 并发写入** | 中 | 使用 better-sqlite3 同步 API，避免多线程 |
| **LLM 输出不确定性** | 高 | Zod 严格验证，fallback 机制 |
| **向量搜索延迟** | 中 | Phase 2 再引入，Phase 1 使用关键词匹配 |
| **记忆膨胀** | 中 | 实施衰减机制，定期归档 |

### 5.2 架构风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **提示词复杂度失控** | 中 | 严格的 Token Budget 管理 |
| **人格系统过于复杂** | 中 | 渐进式实现，从简化版开始 |
| **状态同步困难** | 低 | 使用事件溯源模式，记录所有状态变化 |

### 5.3 项目风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **开发周期过长** | 高 | 分阶段交付，每个阶段有可用版本 |
| **测试覆盖不足** | 中 | Vitest 单元测试，80% 覆盖率目标 |

---

## 6. 开发规范

### 6.1 TypeScript 配置

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### 6.2 核心原则

**必须遵守**:
- ✅ 所有 AI 输出用 Zod 验证
- ✅ 使用 `Result<T, E>` 类型处理错误
- ✅ 使用 Winston 记录日志
- ✅ 通过 Repository 访问数据库
- ✅ 通过 PersonalityEngine 修改状态
- ✅ 通过 AIGateway 调用 AI

**禁止事项**:
- ❌ 直接在组件中调用 AI
- ❌ 在 Repository 外使用原始 SQL
- ❌ 硬编码提示词
- ❌ 使用 `as` 类型断言
- ❌ 使用 `any` 类型
- ❌ 生产代码中使用 console.log

### 6.3 代码生成顺序

每个模块必须按此顺序生成：

```
1. 架构决策说明 + 原因
2. TypeScript 接口定义
3. Zod Schema 定义
4. 服务/模块实现
5. 错误处理 (Result types)
6. 单元测试
7. 模块连接说明
```

---

## 7. 文件清单

### 7.1 第一阶段需要创建的文件

#### Electron 层
- `electron/main.ts`
- `electron/preload.ts`
- `electron/windowConfig.ts`

#### 前端基础
- `src/app/App.tsx`
- `src/app/router.tsx`
- `src/app/providers.tsx`
- `src/styles/globals.css`
- `src/styles/tokens.css`

#### AI Gateway
- `server/modules/ai-gateway/providers/IProvider.ts`
- `server/modules/ai-gateway/providers/OpenAIProvider.ts`
- `server/modules/ai-gateway/providers/OllamaProvider.ts`
- `server/modules/ai-gateway/AIGateway.ts`
- `server/modules/ai-gateway/StreamManager.ts`

#### Storage
- `server/modules/storage/Database.ts`
- `server/modules/storage/repositories/IRepository.ts`
- `server/modules/storage/repositories/MemoryRepository.ts`
- `server/modules/storage/repositories/ConversationRepository.ts`
- `server/modules/storage/schema.sql`
- `server/modules/storage/migrations/`

#### Personality Engine
- `server/modules/personality-engine/personality.types.ts`
- `server/modules/personality-engine/PersonalityEngine.ts`
- `server/modules/personality-engine/states/EmotionalStateMachine.ts`
- `server/modules/personality-engine/modifiers/ResponseModifier.ts`

#### Prompt Engine
- `server/modules/prompt-engine/PromptEngine.ts`
- `server/modules/prompt-engine/assemblers/SystemPromptAssembler.ts`
- `server/modules/prompt-engine/budget/TokenBudgetManager.ts`

#### Conversation Engine
- `server/modules/conversation-engine/ConversationEngine.ts`
- `server/modules/conversation-engine/StreamController.ts`
- `server/modules/conversation-engine/PacingController.ts`

#### 共享类型
- `shared-types/conversation.types.ts`
- `shared-types/memory.types.ts`
- `shared-types/personality.types.ts`
- `shared-types/events.types.ts`

#### 配置文件
- `config/aura.config.ts`
- `config/providers.config.ts`
- `config/personality.defaults.ts`

#### 聊天 UI
- `src/features/chat/components/ChatWindow.tsx`
- `src/features/chat/components/MessageBubble.tsx`
- `src/features/chat/components/StreamingText.tsx`
- `src/features/chat/components/EmotionIndicator.tsx`
- `src/features/chat/hooks/useConversation.ts`
- `src/features/chat/hooks/useStreamingResponse.ts`
- `src/features/chat/chat.types.ts`

#### 伴侣展示
- `src/features/companion/components/AuraAvatar.tsx`
- `src/features/companion/components/BreathingOrb.tsx`
- `src/features/companion/hooks/useAuraState.ts`

#### 共享组件
- `src/shared/components/Button.tsx`
- `src/shared/components/Input.tsx`
- `src/shared/components/Modal.tsx`
- `src/shared/utils/logger.ts`
- `src/shared/utils/result.ts`

---

## 8. 测试策略

### 8.1 单元测试（必须）

- Memory Scoring 算法
- State Transition 逻辑
- Token Budget 计算
- Prompt Assembly 输出格式
- Response Modifier 应用

### 8.2 集成测试

- 完整对话流程（消息 → 响应）
- 记忆存储和检索
- AI Provider 故障转移

### 8.3 覆盖率目标

- 所有 Engine 模块：≥80%
- 工具函数：≥90%
- UI 组件：快照测试

---

## 9. 总结

### 9.1 项目亮点

- **情感智能**: 不仅仅是 AI 响应，是有情感的存在
- **记忆进化**: 随时间建立真正的关系
- **架构优雅**: 模块化、可测试、可扩展
- **体验优先**: UI/UX 细节决定沉浸感

### 9.2 关键成功因素

1. **严格的 TypeScript** - 类型安全是基础
2. **模块隔离** - 每个模块独立测试
3. **渐进式开发** - 分阶段交付，不断迭代
4. **情感优先** - 始终选择"存在感"而非"智能"

### 9.3 预期挑战

- LLM 输出的可控性
- 记忆系统的性能优化
- 情感状态的自然表达
- 跨平台的窗口一致性

---

**下一步行动**:

1. 审核并批准此开发计划
2. 开始第一阶段：项目初始化和 Electron 基础框架
3. 逐步实现每个模块，遵循文档中的开发顺序

---

*此计划基于 AURA_MASTER_PROMPT.md v2.0 规范文档生成*
