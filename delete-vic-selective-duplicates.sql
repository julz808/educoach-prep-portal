-- VIC Selective Entry Duplicate Questions Deletion Script
-- Generated: 2026-03-03T07:54:35.802Z
-- Total questions to delete: 73
-- Total unique questions to keep: 29

-- STEP 1: Backup duplicates before deletion
CREATE TABLE IF NOT EXISTS deleted_vic_duplicates_backup_20260303 AS
SELECT * FROM questions_v2 WHERE id IN (
  '083600a5-c827-4f0c-87d9-12c3378087b3',
  '9207b33a-59a1-42fb-80aa-f33b524e1223',
  '17fa09f8-f154-40ec-b0ee-6f2ea5b31dd6',
  '5ea45800-47f3-41ec-afbb-3e14ba3b972e',
  '75016f52-70be-4875-b300-d446e12b35f0',
  '4d5cf7a2-06ba-4486-9d11-43c471481b30',
  '855d5b9e-8145-4cac-9b4e-452b0c5c46c3',
  '3e5439c6-37d4-48f8-9903-00bae6491a1d',
  '891ecb0b-43a3-42d0-8208-e9ea63f2a638',
  'a930cfef-5738-4d45-97ed-857bccd4add8',
  'ee3c7f41-a8de-4767-b668-7c7d40d6bd4a',
  'f4c57b8f-bd68-4696-8362-9f52eb35c7ed',
  '79920dde-401e-4348-aec0-6db4bcec99b4',
  'f8214bc1-e95c-40b8-bee2-01f8881cf369',
  '713b9736-2366-4661-821d-f1408358c390',
  'e625a0e9-9d7e-4f3c-bf5f-26ac4bf304d7',
  '044845f6-5d9d-4e46-92e0-e40c47619132',
  '424afa75-3f48-478c-8662-668735c4d834',
  '8dc22e2c-c454-4619-ad29-c0f8efe5e408',
  '1c228dca-d4f9-4d84-8de7-8d7d9529dca9',
  'd059f892-f12d-4a56-80d5-8a7f0dbcd657',
  '61551a59-3985-48a4-b425-b24a26be4c72',
  '1b247539-b173-4295-81a3-a834d8f306d3',
  '5b8b73a2-4d8c-45fc-8af4-63b74aeafadc',
  'e41526cf-5ccb-424d-9c5a-7d3394a46e13',
  '791edc2c-f570-4757-9b35-657db282cd9d',
  '01dd7752-b0b6-48e4-9387-4352d44093ed',
  '8ecaac19-6a9a-4557-a394-4fc7b99a0cb0',
  '7ed1840e-24a3-4428-bb14-246bdc3d9b37',
  '65dc1fb9-df9e-4db1-b6b9-e97a707b4eb4',
  'b6c16927-ebeb-4a41-9aa5-54adab18a740',
  '1b12567d-8d1e-475b-a343-0b3b12a103fe',
  '0cd102ce-3da2-4139-bd5f-c59270aced1f',
  '4c86bf12-7701-4cc6-a8ca-660fb3f014e9',
  'd4783704-5303-4f35-8f74-f84672b20aca',
  '071d08de-9d92-41ca-9863-7b8e14d66dfd',
  '94a7edc6-3cd3-408b-b181-d8ab4622a978',
  'cf07bf25-f995-43db-8f06-0d28f52eae55',
  '0ecedc93-298e-4b17-bf7b-1b9e2675a657',
  '124c0404-8312-4ec2-8c18-f2368cd0ea06',
  'a3ea52ab-ad21-42ff-a089-b0b6d023a771',
  'c4bb49e7-5219-40fe-a4e5-96c599d0abe2',
  '0142c610-864d-45c5-b476-7a52f8f22c46',
  'd4439235-2c8b-4773-b9c9-4007849d139f',
  '77615afb-97bb-4c8c-8d3d-0fd992d8dbab',
  'f9ddb1e7-3ca6-4a93-9cac-8fdc3e522db1',
  '612882ee-9c61-432d-8ff1-4a232b1a28d8',
  'e920e40d-7529-4d51-8195-d54bf64008f2',
  '4acea35c-83e0-4663-aa18-8296c0862af2',
  'b2e9dee8-3f46-4ee2-a861-1eadf7d9da31',
  '7dcce755-5d7f-41a6-813e-4875fac028ef',
  'a8f1ff4e-0c45-4de4-a017-788bf5e5d2ef',
  '1b9f04aa-a652-490f-bb47-21b041b0e84c',
  '2538dff2-5e90-4ec2-90c5-5c17a2d714d2',
  '07ba7b10-03a5-475a-aeed-1e2889e0f54d',
  '6994d3d6-6eb7-48b1-9693-deb8e1a984e1',
  '0f22122e-2359-427c-9926-df2f164f295e',
  'cf1119b7-82d5-4bb2-9b3a-1d890f525adb',
  '6efe3f2b-02cf-4fb0-b77f-85af987c38e2',
  '8a01a3d1-5f57-45bd-881e-96e6623e21c8',
  'dc8539e3-05f1-40cf-96ee-9a789134331f',
  '412da7ef-c211-41c5-aba8-5b3a8e91328c',
  '83699c5d-6c86-4369-a094-5e267102b838',
  'f4635758-9408-444c-83a9-969eb3ea6dd1',
  '2298c25d-0773-4b0d-b0e7-e8894f8391f6',
  '50553886-ad25-43a9-8d59-58e7bc3ae5fb',
  '875ba38a-6f8d-40a1-b47d-ac12a04b04bc',
  '08f6bb67-525b-4a9b-9f2c-367ee39415a2',
  '3009d654-e13e-48c9-b294-a558350ca721',
  'c337c1db-87ff-4b26-92ed-8ead65191376',
  'c2559284-84bc-4016-99b0-28ae6c25fba0',
  '29d593c6-63d0-4c53-b1b6-26e709514dc4',
  'cf5c0203-015e-4685-8e22-94b64c42b7fa'
);

