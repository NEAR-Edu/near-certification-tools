import prisma from '../test/test-helpers/client';

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
      // years of activity
      {
        included_in_block_timestamp: 1426339237000000000,
        receipt_id: 'AkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1463577637000000000,
        receipt_id: 'BkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1469107237000000000,
        receipt_id: 'CkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1496496037000000000,
        receipt_id: 'DkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1538400037000000000,
        receipt_id: 'EkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1569936037000000000,
        receipt_id: 'FkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1572960037000000000,
        receipt_id: 'GkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1576243237000000000,
        receipt_id: 'HkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1581427237000000000,
        receipt_id: 'IkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1581859237000000000,
        receipt_id: 'JkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1596979237000000000,
        receipt_id: 'KkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1606224037000000000,
        receipt_id: 'LkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1611494437000000000,
        receipt_id: 'MkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1618579237000000000,
        receipt_id: 'NkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1618924837000000000,
        receipt_id: 'PkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1620393637000000000,
        receipt_id: 'QkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1636291237000000000,
        receipt_id: 'RkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1641388837000000000,
        receipt_id: 'SkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1643894437000000000,
        receipt_id: 'TkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: 1646400037000000000,
        receipt_id: 'UkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
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
      // years of activity
      {
        receipt_id: 'AkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'BkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'CkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'DkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'EkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'FkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'GkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'HkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'IkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'JkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'KkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'LkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'MkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'NkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'PkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'QkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'RkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'SkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'TkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
      {
        receipt_id: 'UkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
        signer_account_id: 'jimdoe.testnet',
      },
    ],
  });

  console.log('✨ 26 action_receipts successfully created!');

  console.log('✨ 26 receipts successfully created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
