const pad = (value: number) => value.toString().padStart(2, "0");

export default function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${pad(Math.round(seconds))} s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${pad(mins)} m ${pad(secs)} s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    return `${pad(hours)} h ${pad(mins)} m ${pad(secs)} s`;
  }
}
