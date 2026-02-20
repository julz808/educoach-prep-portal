-- ============================================================================
-- DELETE DUPLICATE QUESTIONS FROM questions_v2
-- ============================================================================
-- Generated: 2026-02-19T04:41:27.696Z
-- Total duplicates to delete: 101
-- Total duplicate sets: 55
-- Strategy: Keep oldest instance, delete newer duplicates
-- ============================================================================

BEGIN;

-- Duplicate Set #1: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is opposite to METICULOUS?...
--   KEEP: b6dd7024-2736-4123-9d30-248b979ec42b (created 2026-02-18T10:27:09.073303+00:00, mode: practice_1)
--   DELETE: 53a88f99-a8aa-439b-9622-41ed39ef3ad8 (created 2026-02-18T12:59:46.020021+00:00, mode: diagnostic)

-- Duplicate Set #2: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to ABUNDANT?...
--   KEEP: c8a8ecf5-c0cb-4aff-b1ee-99dc2c89d91f (created 2026-02-18T10:27:15.720386+00:00, mode: practice_1)
--   DELETE: 54c7e14c-2a77-40b3-9694-11b0985043d7 (created 2026-02-18T12:22:51.72179+00:00, mode: practice_4)
--   DELETE: 23ac751a-596b-41fd-9401-a8719913de5b (created 2026-02-18T13:00:26.113558+00:00, mode: diagnostic)

-- Duplicate Set #3: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to TIMID?...
--   KEEP: 99e1ba2e-f6ed-4625-97c3-0c218dd3c464 (created 2026-02-18T10:27:46.782482+00:00, mode: practice_1)
--   DELETE: ced7ba1f-815f-466f-a47d-80a85db8ca33 (created 2026-02-18T12:23:35.68297+00:00, mode: practice_4)

-- Duplicate Set #4: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is opposite to GENEROUS?...
--   KEEP: d5b327ed-9d08-4370-9b50-68bf99305f80 (created 2026-02-18T10:27:53.178191+00:00, mode: practice_1)
--   DELETE: 700e60dd-cf87-4d60-9c8d-fe9487b0808a (created 2026-02-18T12:23:13.583746+00:00, mode: practice_4)

-- Duplicate Set #5: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to SWIFT?...
--   KEEP: f53b5fe8-4886-452f-ba1e-73ddf637c090 (created 2026-02-18T10:28:06.892302+00:00, mode: practice_1)
--   DELETE: 5b3a8acf-a613-430a-ac9f-8f05a2ae6a03 (created 2026-02-18T12:23:20.195637+00:00, mode: practice_4)

-- Duplicate Set #6: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: CONDUCTOR is to ORCHESTRA as DIRECTOR is to:...
--   KEEP: 8717b1de-082f-4ccc-9dae-28ec6d22e6d5 (created 2026-02-18T10:28:27.51304+00:00, mode: practice_1)
--   DELETE: 077f9802-07ac-4e51-b3cd-596923b4c0ec (created 2026-02-18T13:01:34.301076+00:00, mode: diagnostic)

-- Duplicate Set #7: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: PEDAL is to BICYCLE as OAR is to:...
--   KEEP: 94665e18-bfaa-4a65-b7b7-82412fb353c3 (created 2026-02-18T10:28:42.162085+00:00, mode: practice_1)
--   DELETE: f8c1e0ee-a99a-4b08-b04a-10d714dbd706 (created 2026-02-18T12:24:56.93018+00:00, mode: practice_4)

-- Duplicate Set #8: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: CAPTAIN is to SHIP as PILOT is to:...
--   KEEP: 0f39e229-01b4-4291-8ca1-d144bc37d1d3 (created 2026-02-18T10:28:58.577612+00:00, mode: practice_1)
--   DELETE: 96a245f0-b003-4091-99e7-2c1ccf0b924f (created 2026-02-18T12:24:47.968532+00:00, mode: practice_4)

-- Duplicate Set #9: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Word Manipulation & Rearrangement
--   Question: Look closely at the following word: MARINES. A single word of seven letters can ...
--   KEEP: 4927cabd-9ef0-4520-a743-a2c601dd76e8 (created 2026-02-18T10:35:36.395595+00:00, mode: practice_1)
--   DELETE: be30026e-943f-46ca-90f3-8b5ea35b0a50 (created 2026-02-18T12:45:36.591016+00:00, mode: practice_5)

