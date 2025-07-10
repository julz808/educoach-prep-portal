-- EduTest Practice Test 1 Balanced Removal Script
-- Generated on 2025-07-10T10:46:53.215Z
-- Strategy: Remove older questions while maintaining sub-skill and difficulty balance
-- Total questions to remove: 106

-- REMOVAL BREAKDOWN BY SECTION:
-- Verbal Reasoning: removing 12 older questions (keeping balanced 60)
-- Mathematics: removing 36 older questions (keeping balanced 60)
-- Written Expression: removing 58 older questions (keeping balanced 2)

-- Remove excess questions from practice_1 (maintaining balance)
DELETE FROM questions WHERE id IN (
  'ffbd880a-6e13-4b23-9f93-35214c08fa87',
  '926caa50-8a37-4088-bf43-c9b0fb7d20d5',
  '0f70c756-4229-4cea-8a0d-11bf565571bd',
  '7195afdc-dc12-46c0-9479-5b6192b9594e',
  '9b33e041-c21d-4743-9020-9e9e482a1ec9',
  'afef587f-f411-4f64-ac39-c495d76c3ac1',
  '06587dae-5f4e-44bd-9df4-6909f67009a7',
  'bf6e4945-4320-4002-9fbd-8a4007905201',
  'ca74a4e9-c553-4f5d-9ead-027c61f80057',
  '74da3dc3-8119-46b5-ba43-5755ba25ace6',
  'c27479a0-e592-4516-8425-ab6e166b2c60',
  '0e7ac61c-dcbd-4422-ba7c-cc30564469ec',
  '2992ca10-b810-4484-9867-1ae0c8949eb1',
  'c1789e34-8846-4fa3-aafd-cbae43972308',
  '734879aa-7120-4d1e-ab77-34904d9263dd',
  '26cfced8-168b-4815-bdec-e198313eb710',
  'e5d21756-7cc6-4ba0-9de6-d0221c096eec',
  '33acba68-8483-4e6c-9bcf-8b6b0af85030',
  '67f76b1c-a752-427c-bd6e-31398d02bf3a',
  '5239e27e-a828-4202-b75a-bf1eed86370a',
  '507f8402-a5c1-4857-a881-909c5966281d',
  'e786b1e1-f223-4d23-881c-13492f57a445',
  'c59a14c4-c3f8-4f06-9872-2172b9918ca4',
  '07d56a49-5b98-4169-aed1-787e433fb51b',
  'c51fcb10-7998-44df-829d-815009d308bd',
  '44334042-c23a-4706-be14-71b3b9936b71',
  '7bafc856-6fbc-4267-9f27-b87cd10a35da',
  '79e5ef0e-22e4-4d0f-becb-36957fd5a75d',
  '9f4580de-2fa1-4663-a2d4-5c469a29331f',
  '745447c2-df7d-401f-a912-04bc75e2ed50',
  '6485244a-5992-47cb-8b42-2463f97fb2ba',
  '780e4967-8827-4a82-8881-1fda2db7a903',
  '4ddf5791-2bca-40e9-9e33-fc4704fa1808',
  '3c4762d9-0e15-477b-8013-7808a509ab52',
  'be44b15a-98fd-401a-8cb1-34157a34f25a',
  '1e15ddef-737b-4cdf-b28e-bd92b7067954',
  '410c67b0-4032-4250-b30b-494cf5a5e49d',
  '8b7ac3c8-a6af-49eb-8e4a-a5bec1a3674a',
  'e083aac7-f3b9-48ef-8da2-3f14bc26028d',
  '31578264-683b-4161-97df-7dfee2d49544',
  '73af2de2-0c78-402d-9f07-cfadcf73e3d8',
  '7a88b32c-71c8-4632-a680-9ff608736ca1',
  'cd2622f4-70e3-4702-8ff8-c5405ae87077',
  '5ec13f86-d5fb-4345-bc38-49f2d2674732',
  '06e34f47-1934-42d5-92f2-ac20ae2d5b25',
  '0ac20c7b-c7cd-4a3b-9ee4-872ac50bf45d',
  '9d3e6c64-c7a3-48e3-9c12-67818c68acf0',
  'cfd53ca3-de0f-4570-8cf8-0e81e3c2951c',
  '11314380-9098-4f71-a394-3346424a7d66',
  'fd37f1a8-5af2-4c48-8a09-eb00913f5710',
  '1eada3c4-42e7-4ee8-a3df-236970b09b5e',
  '6e8560e9-517e-424c-9b61-84d5b4ab8bbd',
  '75c374d0-0b70-4fd5-b871-8017b033669d',
  'ea0f68d8-a2e6-4c74-8aba-9ea7973f800a',
  '92e78166-be3e-4b2b-a7a7-9393ca52aa99',
  'db038a1b-e2a7-46f5-9568-d49aa50bb613',
  '1b1766e8-6f63-44ba-a8ff-8655edbec331',
  '80799d2f-32a9-480f-8147-e82e71e64a80',
  '768ed284-1a34-41b0-9222-0da68f5411bb',
  '899a7df8-fe91-40ba-b4f9-662588b6bd4c',
  'ac8105bd-f6f5-46e8-a08d-b282507267ef',
  '27902ccd-f58c-4232-b520-7c2a9e6ad5b0',
  'afabdf96-b9ae-4f60-8528-c33fd7d8aa08',
  '21691488-7d10-4f3f-8d8f-cba74fe0483d',
  '522f9fbd-c790-4986-92c1-1f78d1ca1bd5',
  'df607005-543c-4687-8bfc-52e839e68e07',
  '032289f0-078f-48af-b724-aad3020d9f42',
  '3eb42c4c-b028-42f0-b307-0ee48ae90922',
  '5deb21b0-b51e-4c82-ad96-ed67b5b8e5b7',
  '2e27d3a5-878f-4548-883a-cb73c9760ce6',
  '6b01f85c-0bf8-4a82-9179-f5b55abb34d3',
  '46f4e67f-3286-4ede-8ba8-17324c036b7e',
  '667e9fe1-7afc-4637-96f4-50bbd19e9e55',
  '4afe53ac-f038-41aa-bf00-67b529a5f40d',
  '4afa0d6e-1777-4321-87b0-28b9f3ab6295',
  '6ec45eaf-7c62-4abb-a310-dbe714350689',
  'fdb60ea0-3490-4c05-9c1e-73eab281c9e4',
  '634967dc-3180-4dd5-875b-6a35ebc86313',
  '93385331-9d5a-42d9-8e57-be11f71bfed7',
  'a3d6bf9b-5312-458c-8574-49870eb5a676',
  '4af4e777-8966-459c-8058-7729d7a48cfd',
  'e9540d95-7b72-414e-96d0-452647996f1e',
  '4cf916a2-155a-4170-82da-b92ada2de20a',
  'b407ad24-36e6-4e7f-ad48-13897b7cccb5',
  '88166900-062b-42f7-87ef-2b2199cc4c9b',
  '786b38b0-6106-4841-95d7-9d8fb4172293',
  '5a2135d1-8304-46e0-bec2-db1dedfcb3de',
  '8ba5c110-fe9b-4629-8dff-c246a5e688c0',
  '3df6ffa1-615f-465b-ae0d-1a69ead2cef6',
  '3ed861a9-1f35-4fa6-86e0-80e1fc23d8a9',
  'c681b5fc-3757-4f13-87a6-f97aa96acdbd',
  '0a199809-85f4-4925-9419-e3fda07bd3a9',
  '2d0121f9-c23c-48a6-8209-2eab1ac3cc05',
  '5b884cc7-b875-42de-81eb-698491f8bcb9',
  '64e48045-b2d2-4949-9781-8e7fb8e9f218',
  'f4955455-2602-4077-87c2-d7ecea22b137',
  '42eb4246-6dc3-45ae-8429-3cc1c77e7b4a',
  '14afcda9-806c-4c89-9ff7-1f6cf9ff9302',
  'd3c3c23d-f8f6-4d14-b7d0-16c2c808681a',
  '2df75486-c1df-4325-8b9e-ef4a09761256',
  'a552edbc-3f8c-4910-b61f-f03b957f5e84',
  '0ebec876-8c4c-419e-adcb-9d9cfc7334e7',
  '3782cef4-6699-44c0-802f-8e4e7b713a02',
  'e4dda072-e181-4c77-b292-c554ff402c8e',
  '170f34a8-83af-41d3-9886-e83323cc9e68',
  '26cb957a-bdf8-4afe-826a-c5373e4cec0a'
);

-- VERIFICATION QUERIES:
-- Check final counts for practice_1
SELECT section_name, COUNT(*) as question_count
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' AND test_mode = 'practice_1'
GROUP BY section_name
ORDER BY section_name;

-- Check sub-skill distribution
SELECT section_name, sub_skill, difficulty, COUNT(*) as count
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' AND test_mode = 'practice_1'
GROUP BY section_name, sub_skill, difficulty
ORDER BY section_name, sub_skill, difficulty;
