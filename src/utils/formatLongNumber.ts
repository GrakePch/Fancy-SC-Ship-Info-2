export default function formatLongNumber(num: number): string {
  // add space as thousands separator
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}