-- Duplicate Set #10: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Classification & Categorization (Odd One Out)
--   Question: Four of the following words are alike in some way. Which of the following words ...
--   KEEP: 6f81232f-211a-4db2-ad98-a3cdf827e9f2 (created 2026-02-18T10:42:00.147309+00:00, mode: practice_1)
--   DELETE: 6119b1a8-6479-4592-b574-072ef5a5ab74 (created 2026-02-18T10:42:08.036836+00:00, mode: practice_1)
--   DELETE: 0638c0bb-8d72-4199-9d21-a08c5065b20c (created 2026-02-18T10:42:22.741861+00:00, mode: practice_1)
--   DELETE: d615c9dc-663e-4f24-b391-c081f9f6654c (created 2026-02-18T10:42:29.741584+00:00, mode: practice_1)
--   DELETE: 32a2101e-78c6-449c-8afe-ee11143f5a55 (created 2026-02-18T10:42:38.01928+00:00, mode: practice_1)
--   DELETE: e36c7647-294b-40b4-af2a-ebbee1978d56 (created 2026-02-18T10:42:45.353153+00:00, mode: practice_1)
--   DELETE: 9a54d704-8c56-4ff0-93b7-ec98d458cddb (created 2026-02-18T10:42:53.954029+00:00, mode: practice_1)
--   DELETE: 5419c9b2-a270-4634-b8b5-e20830de99ae (created 2026-02-18T10:56:33.427762+00:00, mode: practice_2)
--   DELETE: 966aa6f0-a0fa-458c-8d00-46cf358576d4 (created 2026-02-18T11:35:16.232714+00:00, mode: practice_2)
--   DELETE: c7f42d41-ddad-4168-b887-2786e53f070c (created 2026-02-18T11:35:25.990954+00:00, mode: practice_2)
--   DELETE: 0de61979-64c5-410e-82fa-cdc5dd9b7dc4 (created 2026-02-18T11:35:33.444867+00:00, mode: practice_2)
--   DELETE: cb8477e0-6934-4bd8-adc7-1bac2bd8a3d4 (created 2026-02-18T12:21:37.703245+00:00, mode: practice_3)
--   DELETE: 37c39735-2fa1-4ce8-957a-ac3fbcbcdd06 (created 2026-02-18T12:21:56.150059+00:00, mode: practice_3)
--   DELETE: 4ea7e33b-fdb0-4073-8a87-3d8b1a59d1ee (created 2026-02-18T12:22:04.392555+00:00, mode: practice_3)
--   DELETE: 9bdd1641-4191-430a-996e-98225557c7eb (created 2026-02-18T12:22:11.306511+00:00, mode: practice_3)
--   DELETE: 1541085c-5b7a-415b-9bce-5f3c5ac00665 (created 2026-02-18T12:22:22.190438+00:00, mode: practice_3)
--   DELETE: 4e361140-2a60-4147-9fcc-72855c4adbcc (created 2026-02-18T12:22:29.348706+00:00, mode: practice_3)
--   DELETE: a2d79308-d4a9-4b6b-9ccc-89023f642bf2 (created 2026-02-18T12:22:35.743716+00:00, mode: practice_3)
--   DELETE: 7269b826-0d37-4b4e-a3c8-84924d6e5bf1 (created 2026-02-18T12:36:57.51055+00:00, mode: practice_4)
--   DELETE: 6a1d2250-e6b6-4de6-8ed3-86d619de4777 (created 2026-02-18T12:37:04.485023+00:00, mode: practice_4)
--   DELETE: d190c5b2-e6f7-48fe-9b21-27999b6d57b5 (created 2026-02-18T12:37:11.505019+00:00, mode: practice_4)
--   DELETE: 68fadc6a-9ba2-4719-85c8-d602ecb004bf (created 2026-02-18T12:37:18.000387+00:00, mode: practice_4)
--   DELETE: 15a9c958-1e63-4da3-acaf-20fb91fe1783 (created 2026-02-18T12:37:25.039215+00:00, mode: practice_4)
--   DELETE: c0eef9bb-566d-4527-b5dc-888c8495bce7 (created 2026-02-18T12:37:32.395521+00:00, mode: practice_4)
--   DELETE: 0f736625-c130-479d-afc4-f2e3bee57df2 (created 2026-02-18T12:37:39.234601+00:00, mode: practice_4)
--   DELETE: 2f4c189a-c235-42f6-b154-a83eb5f39606 (created 2026-02-18T12:58:29.191085+00:00, mode: practice_5)
--   DELETE: a3bd7bd0-ede8-49dc-85ac-2770097bd927 (created 2026-02-18T12:58:36.298707+00:00, mode: practice_5)
--   DELETE: 6327e7d2-7e09-4f0e-a6cc-7341a10209c3 (created 2026-02-18T12:58:43.810991+00:00, mode: practice_5)
--   DELETE: 8969359e-d9c7-4519-adc4-e40e925cf417 (created 2026-02-18T12:58:51.344011+00:00, mode: practice_5)
--   DELETE: 9a71258a-1c49-4f24-9a43-1597b8aff081 (created 2026-02-18T12:58:58.966265+00:00, mode: practice_5)
--   DELETE: 62086bd0-ebda-492a-9e3d-f171c049467f (created 2026-02-18T12:59:06.908577+00:00, mode: practice_5)
--   DELETE: 4dc34725-7346-4d9c-ad9c-d8904480414c (created 2026-02-18T12:59:13.913514+00:00, mode: practice_5)
--   DELETE: c9279ec1-dea5-458a-9780-fe208de3e865 (created 2026-02-18T13:14:11.727888+00:00, mode: diagnostic)
--   DELETE: 3158f6a4-ff56-4cdc-9ade-8aa1c67e9330 (created 2026-02-18T13:14:18.595978+00:00, mode: diagnostic)
--   DELETE: 5d946b28-9e54-49be-8b80-252737fd4f91 (created 2026-02-18T13:14:24.663488+00:00, mode: diagnostic)
--   DELETE: 5a176d08-0491-4867-b6fb-9d67671f2952 (created 2026-02-18T13:14:31.146296+00:00, mode: diagnostic)
--   DELETE: 66005e52-19e9-4317-8983-fe3c00e6126c (created 2026-02-18T13:14:38.513228+00:00, mode: diagnostic)
--   DELETE: 30bbfcd2-5415-4755-9dc9-4388af627c91 (created 2026-02-18T13:14:46.029266+00:00, mode: diagnostic)
--   DELETE: 9d83e9ce-4155-4ad4-a451-34acfab9404f (created 2026-02-18T13:14:53.138049+00:00, mode: diagnostic)
--   DELETE: 2505b1e2-2d19-4291-bc10-9a3375875a86 (created 2026-02-18T14:03:31.138817+00:00, mode: practice_2)
--   DELETE: 2267f223-ba21-452e-af80-cf038a225bf2 (created 2026-02-18T14:03:37.573761+00:00, mode: practice_2)
--   DELETE: 6241e804-7529-44f0-936b-48784845f2e9 (created 2026-02-18T14:03:45.346295+00:00, mode: practice_2)

