export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='));
  return match ? match.split('=')[1] : null;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
