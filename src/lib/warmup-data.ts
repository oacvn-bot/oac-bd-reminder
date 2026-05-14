export function getAccountRotationForDay(accounts: string[], day: number): { from: string; to: string }[] {
  const offset = (day - 1) % accounts.length;
  return accounts.map((account, idx) => {
    const toIdx = (idx + 1 + offset) % accounts.length;
    return { from: account, to: accounts[toIdx] };
  });
}