-- Duplicate Set #11: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to TRANQUIL?...
--   KEEP: 379e73c7-934a-4f2d-a9a3-60bc0ecaebf3 (created 2026-02-18T10:43:10.046072+00:00, mode: practice_2)
--   DELETE: bebbc4eb-ea27-4a19-9ad1-fcf8f7421618 (created 2026-02-18T12:59:38.47481+00:00, mode: diagnostic)

-- Duplicate Set #12: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to BRAVE?...
--   KEEP: bda47402-abb1-4c43-8fac-9a2f3a7c95ea (created 2026-02-18T10:43:17.521331+00:00, mode: practice_2)
--   DELETE: 206d022c-5ccd-4c45-8a26-3953bf9b59c9 (created 2026-02-18T12:38:14.695431+00:00, mode: practice_5)

-- Duplicate Set #13: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is opposite to MUNDANE?...
--   KEEP: 578c6d48-089d-4a67-87c6-0144f8dc6ed2 (created 2026-02-18T10:43:25.774212+00:00, mode: practice_2)
--   DELETE: 9d50ebb2-534e-44aa-be98-616cc4842f95 (created 2026-02-18T12:37:46.686109+00:00, mode: practice_5)

-- Duplicate Set #14: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is opposite to RIGID?...
--   KEEP: 23780215-f185-490b-87f8-0748ab74b966 (created 2026-02-18T10:43:33.752399+00:00, mode: practice_2)
--   DELETE: 0a4a2143-b4f7-4291-b512-e11072a274da (created 2026-02-18T12:37:53.941129+00:00, mode: practice_5)

-- Duplicate Set #15: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to GLEEFUL?...
--   KEEP: ea3c4889-2411-48a2-85b8-bd3ca6436440 (created 2026-02-18T10:43:40.15051+00:00, mode: practice_2)
--   DELETE: a959dc1a-832c-4199-a686-e0d4752f7a58 (created 2026-02-18T12:38:00.539971+00:00, mode: practice_5)

-- Duplicate Set #16: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is opposite to VOLATILE?...
--   KEEP: 2dcea75e-3424-427d-9945-56b7241eb233 (created 2026-02-18T10:43:49.297085+00:00, mode: practice_2)
--   DELETE: 00cda6c5-5181-48b7-846b-370e865287ac (created 2026-02-18T12:59:23.133945+00:00, mode: diagnostic)

-- Duplicate Set #17: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to FRAGILE?...
--   KEEP: c5543b33-7fdc-4bc9-acce-96abecf5bb57 (created 2026-02-18T10:43:56.059956+00:00, mode: practice_2)
--   DELETE: 6e159cd2-e974-4d4b-bf5c-b84d10fa75ae (created 2026-02-18T13:00:09.63363+00:00, mode: diagnostic)

-- Duplicate Set #18: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: ARCHAEOLOGIST is to EXCAVATE as DETECTIVE is to:...
--   KEEP: db85fe2b-e7b1-4682-a81a-10a0273aa97f (created 2026-02-18T10:44:49.292326+00:00, mode: practice_2)
--   DELETE: fe4b6c38-cd04-4d26-b170-25b602c27d39 (created 2026-02-18T12:38:53.798987+00:00, mode: practice_5)

-- Duplicate Set #19: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: OVEN is to BAKE as FREEZER is to:...
--   KEEP: f8513784-8455-43da-867f-97246133496f (created 2026-02-18T10:45:07.615536+00:00, mode: practice_2)
--   DELETE: dff16573-15d6-4fd7-a2ca-9b2263292962 (created 2026-02-18T12:39:33.633915+00:00, mode: practice_5)

