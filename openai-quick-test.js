import OpenAI from 'openai';

// Load environment variables
import 'dotenv/config';

// Direct test of OpenAI API
async function testOpenAI() {
  console.log('Testing OpenAI integration...');
  console.log('API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    console.log('\nSending test request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes financial documents. Return your analysis in JSON format." },
        { role: "user", content: "Summarize the key points from this investment proposal and return the result as JSON: \"BlueEarth Capital is focusing on sustainable investments in 2025, with primary focus on renewable energy, climate tech, and sustainable agriculture.\"" }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    console.log('\n--- Response ---');
    console.log(response.choices[0].message.content);
    console.log('\nOpenAI test completed successfully!');
  } catch (error) {
    console.error('Error testing OpenAI integration:', error);
  }
}

// Run the test
testOpenAI();