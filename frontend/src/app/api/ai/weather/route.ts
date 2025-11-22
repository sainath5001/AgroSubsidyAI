import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { district, village, latitude, longitude, cropType } = await request.json();

    console.log("Weather API called with:", { district, village, latitude, longitude, cropType });

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing from environment variables");
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);
    
    // Use the official Google GenAI SDK
    // If apiKey is not provided, it automatically picks up GEMINI_API_KEY from environment
    // But we'll pass it explicitly to be sure
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    console.log("Initialized GoogleGenAI client");

    const cropNames = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Soybean", "Other"];
    const cropName = cropNames[cropType] || "Other";
    
    const currentDate = new Date().toISOString().split('T')[0];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const prompt = `You are a weather oracle AI with access to real-world disaster databases. Analyze agricultural conditions for a farmer in ${district} district, ${village} village (coordinates: ${latitude}, ${longitude}) growing ${cropName}.

CRITICAL TASK: Search your knowledge base for ACTUAL natural disasters that occurred in ${district}, ${village}, or nearby regions within the LAST 6-7 MONTHS (from ${sixMonthsAgoStr} to ${currentDate}).

IMPORTANT SPECIFIC CASES TO CHECK:
- If ${district} is "Uttarkashi" and ${village} is "Dharali": There was a MAJOR FLASH FLOOD on August 5, 2025. A cloudburst triggered flash floods/mudslides in Dharali village, Kheer Ganga area. Many structures (homes, shops, hotels) were washed away, landslides occurred, and at least 4 people died with dozens missing. This is a CONFIRMED FLOOD disaster within the timeframe.
- If ${district} is "Uttarkashi": Check for the August 2025 flood in Dharali or nearby villages in Uttarkashi district.

You MUST check for REAL disasters that actually happened. Think hard and search thoroughly:
- Check if ${district} or ${village} matches any known disaster-affected locations
- Consider the country/region - if this is in India, check recent disaster reports (Uttarakhand floods, Punjab floods, Maharashtra floods in 2025)
- Look for actual news reports, disaster databases, or weather service alerts
- Many regions have experienced droughts, floods, cyclones, or other disasters recently

Check for ALL types of natural disasters:
1. DROUGHT - Low rainfall, high temperature, water scarcity
2. FLOOD - Excessive rainfall, overflowing rivers, waterlogging
3. CYCLONE/STORM/TORNADO - Strong winds, heavy rain, storm surges, tornadoes
4. HAILSTORM - Hail damage to crops
5. FROST/FREEZE - Extreme cold, frost damage
6. HEATWAVE - Extreme high temperatures
7. LANDSLIDE - Soil erosion, landslides affecting farmland
8. PEST_OUTBREAK - Large-scale pest infestations
9. WILDFIRE - Forest/grass fires affecting agricultural land
10. EARTHQUAKE - Seismic activity damaging farmland
11. TSUNAMI - Coastal flooding from tsunamis

IMPORTANT: 
- If ${district} or ${village} is in a region that experienced a REAL disaster in the past 6-7 months, you MUST report it
- Be thorough - search your knowledge for actual disaster events, not hypothetical scenarios
- If you find evidence of a real disaster (even if approximate location), report it
- Only set hasDisaster to false if you are CERTAIN no disaster occurred in this timeframe

Respond in JSON format with this exact structure:
{
  "hasDisaster": true/false,
  "disasterType": "DROUGHT" or "FLOOD" or "CYCLONE" or "HAILSTORM" or "FROST" or "HEATWAVE" or "LANDSLIDE" or "PEST_OUTBREAK" or "WILDFIRE" or "EARTHQUAKE" or "TSUNAMI" or "NONE",
  "temperature": number (in Celsius, realistic for the disaster type),
  "rainfall": number (in mm, realistic for the disaster type),
  "windSpeed": number (in km/h, optional, for storms/cyclones),
  "reasoning": "detailed explanation mentioning the actual disaster that occurred, when it happened (within last 6-7 months), and why this qualifies for subsidy. Be specific about the real disaster event.",
  "disasterDate": "approximate date when disaster occurred (within last 6-7 months, format: YYYY-MM-DD or relative like '4 months ago')"
}

Examples of what to check:
- If location is in Africa: Check for recent droughts, floods, or cyclones in that region
- If location is in Asia: Check for recent monsoons, floods, or cyclones
- If location is in disaster-prone areas: Check recent disaster reports
- Think about what disasters commonly affect this type of location

Be thorough and search your knowledge base - many regions have experienced actual disasters recently.`;

    console.log("Calling Gemini API with prompt length:", prompt.length);
    
    let text;
    
    try {
      // Use the official SDK structure: ai.models.generateContent()
      // According to SDK docs, response has a .text property
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Use gemini-2.5-flash as per SDK README
        contents: prompt,
      });
      
      // Access text property directly from response
      text = response.text;
      console.log("Gemini API response received, length:", text.length);
      console.log("First 500 chars of response:", text.substring(0, 500));
    } catch (apiError: any) {
      console.error("Gemini API call error:", apiError);
      console.error("Error details:", {
        message: apiError.message,
        status: apiError.status,
        statusText: apiError.statusText,
        errorDetails: apiError.errorDetails,
      });
      throw apiError;
    }

    // Parse JSON from response
    let weatherData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      weatherData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      
      // If no disaster found, try a second more aggressive search
      if (!weatherData.hasDisaster || weatherData.disasterType === "NONE") {
        console.log(`No disaster found for ${district}, ${village}. Trying more aggressive search...`);
        
        const aggressivePrompt = `You are a disaster detection AI with access to real-world news and disaster databases. Search THOROUGHLY for ANY natural disaster (drought, flood, cyclone, tornado, landslide, etc.) that occurred in "${district}" district, "${village}" village, or nearby regions in India within the past 6-7 months (from ${sixMonthsAgoStr} to ${currentDate}).

CRITICAL INFORMATION TO SEARCH FOR:
- If "${district}" is "Uttarkashi" and "${village}" is "Dharali": There was a CONFIRMED MAJOR FLASH FLOOD on August 5, 2025. A cloudburst triggered flash floods/mudslides in Dharali village, Kheer Ganga area, Uttarkashi district, Uttarakhand, India. Many structures (homes, shops, hotels) were washed away, landslides occurred, and at least 4 people died with dozens missing. This is a REAL, CONFIRMED disaster within the timeframe.
- Search news databases for: "Uttarkashi flood 2025", "Dharali flood August 2025", "Uttarakhand flood 2025"
- Other recent disasters in India: Punjab floods (August 2025), Maharashtra floods (September 2025)

INSTRUCTIONS:
1. Search your knowledge base for news reports, disaster databases, and weather service alerts
2. Check if "${district}" or "${village}" matches any known disaster-affected locations
3. Consider nearby regions if the exact location had no disaster but nearby areas did
4. If you find ANY evidence of a real disaster in this location or nearby, report it with hasDisaster: true

Be thorough and search multiple sources. Many regions in India have experienced actual disasters in 2024-2025.

Respond in JSON:
{
  "hasDisaster": true/false,
  "disasterType": "disaster type or NONE",
  "temperature": number,
  "rainfall": number,
  "windSpeed": number (optional),
  "reasoning": "explanation of the actual disaster found with details",
  "disasterDate": "when it occurred"
}`;

        try {
          const secondResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: aggressivePrompt,
          });
          const secondText = secondResponse.text;
          
          const secondJsonMatch = secondText.match(/```json\s*([\s\S]*?)\s*```/) || secondText.match(/\{[\s\S]*\}/);
          const secondData = JSON.parse(secondJsonMatch ? secondJsonMatch[1] || secondJsonMatch[0] : secondText);
          
          // Use second result if it found a disaster
          if (secondData.hasDisaster && secondData.disasterType !== "NONE") {
            weatherData = secondData;
            console.log("Found disaster in second search:", weatherData.disasterType);
          } else {
            console.log("Second search also found no disaster");
          }
        } catch (e) {
          console.error("Second search error:", e);
        }
      }
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Raw response text:", text);
      console.error("Parse error details:", e);
      
      // Try to extract JSON from the response more aggressively
      try {
        // Try to find JSON object in the text
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonStr = text.substring(jsonStart, jsonEnd + 1);
          weatherData = JSON.parse(jsonStr);
          console.log("Successfully parsed JSON from extracted substring");
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (e2) {
        console.error("Failed to parse JSON even after extraction:", e2);
        // Return error instead of fake data
        return NextResponse.json(
          { 
            error: "Failed to parse AI response", 
            rawResponse: text.substring(0, 500),
            parseError: String(e)
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error("Weather AI error:", error);
    console.error("Error stack:", error.stack);
    
    // Check if it's an API error with details
    let errorMessage = error.message || "Failed to analyze weather";
    let errorDetails = null;
    
    // Try to extract more details from the error
    if (error.response) {
      errorDetails = error.response;
    } else if (error.error) {
      errorDetails = error.error;
      if (error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorDetails: errorDetails,
        hasDisaster: false,
        disasterType: "NONE",
        reasoning: `API Error: ${errorMessage}. Unable to fetch disaster data.`,
      },
      { status: 500 }
    );
  }
}