-- Duplicate Set #20: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: SADDLE is to HORSE as COLLAR is to:...
--   KEEP: bd537ef2-121e-4da3-96f5-61aeacc7561e (created 2026-02-18T10:45:15.650524+00:00, mode: practice_2)
--   DELETE: f01a5967-9cd4-464d-80a9-a975b0820c1d (created 2026-02-18T12:39:41.216724+00:00, mode: practice_5)

-- Duplicate Set #21: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Word Manipulation & Rearrangement
--   Question: Look closely at the following word: KITCHEN. A single word of seven letters can ...
--   KEEP: 9783a25c-6b2d-42a6-b643-97c85f132960 (created 2026-02-18T10:49:49.909606+00:00, mode: practice_2)
--   DELETE: 5382a41c-a5ce-4786-ad90-dc441d724e77 (created 2026-02-18T12:44:43.087207+00:00, mode: practice_5)

-- Duplicate Set #22: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Word Manipulation & Rearrangement
--   Question: Look closely at the following word: ORCHESTRA. A single word of nine letters can...
--   KEEP: 9f698957-da93-4eb4-ba7c-369642e74b66 (created 2026-02-18T10:50:33.291009+00:00, mode: practice_2)
--   DELETE: 421a09b5-1dc7-4cfa-b7c5-55420b30d1c1 (created 2026-02-18T12:45:00.250258+00:00, mode: practice_5)

-- Duplicate Set #23: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Vocabulary & Semantic Knowledge
--   Question: Which of the following words is similar to ANCIENT?...
--   KEEP: f6585e6b-e319-43f8-9074-8734ac401de6 (created 2026-02-18T12:05:52.333305+00:00, mode: practice_3)
--   DELETE: 31527b72-6ce9-4c01-9ba0-0728f80b31ea (created 2026-02-18T13:00:03.23474+00:00, mode: diagnostic)

-- Duplicate Set #24: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Word Manipulation & Rearrangement
--   Question: Look closely at the following word: STREAMING. A single word of nine letters can...
--   KEEP: b5a444df-88e6-4479-b5a1-f8993172e240 (created 2026-02-18T12:14:32.153432+00:00, mode: practice_3)
--   DELETE: e1034df0-4f26-467d-a7e9-2d959e0db4ee (created 2026-02-18T13:06:14.245949+00:00, mode: diagnostic)

-- Duplicate Set #25: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Word Manipulation & Rearrangement
--   Question: Look closely at the following word: TEACHER. A single word of seven letters can ...
--   KEEP: f5bf0c4c-f013-43e2-be36-e2871ee8a2e2 (created 2026-02-18T12:16:38.719052+00:00, mode: practice_3)
--   DELETE: 1c91ae96-6810-4149-be6e-28089c7f08cf (created 2026-02-18T13:59:19.301938+00:00, mode: practice_1)

-- Duplicate Set #26: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogical Reasoning & Relationships
--   Question: REHEARSE is to PERFORMANCE as PRACTICE is to:...
--   KEEP: d59dbf6c-4d16-4a1a-865f-927414afc346 (created 2026-02-18T12:23:44.45411+00:00, mode: practice_4)
--   DELETE: af607fdb-6556-4e06-b8db-6d1d827b2762 (created 2026-02-18T13:01:27.321413+00:00, mode: diagnostic)

-- Duplicate Set #27: EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Word Manipulation & Rearrangement
--   Question: Look closely at the following word: CARTHORSE. A single word of nine letters can...
--   KEEP: 7abdde49-3028-439a-ab78-9b85b6f6a636 (created 2026-02-18T12:28:42.421594+00:00, mode: practice_4)
--   DELETE: 9af1be29-149b-4060-ac85-5ac49984378a (created 2026-02-18T13:59:28.525646+00:00, mode: practice_1)

-- Duplicate Set #28: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 2, 5, 11, 23, 47, ?...
--   KEEP: a8ba6408-0793-420d-9c3c-658fb57453ea (created 2026-02-18T13:55:35.272986+00:00, mode: practice_1)
--   DELETE: 8ffa8b28-c2a2-45c6-8070-61399e4f4d3f (created 2026-02-18T15:05:31.714844+00:00, mode: practice_4)

-- Duplicate Set #29: EduTest Scholarship (Year 7 Entry) - Mathematics - Fractions & Mixed Numbers
--   Question: Convert the improper fraction 47/8 to a mixed number....
--   KEEP: 72eae536-d76f-4386-9e28-42ee9afc40fa (created 2026-02-18T13:55:41.222425+00:00, mode: practice_1)
--   DELETE: 3173bce7-0c36-4b19-9b41-2b238d67e381 (created 2026-02-18T14:26:28.237183+00:00, mode: practice_3)

-- Duplicate Set #30: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 1, 8, 27, 64, 125, ?...
--   KEEP: 21838d02-dd4d-4512-9f83-406f2a35629c (created 2026-02-18T13:55:43.564191+00:00, mode: practice_1)
--   DELETE: e5ddffac-05ad-4fe0-af99-b73d523d3fc6 (created 2026-02-18T14:24:48.615046+00:00, mode: practice_3)
--   DELETE: 878d1bf8-9d47-4295-aaa8-ca91d87ed7f9 (created 2026-02-18T15:23:00.598419+00:00, mode: practice_5)

