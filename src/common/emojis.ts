type Emojis = {
  circles: Record<string, string>;
  crown: string;
};

export const emojis: Emojis = {
  circles: {
    redCircle: ':red_circle:',
    orangeCircle: ':large_orange_circle:',
    yellowCircle: ':large_yellow_circle:',
    greenCircle: ':large_green_circle:',
    blueCircle: ':large_blue_circle:',
    purpleCircle: ':large_purple_circle:',
  },
  crown: ':crown:',
};

const randomNum = (min: number, max: number): number => {
  // here rand is from min to (max+1)
  const rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
};

export const randomCircleEmoji = (): string => {
  const keys = Object.keys(emojis.circles);
  const randomKey = keys[randomNum(0, keys.length - 1)];
  return emojis.circles[randomKey];
};
