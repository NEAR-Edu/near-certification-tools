import { PrismaClient } from '@prisma/client';
import getRawQuery from '../prisma/cert-query-functions';

const prisma = new PrismaClient();
// eslint-disable-next-line max-lines-per-function
beforeAll(async () => {
  // create receipts
  await prisma.receipts.createMany({
    data: [
      {
        receipt_id: 'receiptidofJaneDoewith45charsxxxxxxxxxxxxxxx',
        included_in_block_timestamp: 1646224546000000000,
        included_in_block_hash: '',
        included_in_chunk_hash: '',
        index_in_chunk: 0,
        predecessor_account_id: '',
        receiver_account_id: '',
        receipt_kind: 'ACTION',
        originated_from_transaction_hash: '',
      },
      {
        receipt_id: 'receiptidofJohnDoewith45charsyyyyyyyyyyyyyyy',
        included_in_block_timestamp: 1645788799000000000,
        included_in_block_hash: '',
        included_in_chunk_hash: '',
        index_in_chunk: 0,
        predecessor_account_id: '',
        receiver_account_id: '',
        receipt_kind: 'ACTION',
        originated_from_transaction_hash: '',
      },
    ],
  });

  // create product action_receipts
  await prisma.action_receipts.createMany({
    data: [
      {
        receipt_id: 'receiptidofJaneDoewith45charsxxxxxxxxxxxxxxx',
        signer_account_id: 'janedoe.testnet',
        signer_public_key: '',
        gas_price: 0,
      },
      {
        receipt_id: 'receiptidofJohnDoewith45charsyyyyyyyyyyyyyyy',
        signer_account_id: 'johndoe.testnet',
        signer_public_key: '',
        gas_price: 0,
      },
    ],
  });

  console.log('✨ 2 action_receipts successfully created!');

  console.log('✨ 2 receipts successfully created!');
});

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});

it('should run query', async () => {
  const queryResult = await getRawQuery('janedoe.testnet', 1614632400000000000);

  console.log({ queryResult });
});