-- Duplicate Set #31: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 2, 6, 18, 54, 162, ?...
--   KEEP: b3f618ef-3268-4cc0-90bd-233da17b6af5 (created 2026-02-18T13:55:50.247319+00:00, mode: practice_1)
--   DELETE: 55c97ad9-f3a7-45a3-9b1e-e89f85c38511 (created 2026-02-18T14:25:41.455123+00:00, mode: practice_3)

-- Duplicate Set #32: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 3, 12, 60, 360, 2520, ?...
--   KEEP: 867d6d6c-e9de-40df-b411-a308adc8971b (created 2026-02-18T13:55:57.70936+00:00, mode: practice_1)
--   DELETE: 209a9fc3-949b-4e12-9131-8fdc406a827f (created 2026-02-18T14:25:05.368291+00:00, mode: practice_3)

-- Duplicate Set #33: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 1, 3, 4, 7, 11, 18, ?...
--   KEEP: 0e471e7c-5ff8-480e-bcbc-1c067f4d2cda (created 2026-02-18T13:56:53.563721+00:00, mode: practice_1)
--   DELETE: 6f4eec64-3aa4-457c-92ec-18c76bc30a03 (created 2026-02-18T14:25:32.965662+00:00, mode: practice_3)

-- Duplicate Set #34: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 1, 2, 6, 24, 120, ?...
--   KEEP: e6db7c53-ff76-412d-b360-9de1df02ba72 (created 2026-02-18T13:57:18.541914+00:00, mode: practice_1)
--   DELETE: 01732187-edf6-47b0-967a-13dfee707ddb (created 2026-02-18T14:25:48.620113+00:00, mode: practice_3)
--   DELETE: 6986c56a-38be-4a98-9e59-e9f5187d304c (created 2026-02-18T15:24:26.317028+00:00, mode: practice_5)

-- Duplicate Set #35: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Matrices & Grid Patterns
--   Question: A museum curator organizes ancient coins into display cases. Study the pattern i...
--   KEEP: 67876501-bdce-4012-b2e3-c9b6b41cb866 (created 2026-02-18T14:04:35.009916+00:00, mode: practice_1)
--   DELETE: aca1cec1-fc6f-4d80-8180-6b83a31cf9a5 (created 2026-02-18T14:32:26.793786+00:00, mode: practice_3)

-- Duplicate Set #36: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Matrices & Grid Patterns
--   Question: A photographer organizes photos into albums. Study the pattern in the grid below...
--   KEEP: 701de880-4057-4bf7-9094-f979bb983097 (created 2026-02-18T14:06:39.53951+00:00, mode: practice_1)
--   DELETE: d43cf918-ddd4-4333-a9b0-1528cf1aaca8 (created 2026-02-18T14:33:45.924464+00:00, mode: practice_3)

-- Duplicate Set #37: EduTest Scholarship (Year 7 Entry) - Mathematics - Applied Word Problems
--   Question: A concert starts at 7:30 PM and lasts for 1 hour and 45 minutes. If it takes 25 ...
--   KEEP: 347979cc-8132-4b58-85a0-cafbee107436 (created 2026-02-18T14:08:17.744182+00:00, mode: practice_1)
--   DELETE: 35cae2e4-c640-4faa-8e35-bcab02e010af (created 2026-02-18T15:08:03.444712+00:00, mode: practice_3)

-- Duplicate Set #38: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 5, 8, 14, 26, 50, ?...
--   KEEP: 4bf604ec-63b5-4179-8ec4-e751ccb10d7b (created 2026-02-18T14:09:52.827473+00:00, mode: practice_2)
--   DELETE: b0daecfa-d999-446c-abb9-a500d8c73367 (created 2026-02-18T15:04:51.023656+00:00, mode: practice_4)

-- Duplicate Set #39: EduTest Scholarship (Year 7 Entry) - Mathematics - Fractions & Mixed Numbers
--   Question: A photographer printed 3/5 of her photos in colour and 1/4 of her photos in blac...
--   KEEP: bccc34d0-c0fd-4816-a2fb-4520b608f58f (created 2026-02-18T14:10:04.085732+00:00, mode: practice_2)
--   DELETE: a1c98023-e797-430b-a445-f8ddbe3f84ad (created 2026-02-18T15:10:13.726636+00:00, mode: practice_4)

-- Duplicate Set #40: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 3, 5, 9, 17, 33, 65, ?...
--   KEEP: 9537f2e5-c855-4312-9a3e-2333b44efdda (created 2026-02-18T14:10:08.022305+00:00, mode: practice_2)
--   DELETE: a07df680-2c81-4bbe-abdd-1d7006fea391 (created 2026-02-18T15:05:08.2868+00:00, mode: practice_4)