-- STEP 2: Verify backup was created
SELECT
  'Backup created' as status,
  COUNT(*) as backed_up_questions
FROM deleted_vic_duplicates_backup_20260303;

-- STEP 3: Delete duplicate questions (keeping the oldest in each group)
DELETE FROM questions_v2
WHERE id IN (
  '083600a5-c827-4f0c-87d9-12c3378087b3',
  '9207b33a-59a1-42fb-80aa-f33b524e1223',
  '17fa09f8-f154-40ec-b0ee-6f2ea5b31dd6',
  '5ea45800-47f3-41ec-afbb-3e14ba3b972e',
  '75016f52-70be-4875-b300-d446e12b35f0',
  '4d5cf7a2-06ba-4486-9d11-43c471481b30',
  '855d5b9e-8145-4cac-9b4e-452b0c5c46c3',
  '3e5439c6-37d4-48f8-9903-00bae6491a1d',
  '891ecb0b-43a3-42d0-8208-e9ea63f2a638',
  'a930cfef-5738-4d45-97ed-857bccd4add8',
  'ee3c7f41-a8de-4767-b668-7c7d40d6bd4a',
  'f4c57b8f-bd68-4696-8362-9f52eb35c7ed',
  '79920dde-401e-4348-aec0-6db4bcec99b4',
  'f8214bc1-e95c-40b8-bee2-01f8881cf369',
  '713b9736-2366-4661-821d-f1408358c390',
  'e625a0e9-9d7e-4f3c-bf5f-26ac4bf304d7',
  '044845f6-5d9d-4e46-92e0-e40c47619132',
  '424afa75-3f48-478c-8662-668735c4d834',
  '8dc22e2c-c454-4619-ad29-c0f8efe5e408',
  '1c228dca-d4f9-4d84-8de7-8d7d9529dca9',
  'd059f892-f12d-4a56-80d5-8a7f0dbcd657',
  '61551a59-3985-48a4-b425-b24a26be4c72',
  '1b247539-b173-4295-81a3-a834d8f306d3',
  '5b8b73a2-4d8c-45fc-8af4-63b74aeafadc',
  'e41526cf-5ccb-424d-9c5a-7d3394a46e13',
  '791edc2c-f570-4757-9b35-657db282cd9d',
  '01dd7752-b0b6-48e4-9387-4352d44093ed',
  '8ecaac19-6a9a-4557-a394-4fc7b99a0cb0',
  '7ed1840e-24a3-4428-bb14-246bdc3d9b37',
  '65dc1fb9-df9e-4db1-b6b9-e97a707b4eb4',
  'b6c16927-ebeb-4a41-9aa5-54adab18a740',
  '1b12567d-8d1e-475b-a343-0b3b12a103fe',
  '0cd102ce-3da2-4139-bd5f-c59270aced1f',
  '4c86bf12-7701-4cc6-a8ca-660fb3f014e9',
  'd4783704-5303-4f35-8f74-f84672b20aca',
  '071d08de-9d92-41ca-9863-7b8e14d66dfd',
  '94a7edc6-3cd3-408b-b181-d8ab4622a978',
  'cf07bf25-f995-43db-8f06-0d28f52eae55',
  '0ecedc93-298e-4b17-bf7b-1b9e2675a657',
  '124c0404-8312-4ec2-8c18-f2368cd0ea06',
  'a3ea52ab-ad21-42ff-a089-b0b6d023a771',
  'c4bb49e7-5219-40fe-a4e5-96c599d0abe2',
  '0142c610-864d-45c5-b476-7a52f8f22c46',
  'd4439235-2c8b-4773-b9c9-4007849d139f',
  '77615afb-97bb-4c8c-8d3d-0fd992d8dbab',
  'f9ddb1e7-3ca6-4a93-9cac-8fdc3e522db1',
  '612882ee-9c61-432d-8ff1-4a232b1a28d8',
  'e920e40d-7529-4d51-8195-d54bf64008f2',
  '4acea35c-83e0-4663-aa18-8296c0862af2',
  'b2e9dee8-3f46-4ee2-a861-1eadf7d9da31',
  '7dcce755-5d7f-41a6-813e-4875fac028ef',
  'a8f1ff4e-0c45-4de4-a017-788bf5e5d2ef',
  '1b9f04aa-a652-490f-bb47-21b041b0e84c',
  '2538dff2-5e90-4ec2-90c5-5c17a2d714d2',
  '07ba7b10-03a5-475a-aeed-1e2889e0f54d',
  '6994d3d6-6eb7-48b1-9693-deb8e1a984e1',
  '0f22122e-2359-427c-9926-df2f164f295e',
  'cf1119b7-82d5-4bb2-9b3a-1d890f525adb',
  '6efe3f2b-02cf-4fb0-b77f-85af987c38e2',
  '8a01a3d1-5f57-45bd-881e-96e6623e21c8',
  'dc8539e3-05f1-40cf-96ee-9a789134331f',
  '412da7ef-c211-41c5-aba8-5b3a8e91328c',
  '83699c5d-6c86-4369-a094-5e267102b838',
  'f4635758-9408-444c-83a9-969eb3ea6dd1',
  '2298c25d-0773-4b0d-b0e7-e8894f8391f6',
  '50553886-ad25-43a9-8d59-58e7bc3ae5fb',
  '875ba38a-6f8d-40a1-b47d-ac12a04b04bc',
  '08f6bb67-525b-4a9b-9f2c-367ee39415a2',
  '3009d654-e13e-48c9-b294-a558350ca721',
  'c337c1db-87ff-4b26-92ed-8ead65191376',
  'c2559284-84bc-4016-99b0-28ae6c25fba0',
  '29d593c6-63d0-4c53-b1b6-26e709514dc4',
  'cf5c0203-015e-4685-8e22-94b64c42b7fa'
);

-- STEP 4: Verify deletion
SELECT
  'After deletion' as status,
  section_name,
  test_mode,
  COUNT(*) as remaining_count
FROM questions_v2
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
  AND section_name IN ('General Ability - Quantitative', 'General Ability - Verbal')
GROUP BY section_name, test_mode
ORDER BY section_name, test_mode;

-- STEP 5: Verify no duplicates remain
WITH question_fingerprints AS (
  SELECT
    id,
    section_name,
    test_mode,
    LOWER(TRIM(REGEXP_REPLACE(question_text, '\s+', ' ', 'g'))) as normalized_question,
    COUNT(*) OVER (PARTITION BY
      section_name,
      LOWER(TRIM(REGEXP_REPLACE(question_text, '\s+', ' ', 'g')))
    ) as duplicate_count
  FROM questions_v2
  WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
    AND section_name IN ('General Ability - Quantitative', 'General Ability - Verbal')
)
SELECT
  section_name,
  test_mode,
  COUNT(*) as remaining_duplicates
FROM question_fingerprints
WHERE duplicate_count > 1
GROUP BY section_name, test_mode;
