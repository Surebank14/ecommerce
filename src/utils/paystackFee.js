export const calculatePaystackLocalFee = (payableAmount) => {
  const normalizedAmount = Number(payableAmount || 0);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) return 0;

  const percentageFee = normalizedAmount * 0.015;
  const fee = normalizedAmount < 2500 ? percentageFee : percentageFee + 100;
  return Math.min(2000, Math.ceil(fee));
};

export const calculatePaystackPayableForNetAmount = (netAmount) => {
  const normalizedNetAmount = Math.ceil(Number(netAmount || 0));
  if (!Number.isFinite(normalizedNetAmount) || normalizedNetAmount <= 0) {
    return { contributionAmount: 0, paystackFee: 0, payableAmount: 0 };
  }

  let payableAmount = normalizedNetAmount;
  for (let index = 0; index < 10; index += 1) {
    const paystackFee = calculatePaystackLocalFee(payableAmount);
    const nextPayableAmount = normalizedNetAmount + paystackFee;
    if (nextPayableAmount === payableAmount) {
      return { contributionAmount: normalizedNetAmount, paystackFee, payableAmount };
    }
    payableAmount = nextPayableAmount;
  }

  const paystackFee = calculatePaystackLocalFee(payableAmount);
  return {
    contributionAmount: normalizedNetAmount,
    paystackFee,
    payableAmount: normalizedNetAmount + paystackFee,
  };
};
