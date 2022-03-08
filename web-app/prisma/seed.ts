import prisma from './test-helpers/client';

// eslint-disable-next-line max-lines-per-function
async function main() {
  // create receipts
  await prisma.receipts.createMany({
    data: [
      {
        included_in_block_timestamp: 1646224546000000000,
        receipt_id: 'r74mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEts',
      },
      {
        included_in_block_timestamp: 1646224546000000000,
        receipt_id: 'o2uftO97TSisawK2PCkqe45tki0A9IX6lWRkQXUjy6rW6',
      },
      {
        included_in_block_timestamp: 1745788799000000000,
        receipt_id: 'Zc82R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
      {
        included_in_block_timestamp: 1647224546000000000,
        receipt_id: '0zxA9dIZCrd8NltfLA3xFy2ctNTT4nskvNkjZP5bvEBl5',
      },
      {
        included_in_block_timestamp: 1671788799000000000,
        receipt_id: 'Wt4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUoic',
      },
      {
        included_in_block_timestamp: 1648224546000000000,
        receipt_id: 'OkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
    ],
  });

  // create action_receipts
  await prisma.action_receipts.createMany({
    data: [
      {
        receipt_id: 'r74mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEts',
        signer_account_id: 'janedoe.testnet',
      },
      {
        receipt_id: 'o2uftO97TSisawK2PCkqe45tki0A9IX6lWRkQXUjy6rW6',
        signer_account_id: 'johndoe.testnet',
      },
      {
        receipt_id: 'Zc82R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
        signer_account_id: 'janedoe.testnet',
      },
      {
        receipt_id: '0zxA9dIZCrd8NltfLA3xFy2ctNTT4nskvNkjZP5bvEBl5',
        signer_account_id: 'johndoe.testnet',
      },
      {
        receipt_id: 'Wt4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUoic',
        signer_account_id: 'janedoe.testnet',
      },
      {
        receipt_id: 'OkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'johndoe.testnet',
      },
    ],
  });

  console.log('✨ 6 action_receipts successfully created!');

  console.log('✨ 6 receipts successfully created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
