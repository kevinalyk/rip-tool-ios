export function isNetworkOnline(
  isConnected: boolean | null,
  isInternetReachable: boolean | null,
): boolean {
  return isConnected !== false && isInternetReachable !== false;
}
