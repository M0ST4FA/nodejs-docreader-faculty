const upperDiff = '𝗔'.codePointAt(0)! - 'A'.codePointAt(0)!;
const lowerDiff = '𝗮'.codePointAt(0)! - 'a'.codePointAt(0)!;

const isUpper = (n: number) => n >= 65 && n < 91;
const isLower = (n: number) => n >= 97 && n < 123;

const bolderize = (char: string) => {
  const n = char.charCodeAt(0);
  if (isUpper(n)) return String.fromCodePoint(n + upperDiff);
  if (isLower(n)) return String.fromCodePoint(n + lowerDiff);
  return char;
};

export default function bolderizeWord(word: string) {
  return [...word].map(bolderize).join('');
}
