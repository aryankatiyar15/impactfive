export function generateDrawNumbers(count = 5, max = 45) {
  const picked = new Set<number>();

  while (picked.size < count) {
    picked.add(Math.floor(Math.random() * max) + 1);
  }

  return Array.from(picked).sort((a, b) => a - b);
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