-- Duplicate Set #41: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 4, 7, 13, 25, 49, ?...
--   KEEP: 39850599-335a-4e27-b948-0db6edf85000 (created 2026-02-18T14:11:41.467023+00:00, mode: practice_2)
--   DELETE: 4008cf46-d58f-4ff5-9002-08ea5c03c92a (created 2026-02-18T15:05:48.100132+00:00, mode: practice_4)

-- Duplicate Set #42: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 2, 5, 10, 17, 26, 37, ?...
--   KEEP: 73df58eb-af2e-45d6-b99b-75d3868ee07f (created 2026-02-18T14:12:04.925058+00:00, mode: practice_2)
--   DELETE: 842c9243-cbb0-43bf-8a5c-1f3bb1a68d7f (created 2026-02-18T15:23:54.735791+00:00, mode: practice_5)

-- Duplicate Set #43: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Properties & Operations
--   Question: What is the value of 5³ ÷ 5?...
--   KEEP: be1fde88-39c5-4f69-83d4-6c193ddb0e22 (created 2026-02-18T14:22:36.928509+00:00, mode: practice_2)
--   DELETE: 7a82c939-1af8-4d9e-9d6c-8a6c3b05e2dc (created 2026-02-18T15:04:03.020475+00:00, mode: practice_3)

-- Duplicate Set #44: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Properties & Operations
--   Question: What is the greatest common factor (GCF) of 24 and 36?...
--   KEEP: cc046bf5-103e-4ae8-976e-2c486fbb0b09 (created 2026-02-18T14:24:02.041473+00:00, mode: practice_2)
--   DELETE: 54d99dee-c8b0-4824-8c22-7331fe487f48 (created 2026-02-18T15:19:23.577154+00:00, mode: practice_4)

-- Duplicate Set #45: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 7, 14, 21, 28, 35, ?...
--   KEEP: d9bb486b-5326-4984-928a-2c91d929a57b (created 2026-02-18T14:24:16.250541+00:00, mode: practice_3)
--   DELETE: bb431ea5-7ea0-4380-b26e-8e5cae147970 (created 2026-02-18T15:22:20.009385+00:00, mode: practice_5)

-- Duplicate Set #46: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Series & Pattern Recognition
--   Question: What is the next number in the sequence? 1, 3, 7, 15, 31, 63, ?...
--   KEEP: b79e4d2e-7b29-467e-a768-c5c96e34351a (created 2026-02-18T14:25:25.091079+00:00, mode: practice_3)
--   DELETE: 946d7b30-430c-4f18-bed3-693af4b0eb5a (created 2026-02-18T15:24:03.322866+00:00, mode: practice_5)

-- Duplicate Set #47: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Figurative Language & Idioms
--   Question: What does the following saying mean?  "Don't put all your eggs in one basket."...
--   KEEP: db142608-7ec6-440a-8297-f66757129f3c (created 2026-02-18T14:34:40.087688+00:00, mode: practice_1)
--   DELETE: aa4360cd-c121-460b-a3aa-99c5371ec15c (created 2026-02-18T15:08:54.864077+00:00, mode: practice_2)
--   DELETE: ea1b3ca3-4ff5-4480-b5b0-866698807f5d (created 2026-02-18T15:23:16.712762+00:00, mode: practice_3)

-- Duplicate Set #48: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Figurative Language & Idioms
--   Question: What does the following saying mean?  "Every cloud has a silver lining."...
--   KEEP: 50c6aa00-c492-40ae-a610-b3627b599adf (created 2026-02-18T14:34:50.858306+00:00, mode: practice_1)
--   DELETE: 6890eea5-9a13-4973-b71d-fe49bff1d16e (created 2026-02-18T15:09:04.390009+00:00, mode: practice_2)

-- Duplicate Set #49: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Figurative Language & Idioms
--   Question: What does the following saying mean?  "You can't judge a book by its cover."...
--   KEEP: 12aa5718-b1f2-483b-ba2c-09cf8cf4ad71 (created 2026-02-18T14:35:12.42608+00:00, mode: practice_1)
--   DELETE: 4bf698f0-3b42-4af3-9ed3-b2f406e264e6 (created 2026-02-18T15:09:24.053233+00:00, mode: practice_2)
--   DELETE: 22cedd3a-57d8-45d7-b746-613a6b32012e (created 2026-02-18T15:23:46.054358+00:00, mode: practice_3)

-- Duplicate Set #50: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Figurative Language & Idioms
--   Question: What does the following saying mean?  "Actions speak louder than words."...
--   KEEP: 7833bb45-5e3e-4afc-aaf4-953962265bc9 (created 2026-02-18T14:35:33.045123+00:00, mode: practice_1)
--   DELETE: d061b1f8-e0a3-45c4-8866-d574df75aa9e (created 2026-02-18T15:09:53.488899+00:00, mode: practice_2)
--   DELETE: 391ca648-5a6a-43a3-82f0-d65aad52fee7 (created 2026-02-18T15:23:34.649693+00:00, mode: practice_3)

