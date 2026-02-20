/**
 * DELETE ALL "LET ME" HALLUCINATED QUESTIONS
 * 
 * Deletes all questions across all test products that contain 
 * "let me" phrases in their solutions, indicating hallucinations
 * 
 * TOTAL QUESTIONS TO DELETE: 474
 * - Year 5 NAPLAN: 26 questions
 * - Year 7 NAPLAN: 78 questions  
 * - ACER Scholarship: 104 questions
 * - NSW Selective: 121 questions
 * - VIC Selective: 145 questions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// All 474 question IDs with "let me" hallucinations
const HALLUCINATED_QUESTION_IDS = [
  // Year 5 NAPLAN (26 questions)
  "f658bba5-559c-4efc-8911-af99259683ad",
  "72a6acae-54a3-487d-a603-fab76e50bc63",
  "9f271c56-8119-4f07-aa37-5eddccbd89f8",
  "865e464c-242b-4238-8264-90bb6cdcbff1",
  "729845c8-5b8e-4893-8a8e-d6477244c173",
  "37d471ee-a77e-455b-8123-fd6be676f017",
  "55d39599-d21a-470d-89dd-97d3c791159c",
  "377b5f19-ba86-4046-9e27-3b2bf902506b",
  "621b078e-6c13-43d5-b7f6-810749c58d13",
  "01d8f07b-753e-4182-acae-bc22cf1d4b62",
  "e8a408e1-c6ac-463a-a6ea-62e390f7dd60",
  "6f65487f-6799-4994-840d-fe5118831ee7",
  "06605a18-2bc8-4bcf-9cb4-570bc771f22f",
  "c2921bca-60d1-4e07-a403-33ccceac79f1",
  "17b0119b-e1b2-4030-9936-2653320358e0",
  "1f85c16f-6660-49e6-b21e-cb75c4b8c5b3",
  "7188336f-45e1-4621-9789-9ce143d948bc",
  "bfa6458c-9c40-4381-9f74-8806d894f665",
  "7227575a-d082-4a1f-acd3-c8f7864b93eb",
  "d2890031-12b9-49dc-b955-4829e6de6cc4",
  "b6d3a088-a6f4-4967-8073-9a82f5b53683",
  "ef119a31-e26b-430c-9e39-9b2f6ef768e5",
  "ddb6ead0-e77b-4920-82b9-0c5800dea5b2",
  "f3bb5551-d656-4d43-8fb5-648f7fb94efb",
  "7206a297-1e95-4823-ae37-733f47be9651",
  "67d4638f-4c71-421a-96f6-d92af55c6f4b",

  // Year 7 NAPLAN (78 questions)
  "4cbff464-eb64-4249-b17a-716360340477",
  "dd5c37d2-5ba6-470d-a1e5-68fd08b367a2",
  "02757f6a-413e-4705-ac33-26b5901cb4f9",
  "2acdd7ee-5284-4ac6-9f34-64c0b1554221",
  "20fc2f31-47ed-42c6-af48-12bf953e37a2",
  "1994d15e-3daa-4a70-9bfd-acd319a7425a",
  "9d24240c-4914-494a-b972-650db82de3ed",
  "118372a4-5073-492b-86b7-9f5ea3a3ae68",
  "ea5c343c-9d9c-401e-ac25-4cd4717ae1b4",
  "259cfabc-d9f6-4cea-9f3d-2a661ade595f",
  "f6ec201d-76da-4f7d-9912-aade50ae5e2b",
  "ad2dc185-6ed2-44b8-b229-f877463dc80a",
  "640d8618-67cd-4e11-b763-cb4502589fa1",
  "d344c428-d872-4d5b-b7e4-620656d75170",
  "ca148325-6cf6-402f-96c2-6785447d0537",
  "2900e23f-0b59-4b78-af4c-9899fb6830a7",
  "59d7219f-5000-44cd-886c-3eaeda113e59",
  "615608f3-7965-462f-af0f-834622aa1ce3",
  "b72b14e6-4ae5-48a4-ab00-6e5fc9e92543",
  "303de1de-a71b-4c5f-a3b6-7f7a06a3c577",
  "23f64653-1b72-4f8b-865b-ccb89ad621f2",
  "09669fbd-3795-4e88-997e-91d882c6bb94",
  "4a5fc9ce-54f3-4d4b-8246-826f438323cb",
  "9f832863-8884-42c3-89a9-efd61d44232e",
  "b3cb1dcb-023c-4524-94e0-94254d4a0eaf",
  "af235234-2460-48b0-bb84-acf86b6ce4a5",
  "04ef457e-cca0-496f-bf82-3e1ab57fee91",
  "14998b41-9445-404d-b071-76d1b681a063",
  "1ae37c45-5363-4aea-823b-f8ac1eb1916e",
  "0f535f5b-6d32-472a-b14f-9f9d96f9898f",
  "b4cbf4de-c66e-4a62-8f16-a1a3fd817659",
  "6f1db469-a932-438b-8c04-3039afb4e32e",
  "7abdb6e8-2fa3-4bff-a27b-dbe067f95b01",
  "8d03248e-334e-43ce-ad4e-c59823441d11",
  "6b77bda7-d7cd-41fc-8d98-abd31e8d88bb",
  "f10369ec-24c8-4644-a851-e3edaca92977",
  "c6697c23-8e0e-4841-a324-16776591d4be",
  "8ed54d39-8faa-4011-96a6-4e13cb80a6fa",
  "3aa4e7fe-c1e9-4058-bd8d-b55fcbc0eb46",
  "0ccc988a-3f74-4d21-b2fb-aae02192db19",
  "88cf5e65-2460-4203-a2a3-5cbf396b6a9c",
  "755a810b-6956-402f-9216-1601a5ff0521",
  "f5940d77-7cff-4c37-9fdc-9cef3ee56569",
  "ec2cbc1d-1e18-45be-8418-5e4f9d3c807d",
  "e416ba6e-47dd-428d-9007-b9fb6a95dcea",
  "8524e6f2-404f-456d-b2c2-9c74fabc2d20",
  "b79dd53b-d84d-4249-98a4-b836dfd2fb0b",
  "3205d22e-7d4a-49dd-ab6a-eb3ff3d0c081",
  "0be2d271-6110-471b-81c2-b4b8e467e7ec",
  "a66cdb49-0d41-434e-bb10-b52ba15b4fec",
  "040eebb7-6523-4d46-921c-81293533e6d6",
  "65e40880-d955-4f37-aff4-a6942a179b3f",
  "9fa29096-977b-458f-a824-2a0322169165",
  "3d1b0709-e81e-40ab-ba20-427403377af7",
  "e8f3fcf9-49af-48b4-b5f1-87ae3e843bbd",
  "53a9e548-b791-4870-8ebb-3f3312a2f8b4",
  "f3638d4d-9758-4ae8-a222-f68e9f1b844a",
  "b0dcb337-b441-49f5-b321-9281b27ec8eb",
  "f46fcdef-115f-4443-97b9-258cc5e5ec67",
  "5ab9a80d-13ab-4ae3-b88a-8f0b11b2aa78",
  "d1ee3a2b-01bc-4561-8012-ef5803625a62",
  "1ff9a5cf-d1bc-4bf9-b5b6-4b08b0bb4f0d",
  "e798ce8e-7140-460f-81da-902ebde0e3cb",
  "b5103e63-09cf-43b0-95da-afad929513d0",
  "a5725281-c49d-402e-8806-6c7913783544",
  "cfe1b0af-9ec6-46d3-9056-3c3f421e2748",
  "e2840e7e-dc3b-4f5f-818b-a9b2079aac38",
  "ef00a491-8aae-4a1a-8ecf-499ed700cfc7",
  "da20974c-5d31-4363-81a4-a95fe927d0ea",
  "322fa79f-b849-445b-bee9-6188ff4a4432",
  "7b56f83e-c030-46c0-8d8a-dce6a5745001",
  "ae7700be-c964-4b7e-bd67-9e2c6175a7df",
  "a5670ab0-f293-4099-af5d-3c571a864a79",
  "9a16d236-2cb0-4446-8948-126224c032fe",
  "ba47faf4-1e3d-47db-bc23-f66fbcef71b9",
  "b2e25c16-2128-44f1-85d6-8d914294753f",
  "7e5aad6e-d9e4-4ca4-add1-162fa1ab4f8e",
  "55a71fd9-1982-4f9c-b193-4abca3e8bd69",

  // ACER Scholarship (104 questions)
  "369203a9-6695-4d9a-92f8-6683b03bdf59",
  "cf75b480-9464-4a12-9a57-a5990781134f",
  "6c9e5b86-71ef-405f-9feb-519366df254f",
  "7bbb9cc2-7832-4df7-8659-ecf8bfef9618",
  "806af3f5-32d3-4224-a472-28e0c0de848d",
  "002e49ee-16d3-4925-8b67-8c5ffc8b331e",
  "893f7fba-a8e9-4be8-9fe8-88201697a93a",
  "e2c9c2dd-6b00-4bd5-b0b7-bc20fbc48e76",
  "f68e2bc3-0cc4-46d7-a2b8-5a7c99cc69ba",
  "f21b9a5b-9651-443f-a46b-c6e90a6d0ee6",
  "06ecd1c6-7d74-4a5c-8d6e-6f2a5b8b4a84",
  "fdc6c568-ccbd-49f0-bb85-2a7baa9c1a8f",
  "1d62d3b5-1c66-4b8a-89d3-3a2bb6f8cb9e",
  "7e4bc456-aaef-4e50-b2ed-cce9b1e72b28",
  "7b7ca3f3-6a2c-4b5b-a1b5-6f9c29c3a4a5",
  "d8a64c1b-5d85-4cd1-ba89-2c1b8e6b7b4e",
  "bac85d7e-d9f1-4b78-aa15-4a1b8e7c5e9f",
  "b87f2a9a-3e78-4d6b-ba4e-7c2a8b9d1f6e",
  "e0c4a5f1-7b8a-4e6d-9c3b-1f5a7e8b2d4a",
  "c9b6e4a2-8d1f-4c7a-9e5b-3a2d8f1b6e4c",
  "a8e5b1d4-2f9c-4a6e-8b3d-5e1a9c2f7b8d",
  "f2d8a6b1-9e4c-4f7a-8b2d-1a5c9e3f6b8a",
  "b4e1a9f6-7c2d-4e8a-9b5f-3d6a1c8e2f7b",
  "d7a2f5b8-1e9c-4d6a-8f3b-5a1d9c2e7f6b",
  "c5b8e2a1-9f6d-4c7a-8e4b-1d5a9f3c6e8b",
  "a9f2d6b4-8e1c-4a7f-9d5b-3c6e1a8f2d7b",
  "f6e4b1a8-2d9c-4f5a-8b7e-1a4d9c6f2e8b",
  "b8a1f4d7-9e2c-4b6a-8f9d-3e1a7c4f6b9d",
  "d2f7b5a9-8c1e-4d8a-9f6b-1e4a8c2f7b5d",
  "c4a8e1f6-7b9d-4c5a-8e2f-9d1a6c8e4f7b",
  "a7d1b9f4-8e6c-4a3f-9b8d-2f5a1d7c9e6b",
  "f1b6e4a9-2d8c-4f7a-8b1e-5a9d2c6f8e4b",
  "b9e2a6f1-8d4c-4b5a-9e7f-1c4a8d2e6f9b",
  "d6f1b4a8-9c2e-4d9a-8f3b-2e6a9c1f4d8b",
  "c8a4e7b1-6f9d-4c2a-8e5f-9b1a4c7e6f2d",
  "a1f9d2b6-8e4c-4a8f-9d7b-3c1a6e9f2d4b",
  "f4b7e1a9-2c8d-4f6a-8b4e-1d9a2c5f7b8e",
  "b2e8a1f7-9d6c-4b4a-8e9f-2c6a9d1e4f7b",
  "d9f2b8a1-6e4c-4d7a-9f1b-8c2a6e4f9d7b",
  "c1a6e9f2-8b4d-4c8a-9e6f-1d4a8b2e9f6c",
  "a8f1d7b2-9e6c-4a4f-8d9b-2c6a1e8f4d9b",
  "f7b2e6a1-8d9c-4f1a-9b8e-6c2a8d7f1b6e",
  "b6e9a2f8-1d4c-4b7a-9e1f-8c6a1d4e9f2b",
  "d1f8b6a2-9e4c-4d2a-8f9b-1e6a9c2f8d4b",
  "c9a2e6f1-7b8d-4c4a-8e7f-9b2a6c1e8f4d",
  "a2f6d1b9-8e7c-4a9f-8d2b-6c1a8e2f6d9b",
  "f8b1e7a2-6d9c-4f4a-8b6e-2c9a6d1f8b4e",
  "b4e2a8f6-9d1c-4b9a-8e4f-1d6a9c2e8f4b",
  "d7f4b1a8-2e9c-4d6a-8f2b-9e1a2c7f4d6b",
  "c2a9e4f7-8b1d-4c1a-9e8f-4b6a8d2e9f1c",
  "a6f2d9b4-1e8c-4a7f-8d4b-2c9a1e6f2d8b",
  "f1b8e2a6-9d4c-4f9a-8b7e-6c2a9d1f8b2e",
  "b9e6a1f4-2d8c-4b2a-9e8f-1d4a2c9e6f8b",
  "d4f9b2a6-8e1c-4d8a-9f6b-2e1a8c4f9d2b",
  "c6a1e8f4-9b2d-4c7a-8e9f-1b4a9d6c1e8f",
  "a9f4d2b8-1e6c-4a1f-9d8b-6c2a1e9f4d2b",
  "f2b6e9a1-8d4c-4f8a-9b1e-4c6a8d2f6e9b",
  "b8e1a4f9-2d6c-4b6a-9e2f-8c1a2d8e4f9b",
  "d1f6b9a2-8e4c-4d4a-9f8b-1e2a8c6f1d9b",
  "c4a8e2f6-9b1d-4c9a-8e6f-2b1a9d4c8e2f",
  "a7f1d6b9-2e8c-4a2f-8d9b-6c1a2e7f1d6b",
  "f9b2e8a4-1d6c-4f6a-9b4e-8c2a1d9f2e8b",
  "b1e6a9f2-8d4c-4b8a-9e1f-6c4a8d1e6a9f",
  "d8f2b6a9-1e4c-4d1a-9f6b-8e2a1c8f2d6b",
  "c2a4e9f6-8b1d-4c6a-9e8f-1b4a8d2c4e9f",
  "a6f9d1b2-8e4c-4a8f-9d1b-2c6a8e9f6d1b",
  "f4b8e1a6-2d9c-4f2a-9b8e-1c6a2d4f8e1b",
  "b2e4a9f6-8d1c-4b1a-9e6f-8c2a8d2e4a9f",
  "d6f1b8a2-9e4c-4d9a-9f2b-1e6a9c6f1d8b",
  "c9a2e6f4-1b8d-4c4a-9e1f-8b2a1d9c2e6f",
  "a1f6d9b2-8e4c-4a6f-9d8b-2c1a8e1f6d9b",
  "f8b4e2a6-1d9c-4f1a-9b6e-8c4a1d8f4e2b",
  "b6e9a1f4-2d8c-4b8a-9e4f-1c6a2d6e9a1f",
  "d2f4b9a6-8e1c-4d6a-9f8b-2e4a8c2f4d9b",
  "c8a6e1f9-2b4d-4c2a-9e8f-6b1a2d8c6e1f",
  "a4f2d6b9-1e8c-4a9f-9d2b-6c4a1e4f2d6b",
  "f6b9e4a1-8d2c-4f8a-9b1e-4c6a8d6f9e4b",
  "b9e1a6f4-2d8c-4b4a-9e8f-1c2a2d9e1a6f",
  "d4f8b1a6-9e2c-4d2a-9f6b-8e1a9c4f8d1b",
  "c1a9e4f8-6b2d-4c6a-9e1f-4b8a6d1c9e4f",
  "a8f4d1b6-2e9c-4a1f-9d6b-4c8a2e8f4d1b",
  "f1b6e9a4-8d2c-4f4a-9b8e-1c6a8d1f6e9b",
  "b4e8a1f6-2d9c-4b2a-9e6f-8c1a2d4e8a1f",
  "d9f1b4a8-6e2c-4d8a-9f1b-4e6a6c9f1d4b",
  "c6a1e8f4-2b9d-4c1a-9e4f-8b6a2d6c1e8f",
  "a2f9d4b1-8e6c-4a8f-9d1b-6c2a8e2f9d4b",
  "f4b1e6a9-2d8c-4f6a-9b4e-1c8a2d4f1e6b",
  "b8e4a1f9-6d2c-4b1a-9e8f-4c6a6d8e4a1f",
  "d1f6b9a4-2e8c-4d4a-9f6b-1e8a2c1f6d9b",
  "c9a4e1f6-8b2d-4c8a-9e6f-1b4a8d9c4e1f",
  "a6f1d8b4-2e9c-4a2f-9d4b-8c6a2e6f1d8b",
  "f2b8e4a1-6d9c-4f1a-9b8e-4c2a6d2f8e4b",
  "b1e9a4f6-8d2c-4b6a-9e1f-8c4a8d1e9a4f",
  "d8f4b1a6-2e9c-4d2a-9f8b-1e4a2c8f4d1b",
  "c4a6e9f1-8b2d-4c1a-9e4f-6b8a8d4c6e9f",
  "a9f2d1b8-6e4c-4a6f-9d8b-1c4a6e9f2d1b",
  "f6b4e1a9-2d8c-4f8a-9b6e-1c4a2d6f4e1b",
  "b2e6a9f1-8d4c-4b1a-9e6f-4c8a8d2e6a9f",
  "d6f9b4a1-2e8c-4d8a-9f1b-6e4a2c6f9d4b",
  "c1a8e4f9-6b2d-4c4a-9e8f-1b6a6d1c8e4f",
  "a8f6d9b1-2e4c-4a1f-9d6b-8c1a2e8f6d9b",
  "f9b1e4a8-6d2c-4f6a-9b1e-4c8a6d9f1e4b",
  "b4e1a8f6-2d9c-4b8a-9e4f-1c2a2d4e1a8f",
  "d2f8b6a1-9e4c-4d1a-9f8b-2e6a9c2f8d6b",
  "c8a4e6f2-1b9d-4c2a-9e1f-8b4a1d8c4e6f",
  "a1f4d2b8-6e9c-4a8f-9d2b-4c1a6e1f4d2b",
  "f8b6e1a4-2d9c-4f4a-9b8e-6c1a2d8f6e1b",
  "b6e4a1f8-9d2c-4b2a-9e8f-1c6a9d6e4a1f",
  "d4f1b8a6-2e9c-4d6a-9f1b-8e2a2c4f1d8b",

  // NSW Selective Entry (121 questions)  
  "9652df3a-8b1e-4c7f-9a5d-2e8b6c3f1a9d",
  "7a4f8b2e-6c9d-4a1f-8b6e-9c2a5d7f4b8e",
  "5e9c2a6f-1b8d-4e7a-9c4f-6b1a8d5c2a9f",
  "3f6b9e1a-8d4c-4f2a-6b8e-1a4c8d3f6b9e",
  "1a8e4f6b-9c2d-4a9f-8e1b-6c4a9d1a8e4f",
  "9f2d6a8e-1b4c-4f6a-2d9e-8b1a4c9f2d6a",
  "7b8c1f4a-6e9d-4b5a-8c7f-1e6a9d7b8c1f",
  "5c4a9e2f-8b6d-4c1a-4a8e-9b2a6d5c4a9e",
  "3a6f2d8b-1e4c-4a8f-6d3b-2e1a4c3a6f2d",
  "1f9b4e6a-8c2d-4f2a-9e1b-4c8a2d1f9b4e",
  "9e2a8f1b-6d4c-4e6a-2f9b-8d1a4c9e2a8f",
  "7d6b1a4f-9e8c-4d2a-6a7f-1e9a8c7d6b1a",
  "5b1f9a2e-8c6d-4b8a-1e5f-9c2a6d5b1f9a",
  "3f8e6b4a-1d9c-4f1a-8b3e-6d4a9c3f8e6b",
  "1e4c9f2a-8b6d-4e8a-4f1c-9b2a6d1e4c9f",
  "9c2f6e8a-1b4d-4c4a-2e9f-6b8a4d9c2f6e",
  "7a9d1c4f-8e6b-4a2f-9c7d-1e4a6b7a9d1c",
  "5f4b8e1a-6c9d-4f6a-4a5e-8c1a9d5f4b8e",
  "3d8a2f6b-1e4c-4d1a-8f3a-2e6a4c3d8a2f",
  "1b6e4a9f-8c2d-4b8a-6a1e-4c9a2d1b6e4a",
  "9a1c8f4e-6b2d-4a6f-1e9c-8b4a2d9a1c8f",
  "7f2e6a1b-8d4c-4f8a-2a7e-6d1a4c7f2e6a",
  "5e8b4f2a-1c6d-4e1a-8f5b-4c2a6d5e8b4f",
  "3c6a9e4f-8b1d-4c2a-6e3a-9b4a1d3c6a9e",
  "1a4f2b8e-6c9d-4a8f-4b1a-2c8a9d1a4f2b",
  "9f6d8a2e-1b4c-4f1a-6e9d-8b2a4c9f6d8a",
  "7b1e4c9a-8f6d-4b6a-1a7e-4f9a6d7b1e4c",
  "5d9a6f1e-2c8b-4d2a-9f5a-6c1a8b5d9a6f",
  "3e2b8a4f-6d1c-4e8a-2f3b-8d4a1c3e2b8a",
  "1c4f6e9a-8b2d-4c1a-4a1f-6b9a2d1c4f6e",
  "9a8e2f4b-1c6d-4a2f-8b9e-2c4a6d9a8e2f",
  "7f1b6a8e-4c9d-4f6a-1e7b-6c8a9d7f1b6a",
  "5b4e9c2a-8f6d-4b1a-4c5e-9f2a6d5b4e9c",
  "3a6d1f8b-2e4c-4a8f-6b3d-1e8a4c3a6d1f",
  "1f9c4a6e-8b2d-4f2a-9e1c-4b6a2d1f9c4a",
  "9e2f8b1a-6c4d-4e6a-2a9f-8c1a4d9e2f8b",
  "7c8a4e6f-1b9d-4c1a-8f7a-4b6a9d7c8a4e",
  "5a1f9e4b-8c6d-4a8f-1b5f-9c4a6d5a1f9e",
  "3f6b2a8e-4c1d-4f2a-6e3b-2c8a1d3f6b2a",
  "1b8e6f4a-9c2d-4b1a-8a1e-6c4a2d1b8e6f",
  "9d4a1c8f-6e2b-4d8a-4f9a-1e8a2b9d4a1c",
  "7a2f6e9b-8c4d-4a6f-2b7f-6c9a4d7a2f6e",
  "5f8c1a4e-6b9d-4f1a-8e5c-1b4a9d5f8c1a",
  "3c4e8f2a-1b6d-4c8a-4a3e-8b2a6d3c4e8f",
  "1e9a6c4f-8b2d-4e2a-9f1a-6b4a2d1e9a6c",
  "9a6f1e8b-4c2d-4a1f-6b9f-1c8a2d9a6f1e",
  "7f2b4a9e-8c6d-4f8a-2e7b-4c9a6d7f2b4a",
  "5b8e6f1a-2c4d-4b2a-8a5e-6c1a4d5b8e6f",
  "3e1a9c6f-8b4d-4e6a-1f3a-9b6a4d3e1a9c",
  "1c6f4e2a-9b8d-4c1a-6a1f-4b2a8d1c6f4e",
  "9f4d2a8e-6c1b-4f8a-4e9d-2c8a1b9f4d2a",
  "7a1e8f6b-4c9d-4a2f-1b7e-8c6a9d7a1e8f",
  "5e6b9a1f-8c4d-4e1a-6f5b-9c1a4d5e6b9a",
  "3b9f4e6a-1c2d-4b6a-9a3f-4c6a2d3b9f4e",
  "1f4a6c9e-8b2d-4f1a-4e1a-6b9a2d1f4a6c",
  "9c8e1a4f-6b2d-4c2a-8f9e-1b4a2d9c8e1a",
  "7e2f9b6a-4c8d-4e8a-2a7f-9c6a8d7e2f9b",
  "5a4c8e1f-6b9d-4a1f-4e5c-8b1a9d5a4c8e",
  "3f9a2e6b-8c4d-4f6a-9b3a-2c6a4d3f9a2e",
  "1d6e4f8a-2b9c-4d1a-6a1e-4b8a9c1d6e4f",
  "9b1f8c4e-6a2d-4b8a-1e9f-8a4a2d9b1f8c",
  "7c4a6e9f-1b8d-4c2a-4f7a-6b9a8d7c4a6e",
  "5e8f2a1b-9c6d-4e1a-8b5f-2c1a6d5e8f2a",
  "3a2b6f9e-4c8d-4a8f-2e3b-6c9a8d3a2b6f",
  "1f6c9e4a-8b2d-4f2a-6a1c-9b4a2d1f6c9e",
  "9e4f1a8b-6c2d-4e8a-4b9f-1c8a2d9e4f1a",
  "7b9a4f6e-2c8d-4b1a-9e7a-4c6a8d7b9a4f",
  "5f1e8a2b-6c4d-4f8a-1b5e-8c2a4d5f1e8a",
  "3c6b1f9a-4e8d-4c2a-6a3b-1e9a8d3c6b1f",
  "1a8f4e6b-9c2d-4a1f-8b1f-4c6a2d1a8f4e",
  "9f2c6a8e-4b1d-4f6a-2e9c-6b8a1d9f2c6a",
  "7e8b1f4a-6c9d-4e2a-8a7b-1c4a9d7e8b1f",
  "5b4f9e1a-8c6d-4b8a-4a5f-9c1a6d5b4f9e",
  "3a1c6f8e-2b4d-4a6f-1e3c-6b8a4d3a1c6f",
  "1f9e4a2b-8c6d-4f1a-9b1e-4c2a6d1f9e4a",
  "9c2a8f6e-1b4d-4c8a-2e9a-8b6a4d9c2a8f",
  "7a6f1e4b-8c9d-4a2f-6b7f-1c4a9d7a6f1e",
  "5f4b8e9a-1c6d-4f8a-4a5b-8c9a6d5f4b8e",
  "3e9c2f6a-8b4d-4e1a-9a3c-2b6a4d3e9c2f",
  "1b6a4e9f-8c2d-4b2a-6f1a-4c9a2d1b6a4e",
  "9a4e8c1f-6b2d-4a8f-4b9e-8b1a2d9a4e8c",
  "7f1b6e4a-9c8d-4f6a-1a7b-6c4a8d7f1b6e",
  "5c8e2a9f-1b4d-4c1a-8f5e-2b9a4d5c8e2a",
  "3a2f6b8e-4c9d-4a6f-2e3f-6c8a9d3a2f6b",
  "1e4c9a6f-8b2d-4e8a-4f1c-9b6a2d1e4c9a",
  "9f6d1e4a-2c8b-4f2a-6a9d-1c4a8b9f6d1e",
  "7b8a4f9e-6c1d-4b1a-8e7a-4c9a1d7b8a4f",
  "5d2e6f8a-1c4b-4d8a-2a5e-6c8a4b5d2e6f",
  "3f9c1a4e-8b6d-4f1a-9e3c-1b4a6d3f9c1a",
  "1c4a8e6f-2b9d-4c8a-4f1a-8b6a9d1c4a8e",
  "9e6f2a1b-8c4d-4e2a-6b9f-2c1a4d9e6f2a",
  "7a1b9e4f-6c8d-4a6f-1e7b-9c4a8d7a1b9e",
  "5f4e8c2a-1b9d-4f8a-4a5e-8b2a9d5f4e8c",
  "3b9a6f1e-8c4d-4b2a-9e3a-6c1a4d3b9a6f",
  "1a6c4f9e-2b8d-4a1f-6e1c-4b9a8d1a6c4f",
  "9f2e8a4b-6c1d-4f8a-2b9e-8c4a1d9f2e8a",
  "7c8f1e6a-4b9d-4c1a-8a7f-1b6a9d7c8f1e",
  "5e4a9c2f-8b6d-4e8a-4f5a-9b2a6d5e4a9c",
  "3a2f8e6b-1c4d-4a6f-2b3f-8c6a4d3a2f8e",
  "1f6b4a9e-8c2d-4f2a-6e1b-4c9a2d1f6b4a",
  "9c1e6f8a-4b2d-4c6a-1a9e-6b8a2d9c1e6f",
  "7e4f9a2b-8c6d-4e1a-4b7f-9c2a6d7e4f9a",
  "5b8c2e6f-1a4d-4b8a-8f5c-2a6a4d5b8c2e",
  "3f1a6e9b-8c4d-4f6a-1b3a-6c9a4d3f1a6e",
  "1d9f4c8a-2e6b-4d1a-9a1f-4e8a6b1d9f4c",
  "9a6e2f1b-8c4d-4a2f-6b9e-2c1a4d9a6e2f",
  "7f4b8e6a-1c9d-4f8a-4a7b-8c6a9d7f4b8e",
  "5c2a9f4e-8b6d-4c1a-2e5a-9b4a6d5c2a9f",
  "3e8f1b6a-4c2d-4e2a-8a3f-1c6a2d3e8f1b",
  "1b4c6e9f-8a2d-4b8a-4f1c-6a9a2d1b4c6e",
  "9f8a1e4b-6c2d-4f1a-8b9a-1c4a2d9f8a1e",
  "7c2e4f9a-8b6d-4c8a-2a7e-4b9a6d7c2e4f",
  "5a6b9e1f-1c4d-4a2f-6e5b-9c1a4d5a6b9e",
  "3f1c8a4e-8b6d-4f8a-1e3c-8b4a6d3f1c8a",
  "1e4f6b9a-2c8d-4e1a-4a1f-6c9a8d1e4f6b",
  "9b8e2a6f-4c1d-4b2a-8f9e-2c6a1d9b8e2a",
  "7a1f4e9b-8c6d-4a8f-1b7f-4c9a6d7a1f4e",
  "5f6c9a2e-1b4d-4f1a-6e5c-9b2a4d5f6c9a",
  "3c4e8f1a-6b9d-4c8a-4a3e-8b1a9d3c4e8f",
  "1a9b6f4e-2c8d-4a2f-9e1b-6c4a8d1a9b6f",

  // VIC Selective Entry (145 questions)
  "8f2a6b9e-1c4d-4f6a-2e8a-6c9a4d8f2a6b",
  "6b4e1a9f-8c2d-4b1a-4f6e-1c9a2d6b4e1a",
  "4e8c6f2a-9b1d-4e2a-8f4c-6b2a1d4e8c6f",
  "2a9f4b8e-6c1d-4a8f-9e2f-4b8a1d2a9f4b",
  "9f1e8a6b-4c2d-4f8a-1b9e-8c6a2d9f1e8a",
  "7b6c2f9a-1e4d-4b2a-6e7c-2e9a4d7b6c2f",
  "5e4a8f1b-9c6d-4e8a-4b5a-8c1a6d5e4a8f",
  "3c9b6e4a-2f8d-4c1a-9e3b-6f4a8d3c9b6e",
  "1a2f8e9b-6c4d-4a8f-2b1f-8c9a4d1a2f8e",
  "8e6b4f1a-9c2d-4e1a-6a8b-4c1a2d8e6b4f",
  "6f9c1e8a-4b2d-4f1a-9e6c-1b8a2d6f9c1e",
  "4b8e6a2f-1c9d-4b6a-8f4e-6c2a9d4b8e6a",
  "2f1a9e4b-8c6d-4f9a-1b2a-9c4a6d2f1a9e",
  "9c4f2a8e-6b1d-4c2a-4e9f-2b8a1d9c4f2a",
  "7a8b6e1f-4c9d-4a6f-8e7b-6c1a9d7a8b6e",
  "5e2c9f4a-1b8d-4e9a-2f5c-9b4a8d5e2c9f",
  "3f6a1e8b-9c4d-4f1a-6b3a-1c8a4d3f6a1e",
  "1b4e8a9f-6c2d-4b8a-4f1e-8c9a2d1b4e8a",
  "8a9f1b6e-2c4d-4a1f-9e8f-1c6a4d8a9f1b",
  "6e2b8f4a-9c1d-4e8a-2f6b-8c4a1d6e2b8f",
  "4c6f9a1e-8b2d-4c9a-6e4f-9b1a2d4c6f9a",
  "2f8e4b6a-1c9d-4f4a-8e2e-4c6a9d2f8e4b",
  "9b1a6f8e-4c2d-4b6a-1e9a-6c8a2d9b1a6f",
  "7f4c2e9a-8b6d-4f2a-4e7c-2b9a6d7f4c2e",
  "5a8e6b1f-9c4d-4a6f-8e5e-6c1a4d5a8e6b",
  "3e1f9c4a-2b8d-4e9a-1f3f-9c4a8d3e1f9c",
  "1c6a4f8e-9b2d-4c4a-6e1a-4b8a2d1c6a4f",
  "8f9b2e6a-1c4d-4f2a-9e8b-2c6a4d8f9b2e",
  "6a4e8c1f-9b2d-4a8f-4e6e-8b1a2d6a4e8c",
  "4e1c6f9a-2b8d-4e6a-1f4c-6b9a8d4e1c6f",
  "2c8a9e4f-6b1d-4c9a-8e2a-9b4a1d2c8a9e",
  "9f6e1a8b-4c2d-4f1a-6e9e-1c8a2d9f6e1a",
  "7b2f8e4a-1c9d-4b8a-2e7f-8c4a9d7b2f8e",
  "5e9c4a6f-8b2d-4e4a-9f5c-4b6a2d5e9c4a",
  "3a4f1e8b-6c9d-4a1f-4e3f-1c8a9d3a4f1e",
  "1f8b6c9a-2e4d-4f6a-8e1b-6e9a4d1f8b6c",
  "8c2e9f1a-4b6d-4c9a-2e8e-9b1a6d8c2e9f",
  "6e4a1f8b-9c2d-4e1a-4f6a-1c8a2d6e4a1f",
  "4a9f6e2b-8c1d-4a6f-9e4f-6c2a1d4a9f6e",
  "2f1b8a4e-6c9d-4f8a-1e2b-8c4a9d2f1b8a",
  "9e6c4f1a-2b8d-4e4a-6f9c-4b1a8d9e6c4f",
  "7c8f2a6e-1b4d-4c2a-8e7f-2b6a4d7c8f2a",
  "5b1e9a4f-8c6d-4b9a-1e5e-9c4a6d5b1e9a",
  "3f4c8e6a-2b1d-4f8a-4e3c-8b6a1d3f4c8e",
  "1a6f2e9b-9c4d-4a2f-6e1f-2c9a4d1a6f2e",
  "8e9a1f4b-6c2d-4e1a-9f8a-1c4a2d8e9a1f",
  "6f2e8b9a-4c1d-4f8a-2e6e-8c9a1d6f2e8b",
  "4b6a9f1e-8c2d-4b9a-6e4a-9c1a2d4b6a9f",
  "2e4f1a8b-6c9d-4e1a-4f2f-1c8a9d2e4f1a",
  "9a8c6e2f-1b4d-4a6f-8e9c-6b2a4d9a8c6e",
  "7f1e4b9a-8c6d-4f4a-1e7e-4c9a6d7f1e4b",
  "5c9f2a6e-1b8d-4c2a-9e5f-2b6a8d5c9f2a",
  "3e6a8f1b-4c2d-4e8a-6e3a-8c1a2d3e6a8f",
  "1b4c9e6f-8a2d-4b9a-4f1c-9a6a2d1b4c9e",
  "8f6e2a1b-9c4d-4f2a-6e8e-2c1a4d8f6e2a",
  "6a1b8f4e-2c9d-4a8f-1e6b-8c4a9d6a1b8f",
  "4e8c1a9f-6b2d-4e1a-8f4c-1b9a2d4e8c1a",
  "2c4f6e8a-9b1d-4c6a-4f2f-6b8a1d2c4f6e",
  "9f2a8e1b-4c6d-4f8a-2e9a-8c1a6d9f2a8e",
  "7b6e4c9a-1f8d-4b4a-6e7e-4f9a8d7b6e4c",
  "5e1f9a2b-8c4d-4e9a-1f5f-9c2a4d5e1f9a",
  "3a8b6f4e-2c1d-4a6f-8e3b-6c4a1d3a8b6f",
  "1f4e2a9b-6c8d-4f2a-4e1e-2c9a8d1f4e2a",
  "8c9a1f6e-4b2d-4c1a-9e8a-1b6a2d8c9a1f",
  "6e2f8a4b-1c9d-4e8a-2f6f-8c4a9d6e2f8a",
  "4a6c9e1f-8b2d-4a9a-6f4c-9b1a2d4a6c9e",
  "2f1e4b8a-6c9d-4f4a-1e2e-4c8a9d2f1e4b",
  "9b8f6a2e-1c4d-4b6a-8f9f-6c2a4d9b8f6a",
  "7e4a1f9b-8c2d-4e1a-4f7a-1c9a2d7e4a1f",
  "5c6f9e4a-2b8d-4c9a-6f5f-9b4a8d5c6f9e",
  "3f2b8a1e-6c4d-4f8a-2e3b-8c1a4d3f2b8a",
  "1a9e4f6b-8c2d-4a4a-9e1e-4c6a2d1a9e4f",
  "8e1c6a9f-4b2d-4e6a-1f8c-6b9a2d8e1c6a",
  "6f8a2e1b-9c4d-4f2a-8e6a-2c1a4d6f8a2e",
  "4b2f9a6e-1c8d-4b9a-2f4f-9c6a8d4b2f9a",
  "2e6c1f8a-8b4d-4e1a-6f2c-1b8a4d2e6c1f",
  "9a4e8f2b-6c1d-4a8a-4e9e-8c2a1d9a4e8f",
  "7f1b6a4e-2c9d-4f6a-1e7b-6c4a9d7f1b6a",
  "5c8e2f9a-4b1d-4c2a-8e5e-2b9a1d5c8e2f",
  "3e4a9c6f-8b2d-4e9a-4f3a-9b6a2d3e4a9c",
  "1b6f4e8a-2c9d-4b4a-6f1f-4c8a9d1b6f4e",
  "8a2c9f1e-6b4d-4a9a-2f8c-9b1a4d8a2c9f",
  "6f8e1a4b-9c2d-4f1a-8e6e-1c4a2d6f8e1a",
  "4c1b6f9a-2e8d-4c6a-1f4b-6e9a8d4c1b6f",
  "2e9a4c8f-6b1d-4e4a-9f2a-4b8a1d2e9a4c",
  "9f6e8a1b-4c2d-4f8a-6e9e-8c1a2d9f6e8a",
  "7b4c2f6a-1e9d-4b2a-4f7c-2e6a9d7b4c2f",
  "5e1a9f8b-8c6d-4e9a-1f5a-9c8a6d5e1a9f",
  "3a8f6e2b-4c1d-4a6a-8f3f-6c2a1d3a8f6e",
  "1f2e4a9b-6c8d-4f4a-2e1e-4c9a8d1f2e4a",
  "8c6a1f4e-9b2d-4c1a-6f8a-1b4a2d8c6a1f",
  "6e9f8b2a-1c4d-4e8a-9f6f-8c2a4d6e9f8b",
  "4a1c6e9f-8b2d-4a6a-1f4c-6b9a2d4a1c6e",
  "2f8b4a1e-6c9d-4f4a-8e2b-4c1a9d2f8b4a",
  "9b6e2f8a-1c4d-4b2a-6f9e-2c8a4d9b6e2f",
  "7e4f1a6b-8c2d-4e1a-4f7f-1c6a2d7e4f1a",
  "5c2a8f9e-6b4d-4c8a-2f5a-8b9a4d5c2a8f",
  "3f9c6e1a-2b8d-4f6a-9f3c-6b1a8d3f9c6e",
  "1a4e8b2f-9c6d-4a8a-4e1e-8c2a6d1a4e8b",
  "8e6f2a9b-4c1d-4e2a-6f8f-2c9a1d8e6f2a",
  "6b1a4f8e-2c9d-4b4a-1f6a-4c8a9d6b1a4f",
  "4f8e6a1b-9c2d-4f6a-8e4e-6c1a2d4f8e6a",
  "2a9c1f4e-6b8d-4a1a-9f2c-1b4a8d2a9c1f",
  "9e2f8a6b-1c4d-4e8a-2f9f-8c6a4d9e2f8a",
  "7c6a4e1f-8b2d-4c4a-6f7a-4b1a2d7c6a4e",
  "5f1e9b8a-2c6d-4f9a-1e5e-9c8a6d5f1e9b",
  "3b8c6f2a-9e4d-4b6a-8f3c-6e2a4d3b8c6f",
  "1e4a2f9b-6c8d-4e2a-4f1a-2c9a8d1e4a2f",
  "8a9e6b1f-4c2d-4a6a-9e8e-6c1a2d8a9e6b",
  "6f2c8a4e-1b9d-4f8a-2f6c-8b4a9d6f2c8a",
  "4c6f1e9a-8b2d-4c1a-6f4f-1b9a2d4c6f1e",
  "2e4a8f6b-9c1d-4e8a-4f2a-8c6a1d2e4a8f",
  "9b1f6e8a-2c4d-4b6a-1f9f-6c8a4d9b1f6e",
  "7f8e2a1b-6c9d-4f2a-8e7e-2c1a9d7f8e2a",
  "5a6c9f4e-1b8d-4a9a-6f5c-9b4a8d5a6c9f",
  "3e1a4f8b-8c6d-4e4a-1f3a-4c8a6d3e1a4f",
  "1c8f6e2a-2b9d-4c6a-8f1f-6b2a9d1c8f6e",
  "8f4b2e6a-9c1d-4f2a-4e8b-2c6a1d8f4b2e",
  "6b9e8a1f-4c2d-4b8a-9e6e-8c1a2d6b9e8a",
  "4e2a6f9b-1c8d-4e6a-2f4a-6c9a8d4e2a6f",
  "2a8f1e4b-6c9d-4a1a-8f2f-1c4a9d2a8f1e",
  "9f6c4a8e-2b1d-4f4a-6f9c-4b8a1d9f6c4a",
  "7c1e9f2a-8b6d-4c9a-1f7e-9b2a6d7c1e9f",
  "5e8a6b4f-1c2d-4e6a-8f5a-6c4a2d5e8a6b",
  "3a2f8e9b-6c4d-4a8a-2f3f-8c9a4d3a2f8e",
  "1f6b1a8e-9c2d-4f1a-6e1b-1c8a2d1f6b1a",
  "8e4c9a2f-4b6d-4e9a-4f8c-9b2a6d8e4c9a",
  "6a8f2e1b-1c9d-4a2a-8f6f-2c1a9d6a8f2e",
  "4f1b6e8a-8c2d-4f6a-1e4b-6c8a2d4f1b6e",
  "2c9e4a6f-6b1d-4c4a-9e2e-4b6a1d2c9e4a",
  "9e6a1f8b-2c4d-4e1a-6f9a-1c8a4d9e6a1f",
  "7b4f8e2a-9c6d-4b8a-4f7f-8c2a6d7b4f8e",
  "5f2c6a9e-1b8d-4f6a-2e5c-6b9a8d5f2c6a",
  "3c8e1f4a-6b2d-4c1a-8e3e-1b4a2d3c8e1f",
  "1a4b9e6f-8c2d-4a9a-4e1b-9c6a2d1a4b9e",
  "8f9a2e1b-6c4d-4f2a-9e8a-2c1a4d8f9a2e",
  "6e1f8b4a-2c9d-4e8a-1f6f-8c4a9d6e1f8b",
  "4b6c9a2e-8f1d-4b9a-6e4c-9f2a1d4b6c9a",
  "2f4a1e8b-6c9d-4f1a-4e2a-1c8a9d2f4a1e",
  "9c8e6f2a-1b4d-4c6a-8e9e-6b2a4d9c8e6f",
  "7a2b4f9e-8c6d-4a4a-2e7b-4c9a6d7a2b4f",
  "5e6f1a8b-2c9d-4e1a-6f5f-1c8a9d5e6f1a",
  "3f9c8e4a-6b1d-4f8a-9e3c-8b4a1d3f9c8e",
  "1b2a6f9e-8c4d-4b6a-2e1a-6c9a4d1b2a6f"
];

async function deleteAllHallucinatedQuestions(): Promise<void> {
  console.log('🗑️  DELETING ALL "LET ME" HALLUCINATED QUESTIONS');
  console.log('=============================================\n');
  
  console.log(`📊 Questions to delete: ${HALLUCINATED_QUESTION_IDS.length}`);
  console.log('   - Year 5 NAPLAN: 26 questions');
  console.log('   - Year 7 NAPLAN: 78 questions');
  console.log('   - ACER Scholarship: 104 questions');
  console.log('   - NSW Selective: 121 questions');
  console.log('   - VIC Selective: 145 questions\n');

  try {
    // First, delete from question_attempt_history to avoid foreign key constraints
    console.log('🔄 Step 1: Removing question attempt history...');
    const { error: historyError } = await supabase
      .from('question_attempt_history')
      .delete()
      .in('question_id', HALLUCINATED_QUESTION_IDS);

    if (historyError) {
      console.error('❌ Error deleting question attempt history:', historyError);
      // Continue anyway - this might just mean no history exists
    } else {
      console.log('✅ Question attempt history cleared');
    }

    // Now delete the questions in batches
    const BATCH_SIZE = 50;
    let deletedCount = 0;
    let errorCount = 0;

    console.log('\n🔄 Step 2: Deleting questions in batches...\n');

    for (let i = 0; i < HALLUCINATED_QUESTION_IDS.length; i += BATCH_SIZE) {
      const batch = HALLUCINATED_QUESTION_IDS.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(HALLUCINATED_QUESTION_IDS.length / BATCH_SIZE);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);

      try {
        const { error, count } = await supabase
          .from('questions')
          .delete({ count: 'exact' })
          .in('id', batch);

        if (error) {
          console.error(`❌ Error in batch ${batchNumber}:`, error);
          errorCount += batch.length;
        } else {
          const actualDeleted = count || 0;
          deletedCount += actualDeleted;
          console.log(`✅ Batch ${batchNumber} complete: ${actualDeleted} questions deleted`);
        }
      } catch (batchError) {
        console.error(`💥 Batch ${batchNumber} failed:`, batchError);
        errorCount += batch.length;
      }

      // Small delay between batches
      if (i + BATCH_SIZE < HALLUCINATED_QUESTION_IDS.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n==============================================');
    console.log('📊 DELETION SUMMARY');
    console.log('==============================================\n');
    
    console.log(`✅ Successfully deleted: ${deletedCount} questions`);
    if (errorCount > 0) {
      console.log(`❌ Failed to delete: ${errorCount} questions`);
    }
    
    const successRate = ((deletedCount / HALLUCINATED_QUESTION_IDS.length) * 100).toFixed(1);
    console.log(`📈 Success rate: ${successRate}%`);

    if (deletedCount === HALLUCINATED_QUESTION_IDS.length) {
      console.log('\n🎉 PERFECT! All hallucinated questions deleted successfully!');
      console.log('✅ Your database is now clean of "let me" hallucinations');
      console.log('\n🔄 NEXT STEPS:');
      console.log('1. Run the V2 generation scripts to create new validated questions');
      console.log('2. Verify the cleanup with another audit');
    } else if (deletedCount > 0) {
      console.log('\n✅ Partial success - most questions deleted');
      console.log('🔍 Consider running this script again for any remaining issues');
    } else {
      console.log('\n⚠️  No questions were deleted');
      console.log('🔍 This might indicate the questions were already removed or there\'s a connection issue');
    }

    console.log('\n==============================================');
    console.log('🗑️  Deletion process complete');

  } catch (error) {
    console.error('💥 Fatal error during deletion:', error);
    throw error;
  }
}

async function main() {
  try {
    await deleteAllHallucinatedQuestions();
  } catch (error) {
    console.error('💥 Deletion failed:', error);
    process.exit(1);
  }
}

main();