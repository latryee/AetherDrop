import type { DeviceInfo, DeviceType } from '../types/transfer';

export function detectDevice(): { type: DeviceType; os: string; browser: string; defaultName: string } {
  const ua = navigator.userAgent || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  let type: DeviceType = 'desktop';
  let os = 'Unknown OS';
  let browser = 'Browser';

  // Detect iPad (including iPadOS where userAgent looks like Macintosh but maxTouchPoints > 1)
  const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
  const isIPhone = /iPhone|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) && !isIPad;
  const isWindows = /Win32|Win64|Windows|WinCE/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isAndroid;

  if (isIPad) {
    type = 'ipad';
    os = 'iPadOS';
  } else if (isIPhone) {
    type = 'iphone';
    os = 'iOS';
  } else if (isAndroid) {
    type = 'android';
    os = 'Android';
  } else if (isMac) {
    type = 'mac';
    os = 'macOS';
  } else if (isWindows) {
    type = 'windows';
    os = 'Windows';
  } else if (isLinux) {
    type = 'linux';
    os = 'Linux';
  } else {
    type = maxTouchPoints > 0 ? 'mobile' : 'desktop';
  }

  // Detect Browser
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
  }

  // Generate intuitive friendly name
  let defaultName = 'Cihazım';
  if (type === 'ipad') {
    defaultName = 'Apple iPad';
  } else if (type === 'iphone') {
    defaultName = 'Apple iPhone';
  } else if (type === 'mac') {
    defaultName = 'Apple Mac';
  } else if (type === 'windows') {
    defaultName = 'Windows PC';
  } else if (type === 'android') {
    defaultName = 'Android Cihaz';
  } else if (type === 'linux') {
    defaultName = 'Linux Bilgisayar';
  }

  return { type, os, browser, defaultName };
}

export function getStoredDeviceName(fallback: string): string {
  try {
    const saved = localStorage.getItem('aetherdrop_device_name');
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return fallback;
}

export function saveStoredDeviceName(name: string): void {
  try {
    localStorage.setItem('aetherdrop_device_name', name);
  } catch {
    // ignore
  }
}

export function createLocalDeviceInfo(peerId: string): DeviceInfo {
  const { type, os, browser, defaultName } = detectDevice();
  const name = getStoredDeviceName(defaultName);
  return {
    id: peerId,
    name,
    type,
    browser,
    os,
    isSelf: true,
    connectedAt: Date.now(),
  };
}
