// 全局 Window.api 类型声明已统一放在 src/shared/types.ts（TerminalApi + declare global），
// 以便 main / preload / renderer 三个进程上下文都能识别 window.api 类型。
// 此文件保留以备 preload 专属类型扩展。
export {}
