export function getFormattedDate(): string {
  const today = new Date()
  const date = zeroPad(today.getDate())
  const month = zeroPad(today.getMonth() + 1)
  const year = today.getFullYear()

  return `${year}-${month}-${date}`
}

export function processReleaseNotes(release: string): string {
  return release
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n ')
}

function zeroPad(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}
