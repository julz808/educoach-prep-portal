import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORPHANED_PASSAGE_IDS = [
  '727a288b-35b5-4011-8ae5-bc479b82a109',
  'ea9d044e-7dd2-4d4e-9da8-aeb2ab4a6553',
  '7e7e47a6-c7e9-425c-955e-1ecdbc90a41c',
  'a07157b6-033a-44a5-982f-dd7f28b0290c',
  '4866ce3a-713a-4bc2-9bbd-edf07449498d',
  'd7cafa59-fbb2-4ecc-ba1c-93330929bc78',
  '314f7399-f045-4a90-8cc3-e55867e168b1',
  'f7a4b5c3-2150-4c07-bb47-45a64e41ddd7',
  '24ba3506-955a-493c-abe5-c6baaac7865a',
  'e99ba2c8-90c2-444a-b71b-f0b1e6858a3f',
  '3265fd0f-597a-4ce0-831d-51420825382b',
  '0af2b159-c580-423b-8486-14da6f657b7b',
  'e7a583fd-eabd-4e0e-adbf-8891f80b4340',
  '5ef8ab3b-d860-4d20-9333-2a395cfc5eb2',
  'f2983857-30bb-4bcc-b3c5-ccb9c684a2fa',
  'd7f074d3-5136-4988-b6ac-f64ed94d9244',
  '54d2a549-149c-4ca1-9d1d-54282458419e',
  'fbdb1006-6099-4f53-b091-29c3c2184794',
  'fd68717e-9b74-4846-97ac-9f646dd2dab3',
  '836a3543-be71-408a-8426-46c13ba7599d',
  '4720420f-c038-4752-a504-80fd375e8d09',
  '058388bd-e37a-465e-b3fd-a322f637f4c9',
  '13d1c719-fcc5-441a-a397-a0b43e3a6afa',
  '89e1a8fb-51fa-441f-872c-e78e968b2e6d',
  'cff35733-ab36-4d78-8be1-0b856971db70',
  'c2ed5a91-d635-4b56-9bf9-2fedfaaa60e6',
  '328d307c-fe66-4f78-b89b-98ce55f9195a',
  'f2352c20-dfaa-4c7a-ac4b-415bd16aeaab',
  '4d87cf44-e380-40f7-a5b6-7bca48c4aefe',
  '458e230e-636b-4c96-b8da-f0d38e6b9305',
  '087143b0-c65e-41bc-b089-1bacddbf8fae',
  '756b5c32-a39b-4d53-ab1a-79acc39bed71',
  '9435cd91-467f-47cb-8780-2137a5a0694f',
  'bc3fc847-8587-4a6f-b899-dd8db568e279',
  '988bed0f-1264-4367-bd67-8fda009f9088',
  '87ac66ab-d40e-48eb-b1e7-3e65afeb6013',
  '9775df05-9066-487f-bb04-cdf4022cae4a',
  'd3f58cc1-4419-4a33-8f5c-c25d44e86589',
  'b9463b16-accb-4478-a63a-0718c4f571d9',
  'f68c5583-fc1a-4db8-a5cd-55ba6e0ea255',
  'ec2b6308-7336-470a-8761-c376b52b52af',
  'a8d8a3c3-bce1-4180-b832-bbbb8b495ce1',
  '5c65fb11-a043-4e12-8049-e466e24d19dc',
  'b63fd963-b78d-49f5-9191-2bbbb377870a',
  'bace3bb8-b955-472d-836a-c724a656451e',
  '5e175bc6-2188-4b1f-8807-e2bfc32b6fb5',
  'bd2c0e08-ebf1-48b0-bbbd-987cca6e4957',
  'efbc3dd3-784c-41fe-bd1b-65397c715fb8',
  'bbb43dbc-9ad6-45e6-adba-6cbe59bcd06c',
  '6d198557-25ba-4f00-a789-5e2eb277a78e',
  '0a408cfa-af08-498e-a9d2-8a2c30dad3bb',
  '6b138894-d767-4e4f-bdcb-07a535025572',
  '503cf7fd-96de-4c9b-8931-3f3a8e206d82',
  'dd0a083c-23ec-45bf-b9a5-726ab663a496',
  '100eedf5-a681-4bd7-b1e6-cb82cc109876',
  '2f3a10c9-88e8-4936-a4bc-107be75e45ee',
  '424b3d72-48fd-4a13-885e-87dd9d264023',
  '8dde88ba-fd48-4db6-bee1-13075dbf98ee',
  '1d0b3853-4a7a-4f24-ad65-048033589bf2',
  'fdf7a7ed-bc58-4644-9877-ca1e791192b3',
  '0ee4c755-d713-4c12-a944-8bcda06ca0b6',
  '30d2291b-6606-4d37-ab49-ec58fe09ff62',
  '0fc1d606-5245-489a-8381-670063337559',
  'ee01ddba-c896-453e-9e92-fbd343a29757',
  '125a6868-8834-49a0-bc5a-ced9e541b9a6',
  'a4a9f583-eeb8-485a-9651-76fb4a1f5b76',
  'bd5d9eea-bff6-42b3-9f02-8ff754ba0ccc',
  '843c0651-5bda-47f9-905a-6145538e166a',
  'f0c254b8-d7aa-42bc-9d68-687fe95c9ad6',
  'e25aa75b-8806-4a94-9831-b20f4f97c253',
  '8dd46c2d-88f6-47d4-bdc1-36ae6e7d3604',
  '6fdb9cbc-d930-4cdf-b6df-1219f31d9e4c',
  'bb680d82-573f-4360-b266-22f6eab9deb9',
  '1c24ed6f-a2e6-4361-9b25-384a5c871035',
  'ddb6999b-2f2a-43f2-b339-63e229a1b79a',
  '2a4873e9-3821-4feb-af6a-5f0d614753fc',
  '4425162b-a4e1-4a90-a102-0f9c5e809f4f',
  '0110cba0-5753-4a23-bf60-d568511e5b3d',
  '62ebf06d-b2a1-453d-9141-65f41894ca38',
  '0dad60be-bfda-44c8-81fb-424a5cec9c58',
  'bcef6736-f4f8-41d1-b828-e382343f60b8',
  'e915d14a-11e8-4d9c-8827-91221a2dd330',
  '63cd2ed0-de5b-416e-916f-2e4dcd6f23d7',
  'edfaa675-f496-4746-a190-cd0436e29f35',
  '009f12bd-8e8d-4d6f-8c66-25785ef41d5b',
  'f1f3f68f-b85a-4ff1-bc91-8ad7e46af135',
  'd4dced82-24d7-4623-b53f-8f479649cb63',
  '1ed0f5cf-b4d2-4c67-ad83-cb7be96b2bbf',
  '30ad1abd-68c6-4f39-a879-1e49f7fb011d',
  'd3fdf750-6ae5-4c27-bbdd-af3a0a50ba72',
  '823b6492-eaf2-4f12-a2b6-8f618517157e',
  'e9b7dbce-304e-438a-a229-4f57998b8320',
  '49e77fc8-63a7-47e2-bbd8-76848020c5de',
  '464b1332-503c-494e-80ff-79c6d05f2147',
  'eff51dcb-ceaa-44c0-8411-b540e615bc77',
  '97ba5915-b9ba-43d9-8408-1c8e8396bdc0',
  '533507c3-0b40-489a-bed6-32b921c1d8e9',
  'fc11ef31-feb6-4d70-b5db-8dcfc288579d',
  'e0458571-be85-4274-8a00-98c05127eede',
  '5d8f597e-47d7-4a71-bcd3-d3d6064b6005',
  '9ce9c840-8631-4ca2-b35a-1a24c41e9d06',
  '4fb177bb-0789-4931-b861-915fd66be9e5',
  'a62d8b22-1877-493b-ac12-4d1aa5046776',
  '9cb912b2-440f-4347-9462-b3cd4970353f',
  '7c5debc9-16ba-465b-bf18-aa8d8e6e29c6',
  '960f5bb0-22c1-4a5e-9d9a-40b6f1abdeee',
  '8414b997-e2da-48c2-a19b-361456305273',
  'fd1571c3-5839-462c-9271-c19b061e219c',
  '5cfb737e-408b-46f9-b25d-dad9212b5ac5',
  'fce07408-e00b-467c-84a8-f3d538f66c83'
];

async function deleteOrphanedPassages() {
  console.log('🗑️  ORPHANED PASSAGES CLEANUP\n');
  console.log(`Found ${ORPHANED_PASSAGE_IDS.length} orphaned passages to delete`);
  console.log('These passages have no associated questions in questions_v2\n');

  console.log('Deleting passages in batches...');

  // Delete in batches of 100
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < ORPHANED_PASSAGE_IDS.length; i += batchSize) {
    const batch = ORPHANED_PASSAGE_IDS.slice(i, i + batchSize);

    const { error, count } = await supabase
      .from('passages_v2')
      .delete({ count: 'exact' })
      .in('id', batch);

    if (error) {
      console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error);
    } else {
      deleted += count || 0;
      console.log(`  ✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${count} passages`);
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Total passages deleted: ${deleted}/${ORPHANED_PASSAGE_IDS.length}`);

  // Verify
  console.log('\nVerifying cleanup...');
  const { count: remaining } = await supabase
    .from('passages_v2')
    .select('*', { count: 'exact', head: true });

  console.log(`   Passages remaining in database: ${remaining}`);
}

deleteOrphanedPassages().catch(console.error);
