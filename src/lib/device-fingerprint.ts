// Generate a simple device fingerprint based on browser properties
export function getDeviceFingerprint(): string {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  const renderer = gl ? gl.getParameter(gl.RENDERER) : "unknown";

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    renderer,
    navigator.platform,
  ];

  // Simple hash
  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "DEV-" + Math.abs(hash).toString(36).toUpperCase();
}

export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  let device = "Unknown";
  if (/Android/i.test(ua)) device = "Android";
  else if (/iPhone|iPad/i.test(ua)) device = "iOS";
  else if (/Windows/i.test(ua)) device = "Windows";
  else if (/Mac/i.test(ua)) device = "Mac";
  else if (/Linux/i.test(ua)) device = "Linux";

  let browser = "Unknown";
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Edge/i.test(ua)) browser = "Edge";

  return `${device} · ${browser} · ${screen.width}x${screen.height}`;
}