-- Duplicate Set #51: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Figurative Language & Idioms
--   Question: What does the following expression mean?  "Bite off more than you can chew."...
--   KEEP: 9ebe8434-9419-4669-b3bc-b649a79fe54f (created 2026-02-18T14:35:51.885117+00:00, mode: practice_1)
--   DELETE: 839ac181-9e6a-4c3a-a9d7-350cf19bfd3d (created 2026-02-18T15:09:33.067697+00:00, mode: practice_2)

-- Duplicate Set #52: EduTest Scholarship (Year 7 Entry) - Numerical Reasoning - Number Properties & Operations
--   Question: What is 3/5 as a decimal?...
--   KEEP: bc0c9459-4065-41b3-8287-bc8376273d7f (created 2026-02-18T15:03:34.441669+00:00, mode: practice_3)
--   DELETE: bb7bf1c3-6fda-4ebe-9137-ecb633b9c14e (created 2026-02-18T15:33:00.841836+00:00, mode: practice_5)

-- Duplicate Set #53: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Punctuation & Capitalization
--   Question: Choose the correctly re-written sentence:  "im going to the library after school...
--   KEEP: 2aa80457-fde5-40bf-a263-9f0f4b7e1d3b (created 2026-02-18T15:05:44.386622+00:00, mode: practice_2)
--   DELETE: 5e1961a2-4a71-44ae-8cc8-c75ecb917da6 (created 2026-02-18T15:15:15.155606+00:00, mode: practice_3)

-- Duplicate Set #54: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Punctuation & Capitalization
--   Question: Choose the correctly re-written sentence:  "where is my soccer ball asked tom"...
--   KEEP: f4fd9e39-9578-4aa4-b8f8-b7b9ccea373d (created 2026-02-18T15:15:03.296616+00:00, mode: practice_3)
--   DELETE: 2eb54ff1-3dad-4829-bab0-d17b3b86028b (created 2026-02-18T15:31:44.394392+00:00, mode: practice_4)

-- Duplicate Set #55: EduTest Scholarship (Year 7 Entry) - Reading Comprehension - Punctuation & Capitalization
--   Question: Choose the correctly re-written sentence:  "lets go to the beach tomorrow sugges...
--   KEEP: c642be69-6b73-40dc-807d-4aed3a5e1a4b (created 2026-02-18T15:15:24.868845+00:00, mode: practice_3)
--   DELETE: a19a608d-0278-4868-b50e-99b7d3a557a8 (created 2026-02-18T15:32:02.139652+00:00, mode: practice_4)

