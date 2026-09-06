export const getDeviceInfo = () => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let platform = 'Unknown';

  if (typeof navigator !== 'undefined') {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      platform = navigator.userAgentData.platform;
    } else if (navigator.platform) {
      platform = navigator.platform;
    }
  }

  let browserName = 'Browser';
  if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) {
    browserName = 'Edge';
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) {
    browserName = 'Opera';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Chrome') || userAgent.includes('CriOS')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browserName = 'Safari';
  }

  return {
    userAgent,
    platform,
    browserName,
  };
};
