/**
 * DSH checkout 路径解析（只读消费）。
 *
 * 显式指定、无默认推导：不能假定本仓以某种布局存在（issue 026 的教训）。
 * 未设置 = 无 checkout，调用方各自降级。
 */
export const dshCheckout = () => process.env.DSH_CHECKOUT
