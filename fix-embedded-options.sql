-- Fix embedded options in question_text
-- This script removes the answer options (A, B, C, D) that were incorrectly included in question_text
-- The options are preserved in the answer_options array field

-- Backup the original data first (optional but recommended)
-- CREATE TABLE IF NOT EXISTS questions_v2_backup_embedded_options AS
-- SELECT * FROM questions_v2 WHERE id IN (
--   '0a40b9fc-8e25-4e82-b27b-4cf5f35ae112', ... [add all IDs]
-- );

-- Update Year 5 NAPLAN - Reading questions
UPDATE questions_v2
SET question_text = 'According to the passage, how far do grey whales swim during their migration?'
WHERE id = '090da1bc-6e7d-4d31-b5b8-89615590f1b9';

UPDATE questions_v2
SET question_text = 'According to the passage, what holds the record for the longest migration of any animal on Earth?'
WHERE id = '7f410856-21cb-444c-9118-1d4a5aa6d8d2';

UPDATE questions_v2
SET question_text = regexp_replace(question_text, E'\n\n[A-E]\\).*$', '', 'n')
WHERE id = '9f9fee93-7747-4b6b-ac8e-83f947345b60';

-- Update ACER Scholarship - Humanities questions
UPDATE questions_v2
SET question_text = E'Read the passage and answer the question.\n\nPassage: The Mystery of the Moai: How Ancient Islanders Moved Giant Statues\n\nOn a remote island in the Pacific Ocean, hundreds of enormous stone statues stand guard along the coastline. These mysterious figures, called moai, have puzzled scientists and visitors for centuries. The moai are found on Easter Island, also known as Rapa Nui, which lies over 3,500 kilometres from the nearest continent. The island''s ancient inhabitants carved these impressive statues between 1400 and 1650 CE, but the question remains: how did they move them?\n\nThe moai are truly remarkable in size and number. Nearly 900 statues exist on the island, with the average moai standing about four metres tall and weighing around 14 tonnes. The largest moai ever erected reached an incredible ten metres in height. The statues were carved from volcanic rock found in a quarry on one side of the island. Workers used simple stone tools called toki to chip away at the rock face. Once a statue was finished, it had to be transported to its final location, sometimes more than ten kilometres away.\n\nFor many years, people believed the islanders used wooden logs as rollers to move the massive statues. They thought teams of workers pushed or pulled the moai across these rolling logs. However, recent research suggests a different method. Scientists now think the islanders ''walked'' the statues to their destinations. This technique involved rocking the moai from side to side whilst pulling it forward with ropes. The statues have a special shape with a forward-leaning design that makes this walking motion possible.\n\nIn 2012, researchers tested this walking theory with a concrete replica of a moai. A team of eighteen people used three ropes to move the three-metre-tall statue. They pulled the ropes in a coordinated pattern, causing the statue to waddle forward like a penguin. The experiment proved successful, and the replica travelled about 100 metres. This discovery changed our understanding of how the ancient Rapa Nui people accomplished this engineering feat.\n\nThe moai represent more than just impressive stone carvings. Each statue honoured an important ancestor or chief of the island''s clans. The islanders believed the moai held spiritual power and protected their communities. Families competed to create the largest and most impressive statues, which explains why so many were made. Sadly, by the 1800s, all the moai had been toppled during conflicts between clans. Today, many have been restored and stand once again, reminding us of the ingenuity and determination of the Rapa Nui people. Their achievement demonstrates that ancient societies developed clever solutions to difficult problems using simple tools, teamwork, and creative thinking.\n\nThe stone tools used by workers to carve the moai were called:'
WHERE id = '0a40b9fc-8e25-4e82-b27b-4cf5f35ae112';

UPDATE questions_v2
SET question_text = E'Read the passage and answer the question.\n\nIn the passage, the word ''remote'' means:'
WHERE id = '152c7421-5a4a-4fd2-a213-d33e89d78119';

UPDATE questions_v2
SET question_text = E'Read the passage and answer the question.\n\nKarl von Frisch received the Nobel Prize in:'
WHERE id = '2d60c9fd-66f0-45ac-94e3-9815cd927d94';

UPDATE questions_v2
SET question_text = 'According to the passage, what is the key difference between the author''s view and the critics'' view regarding reduced school days?'
WHERE id = '42b976cb-cacf-4e5c-912b-8403baac5bfd';

-- For the remaining questions, use a regex pattern to remove embedded options
-- This removes everything from the first option (A) onwards
UPDATE questions_v2
SET question_text = regexp_replace(question_text, E'\n\n?[A-E]\\)\\s+.*', '', 'sn')
WHERE id IN (
  '6db49112-92ba-4ade-91cd-4aebf8c4a9f8',
  'b8088cbb-0682-40f7-aa7e-4f86caeef856',
  'f9feb86f-8a0a-4e53-8523-76a6f9c29b3c',
  'be33be72-c509-4f53-b014-a263b2b81315',
  'af174d70-b5f5-49ce-9dfc-ad19b0df1f62',
  '672f71b4-472a-4b9e-996c-4b5e0edd5459',
  'fcbfa39d-c352-4f3a-90be-fca5e51250bf',
  'afdeee9a-f621-4878-b93e-c25b7b114e99',
  '5f96a971-5176-4a8b-b348-59f2f97ce70e',
  'bf87c0f8-1566-4555-a44b-cd9398ae3013',
  'bf4aa950-d30f-4a84-bc71-3f7e93899467',
  'ae321a4d-2b5e-4aaf-9ce6-c229723da83b',
  '47359181-ab25-44de-9db7-5ee5e02693d9',
  'a3e0261a-a6e8-4989-9084-e3bdcaeecb9c',
  '48c1a39a-b75f-4875-b38e-d6b4791ca33e'
);

-- Verify the changes
SELECT id,
       LEFT(question_text, 100) as question_preview,
       array_length(answer_options, 1) as num_options
FROM questions_v2
WHERE id IN (
  '0a40b9fc-8e25-4e82-b27b-4cf5f35ae112',
  '152c7421-5a4a-4fd2-a213-d33e89d78119',
  '090da1bc-6e7d-4d31-b5b8-89615590f1b9',
  '9f9fee93-7747-4b6b-ac8e-83f947345b60',
  '7f410856-21cb-444c-9118-1d4a5aa6d8d2',
  '6db49112-92ba-4ade-91cd-4aebf8c4a9f8',
  '2d60c9fd-66f0-45ac-94e3-9815cd927d94',
  'b8088cbb-0682-40f7-aa7e-4f86caeef856',
  'f9feb86f-8a0a-4e53-8523-76a6f9c29b3c',
  'be33be72-c509-4f53-b014-a263b2b81315',
  'af174d70-b5f5-49ce-9dfc-ad19b0df1f62',
  '672f71b4-472a-4b9e-996c-4b5e0edd5459',
  '42b976cb-cacf-4e5c-912b-8403baac5bfd',
  'fcbfa39d-c352-4f3a-90be-fca5e51250bf',
  'afdeee9a-f621-4878-b93e-c25b7b114e99',
  '5f96a971-5176-4a8b-b348-59f2f97ce70e',
  'bf87c0f8-1566-4555-a44b-cd9398ae3013',
  'bf4aa950-d30f-4a84-bc71-3f7e93899467',
  'ae321a4d-2b5e-4aaf-9ce6-c229723da83b',
  '47359181-ab25-44de-9db7-5ee5e02693d9',
  'a3e0261a-a6e8-4989-9084-e3bdcaeecb9c',
  '48c1a39a-b75f-4875-b38e-d6b4791ca33e'
)
ORDER BY id;
