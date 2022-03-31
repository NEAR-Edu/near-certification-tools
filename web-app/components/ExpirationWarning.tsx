export default function ExpirationWarning(): JSX.Element {
  return (
    <div className="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg dark:bg-yellow-200 dark:text-yellow-800 max-w-xs" role="alert">
      Note: Although an expiration date is mentioned neither in the certificate on-chain nor in the dynamically-generated image representation of it (yet), there will soon be a
      dynamic expiration date equal to the end of the first 6-month period of inactivity of this mainnet account.
    </div>
  );
}
