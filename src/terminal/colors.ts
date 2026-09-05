const enabled = process.stdout.isTTY && process.env.NO_COLOR !== "1";

const wrap = (open: string, close: string, value: string) =>
  enabled ? `${open}${value}${close}` : value;

export const color = {
  bold: (value: string) => wrap("\u001b[1m", "\u001b[22m", value),
  dim: (value: string) => wrap("\u001b[2m", "\u001b[22m", value),
  cyan: (value: string) => wrap("\u001b[36m", "\u001b[39m", value),
  green: (value: string) => wrap("\u001b[32m", "\u001b[39m", value),
  red: (value: string) => wrap("\u001b[31m", "\u001b[39m", value),
  yellow: (value: string) => wrap("\u001b[33m", "\u001b[39m", value),
};