-- Delete all duplicates in one statement
DELETE FROM questions_v2 WHERE id IN (
  '53a88f99-a8aa-439b-9622-41ed39ef3ad8',
  '54c7e14c-2a77-40b3-9694-11b0985043d7',
  '23ac751a-596b-41fd-9401-a8719913de5b',
  'ced7ba1f-815f-466f-a47d-80a85db8ca33',
  '700e60dd-cf87-4d60-9c8d-fe9487b0808a',
  '5b3a8acf-a613-430a-ac9f-8f05a2ae6a03',
  '077f9802-07ac-4e51-b3cd-596923b4c0ec',
  'f8c1e0ee-a99a-4b08-b04a-10d714dbd706',
  '96a245f0-b003-4091-99e7-2c1ccf0b924f',
  'be30026e-943f-46ca-90f3-8b5ea35b0a50',
  '6119b1a8-6479-4592-b574-072ef5a5ab74',
  '0638c0bb-8d72-4199-9d21-a08c5065b20c',
  'd615c9dc-663e-4f24-b391-c081f9f6654c',
  '32a2101e-78c6-449c-8afe-ee11143f5a55',
  'e36c7647-294b-40b4-af2a-ebbee1978d56',
  '9a54d704-8c56-4ff0-93b7-ec98d458cddb',
  '5419c9b2-a270-4634-b8b5-e20830de99ae',
  '966aa6f0-a0fa-458c-8d00-46cf358576d4',
  'c7f42d41-ddad-4168-b887-2786e53f070c',
  '0de61979-64c5-410e-82fa-cdc5dd9b7dc4',
  'cb8477e0-6934-4bd8-adc7-1bac2bd8a3d4',
  '37c39735-2fa1-4ce8-957a-ac3fbcbcdd06',
  '4ea7e33b-fdb0-4073-8a87-3d8b1a59d1ee',
  '9bdd1641-4191-430a-996e-98225557c7eb',
  '1541085c-5b7a-415b-9bce-5f3c5ac00665',
  '4e361140-2a60-4147-9fcc-72855c4adbcc',
  'a2d79308-d4a9-4b6b-9ccc-89023f642bf2',
  '7269b826-0d37-4b4e-a3c8-84924d6e5bf1',
  '6a1d2250-e6b6-4de6-8ed3-86d619de4777',
  'd190c5b2-e6f7-48fe-9b21-27999b6d57b5',
  '68fadc6a-9ba2-4719-85c8-d602ecb004bf',
  '15a9c958-1e63-4da3-acaf-20fb91fe1783',
  'c0eef9bb-566d-4527-b5dc-888c8495bce7',
  '0f736625-c130-479d-afc4-f2e3bee57df2',
  '2f4c189a-c235-42f6-b154-a83eb5f39606',
  'a3bd7bd0-ede8-49dc-85ac-2770097bd927',
  '6327e7d2-7e09-4f0e-a6cc-7341a10209c3',
  '8969359e-d9c7-4519-adc4-e40e925cf417',
  '9a71258a-1c49-4f24-9a43-1597b8aff081',
  '62086bd0-ebda-492a-9e3d-f171c049467f',
  '4dc34725-7346-4d9c-ad9c-d8904480414c',
  'c9279ec1-dea5-458a-9780-fe208de3e865',
  '3158f6a4-ff56-4cdc-9ade-8aa1c67e9330',
  '5d946b28-9e54-49be-8b80-252737fd4f91',
  '5a176d08-0491-4867-b6fb-9d67671f2952',
  '66005e52-19e9-4317-8983-fe3c00e6126c',
  '30bbfcd2-5415-4755-9dc9-4388af627c91',
  '9d83e9ce-4155-4ad4-a451-34acfab9404f',
  '2505b1e2-2d19-4291-bc10-9a3375875a86',
  '2267f223-ba21-452e-af80-cf038a225bf2',
  '6241e804-7529-44f0-936b-48784845f2e9',
  'bebbc4eb-ea27-4a19-9ad1-fcf8f7421618',
  '206d022c-5ccd-4c45-8a26-3953bf9b59c9',
  '9d50ebb2-534e-44aa-be98-616cc4842f95',
  '0a4a2143-b4f7-4291-b512-e11072a274da',
  'a959dc1a-832c-4199-a686-e0d4752f7a58',
  '00cda6c5-5181-48b7-846b-370e865287ac',
  '6e159cd2-e974-4d4b-bf5c-b84d10fa75ae',
  'fe4b6c38-cd04-4d26-b170-25b602c27d39',
  'dff16573-15d6-4fd7-a2ca-9b2263292962',
  'f01a5967-9cd4-464d-80a9-a975b0820c1d',
  '5382a41c-a5ce-4786-ad90-dc441d724e77',
  '421a09b5-1dc7-4cfa-b7c5-55420b30d1c1',
  '31527b72-6ce9-4c01-9ba0-0728f80b31ea',
  'e1034df0-4f26-467d-a7e9-2d959e0db4ee',
  '1c91ae96-6810-4149-be6e-28089c7f08cf',
  'af607fdb-6556-4e06-b8db-6d1d827b2762',
  '9af1be29-149b-4060-ac85-5ac49984378a',
  '8ffa8b28-c2a2-45c6-8070-61399e4f4d3f',
  '3173bce7-0c36-4b19-9b41-2b238d67e381',
  'e5ddffac-05ad-4fe0-af99-b73d523d3fc6',
  '878d1bf8-9d47-4295-aaa8-ca91d87ed7f9',
  '55c97ad9-f3a7-45a3-9b1e-e89f85c38511',
  '209a9fc3-949b-4e12-9131-8fdc406a827f',
  '6f4eec64-3aa4-457c-92ec-18c76bc30a03',
  '01732187-edf6-47b0-967a-13dfee707ddb',
  '6986c56a-38be-4a98-9e59-e9f5187d304c',
  'aca1cec1-fc6f-4d80-8180-6b83a31cf9a5',
  'd43cf918-ddd4-4333-a9b0-1528cf1aaca8',
  '35cae2e4-c640-4faa-8e35-bcab02e010af',
  'b0daecfa-d999-446c-abb9-a500d8c73367',
  'a1c98023-e797-430b-a445-f8ddbe3f84ad',
  'a07df680-2c81-4bbe-abdd-1d7006fea391',
  '4008cf46-d58f-4ff5-9002-08ea5c03c92a',
  '842c9243-cbb0-43bf-8a5c-1f3bb1a68d7f',
  '7a82c939-1af8-4d9e-9d6c-8a6c3b05e2dc',
  '54d99dee-c8b0-4824-8c22-7331fe487f48',
  'bb431ea5-7ea0-4380-b26e-8e5cae147970',
  '946d7b30-430c-4f18-bed3-693af4b0eb5a',
  'aa4360cd-c121-460b-a3aa-99c5371ec15c',
  'ea1b3ca3-4ff5-4480-b5b0-866698807f5d',
  '6890eea5-9a13-4973-b71d-fe49bff1d16e',
  '4bf698f0-3b42-4af3-9ed3-b2f406e264e6',
  '22cedd3a-57d8-45d7-b746-613a6b32012e',
  'd061b1f8-e0a3-45c4-8866-d574df75aa9e',
  '391ca648-5a6a-43a3-82f0-d65aad52fee7',
  '839ac181-9e6a-4c3a-a9d7-350cf19bfd3d',
  'bb7bf1c3-6fda-4ebe-9137-ecb633b9c14e',
  '5e1961a2-4a71-44ae-8cc8-c75ecb917da6',
  '2eb54ff1-3dad-4829-bab0-d17b3b86028b',
  'a19a608d-0278-4868-b50e-99b7d3a557a8'
);

COMMIT;

-- Expected result: DELETE 101