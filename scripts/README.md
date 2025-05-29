# Scripts Documentation

This folder contains utility scripts for generating educational content and managing the EduCoach Prep Portal application.

## VIC Selective Entry Practice Test Generator

### Overview
The `generate-vic-selective-practice-test.ts` script generates complete, authentic VIC Selective Entry (Year 9 Entry) practice tests using the Question Generation Engine and stores all data in Supabase.

### Features
- ✅ Generates authentic VIC Selective Entry questions across all test sections
- ✅ Creates reading comprehension passages with associated questions  
- ✅ Distributes questions across sub-skills and difficulty levels (1-3)
- ✅ Saves all questions and passages to Supabase database
- ✅ Provides detailed generation summary and analytics
- ✅ Resume functionality (skips sections already completed)
- ✅ Comprehensive error handling and troubleshooting guidance

### Usage

#### Prerequisites
1. **Environment Variables**: Ensure your `.env` file contains:
   ```env
   VITE_CLAUDE_API_KEY=your_claude_api_key_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

#### Running the Script

Generate practice test 1 (default):
```bash
npm run generate-vic-test
```

Generate a specific practice test number:
```bash
npm run generate-vic-test 2
npm run generate-vic-test 3
npm run generate-vic-test 5
```

Alternative command format:
```bash
npm run generate:vic-practice 1
```

#### Script Output

The script provides comprehensive logging including:

1. **Environment Verification**: Checks API keys and database configuration
2. **Generation Progress**: Real-time updates during question creation
3. **Section Breakdown**: Detailed analysis of each test section
4. **Sub-skill Distribution**: Questions per sub-skill in each section
5. **Difficulty Analysis**: Breakdown of difficulty levels (1=Below Average, 2=Average, 3=Above Average)
6. **Database Storage Confirmation**: Verification of Supabase saves
7. **Performance Metrics**: Generation time and question counts

### Test Structure

The VIC Selective Entry test generated includes:

#### Reading Comprehension
- **Passages**: 3 passages with 4 questions each (12 total questions)
- **Sub-skills**: Text Comprehension (Explicit & Inferential), Text Analysis (Critical), Language (Vocabulary)
- **Passage Types**: Informational, narrative, argumentative, and poetry
- **Difficulty Distribution**: Mixed difficulty levels across passages

#### Mathematics
- **Question Types**: Problem-solving, numerical reasoning, spatial reasoning
- **Sub-skills**: Various mathematical concepts appropriate for Year 9 entry
- **Visual Elements**: Diagrams, charts, and geometric figures where appropriate

#### Other Sections
- Additional sections as defined in the test structure
- Balanced difficulty distribution
- Authentic question styles matching real VIC Selective Entry tests

### Database Schema

#### Questions Table
Questions are saved with these key fields:
- `test_type`: "VIC Selective Entry (Year 9 Entry)"
- `year_level`: 9
- `section_name`: Section name from curriculum data
- `sub_skill`: Specific sub-skill being tested
- `difficulty`: 1-3 difficulty level
- `test_mode`: "practice_[number]"
- `passage_id`: Linked passage ID (for reading questions)
- `question_sequence`: Order within passage (for reading questions)

#### Passages Table  
Reading passages are saved with:
- `test_type`: "VIC Selective Entry (Year 9 Entry)"
- `section_name`: "Reading_Comprehension"
- `title`: Passage title
- `content`: Full passage text
- `passage_type`: informational/narrative/argumentative/poetry
- `word_count`: Passage length

### Troubleshooting

#### Common Issues

1. **Claude API Key Error**
   - Verify `VITE_CLAUDE_API_KEY` or `CLAUDE_API_KEY` is set in `.env`
   - Check that your Claude API key is valid and has available credits
   - Ensure you have access to Claude Sonnet 4 model

2. **Supabase Connection Error**
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
   - Check that your Supabase project is active
   - Ensure database tables exist (`questions` and `passages`)

3. **Rate Limiting**
   - Claude API has rate limits - the script includes automatic retry with exponential backoff
   - If you hit limits frequently, consider adding longer delays between requests

4. **Generation Incomplete**
   - The script has resume functionality - rerun to continue from where it stopped
   - Check console output for specific section or sub-skill that failed

#### Performance Optimization

- **Generation Time**: Full test generation typically takes 15-30 minutes
- **API Calls**: ~50-100 Claude API calls depending on test structure  
- **Rate Limiting**: Built-in delays prevent API overload
- **Resume Logic**: Skips already completed sections to save time

### Extending the Script

To create similar scripts for other test types:

1. Copy `generate-vic-selective-practice-test.ts`
2. Update `VIC_TEST_TYPE` constant to target test type
3. Modify logging messages and documentation
4. Add new npm script to `package.json`

Example for NAPLAN:
```typescript
const NAPLAN_TEST_TYPE = 'Year 7 NAPLAN';
```

### Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console output for specific error messages
3. Verify environment configuration
4. Check Supabase dashboard for saved data 