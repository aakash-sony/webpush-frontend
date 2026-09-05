export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let platform = 'Unknown';

  if (navigator.userAgentData && navigator.userAgentData.platform) {
    platform = navigator.userAgentData.platform;
  } else if (navigator.platform) {
    platform = navigator.platform;
  }

  let browserName = 'Browser';
  if (userAgent.includes('Chrome')) browserName = 'Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Safari')) browserName = 'Safari';
  else if (userAgent.includes('Edge')) browserName = 'Edge';

  return {
    userAgent,
    platform,
    browserName,
  };
};
