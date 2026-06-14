/** 一种排版方式（grid-template-areas 定义） */
export interface LayoutPreset {
  name: string
  areas: string[]
}

/**
 * 每个窗口数预制的多种排版方式。
 * areas 是 grid-template-areas 的行数组，字母 a/b/c... 对应每个窗口。
 */
export const LAYOUT_PRESETS: Record<number, LayoutPreset[]> = {
  1: [{ name: '单格', areas: ['a'] }],
  2: [
    { name: '左右', areas: ['a b'] },
    { name: '上下', areas: ['a', 'b'] }
  ],
  3: [
    { name: '左大+右上右下', areas: ['a b', 'a c'] },
    { name: '左上左下+右大', areas: ['a b', 'c b'] },
    { name: '横排', areas: ['a b c'] },
    { name: '竖排', areas: ['a', 'b', 'c'] }
  ],
  4: [
    { name: '2×2', areas: ['a b', 'c d'] },
    { name: '左大+右侧3', areas: ['a b', 'a c', 'a d'] },
    { name: '左侧3+右大', areas: ['a b', 'c b', 'd b'] },
    { name: '上1+下3', areas: ['a a a', 'b c d'] },
    { name: '横排', areas: ['a b c d'] },
    { name: '竖排', areas: ['a', 'b', 'c', 'd'] }
  ],
  5: [
    { name: '上3下2', areas: ['a b c', 'd d e'] },
    { name: '上2下3', areas: ['a a b', 'c d e'] },
    { name: '左大+右2×2', areas: ['a b', 'a c', 'd e'] },
    { name: '横排', areas: ['a b c d e'] }
  ],
  6: [
    { name: '2×3', areas: ['a b c', 'd e f'] },
    { name: '3×2', areas: ['a b', 'c d', 'e f'] },
    { name: '左大+右侧5', areas: ['a b', 'a c', 'a d', 'e f'] },
    { name: '横排', areas: ['a b c d e f'] }
  ],
  7: [
    { name: '上4下3', areas: ['a b c d', 'e f g g'] },
    { name: '左大+右侧6', areas: ['a b', 'a c', 'a d', 'e f g'] },
    { name: '上3下4', areas: ['a b c', 'd e f g'] }
  ],
  8: [
    { name: '2×4', areas: ['a b c d', 'e f g h'] },
    { name: '4×2', areas: ['a b', 'c d', 'e f', 'g h'] },
    { name: '横排', areas: ['a b c d e f g h'] }
  ]
}

/** 取某窗口数的全部排版预设 */
export function getPresets(layout: number): LayoutPreset[] {
  return LAYOUT_PRESETS[layout] ?? LAYOUT_PRESETS[1]
}
