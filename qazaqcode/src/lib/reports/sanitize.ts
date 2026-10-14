// Формула инъекциясынан қорғау: =, +, -, @ (және tab/CR) таңбасынан басталатын мәтіннің алдына ' қосылады.
export function safeText(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}
