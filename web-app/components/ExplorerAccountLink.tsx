const explorerUrl = process.env.NEXT_PUBLIC_NEAR_EXPLORER_URL || 'https://explorer.testnet.near.org';

export default function ExplorerAccountLink({ accountId }: { accountId: string }): JSX.Element {
  return (
    <a target="_blank" href={`${explorerUrl}/accounts/${accountId}`} rel="noreferrer" className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
      {accountId}&rsquo;s account in Explorer
    </a>
  );
}
