// CSS module 声明（仅本仓构建期需要）。
// 消费端拿到的不是 .css 文件，而是 add 生成的 `<name>-css.ts`（样式字符串 + 类名表），
// 因为第三方插件的 client 构建没有 CSS 管线，样式走运行时 <style> 注入。
declare module '*.css' {
  const classes: Record<string, string>
  export default classes
}
