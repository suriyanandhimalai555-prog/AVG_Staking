export const generateUserCode = () => {
  return "AVG" + Math.floor(10000 + Math.random() * 90000);
};

export const generateReferralCode = () => {
  return "REF" + Math.floor(10000 + Math.random() * 90000);
};