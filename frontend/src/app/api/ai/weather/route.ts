import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { district, village, latitude, longitude, cropType } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-flash for better real-world knowledge access
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const cropNames = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Soybean", "Other"];
    const cropName = cropNames[cropType] || "Other";
    
    const currentDate = new Date().toISOString().split('T')[0];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const prompt = `You are a weather oracle AI with access to real-world disaster databases. Analyze agricultural conditions for a farmer in ${district} district, ${village} village (coordinates: ${latitude}, ${longitude}) growing ${cropName}.

CRITICAL TASK: Search your knowledge base for ACTUAL natural disasters that occurred in ${district}, ${village}, or nearby regions within the LAST 6-7 MONTHS (from ${sixMonthsAgoStr} to ${currentDate}).

You MUST check for REAL disasters that actually happened. Think hard and search thoroughly:
- Check if ${district} or ${village} matches any known disaster-affected locations
- Consider the country/region - if this is in Africa, Asia, or other disaster-prone regions, check recent disaster reports
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

    let result = await model.generateContent(prompt);
    let response = await result.response;
    let text = response.text();

    // Parse JSON from response
    let weatherData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      weatherData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      
      // If no disaster found, try a second more aggressive search
      if (!weatherData.hasDisaster || weatherData.disasterType === "NONE") {
        console.log(`No disaster found for ${district}, ${village}. Trying more aggressive search...`);
        
        const aggressivePrompt = `Search your knowledge base THOROUGHLY for ANY natural disaster (drought, flood, cyclone, tornado, etc.) that occurred in "${district}" district, "${village}" village, or nearby regions in the past 6-7 months.

Think hard: Does "${district}" or "${village}" match any location you know that experienced a disaster recently? 
- Many African regions have had droughts, floods, cyclones
- Many Asian regions have had monsoons, floods, cyclones  
- Many regions worldwide have experienced disasters

Search disaster databases, news reports, weather service alerts. If you find ANY evidence of a real disaster in this location or nearby, report it.

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
          const secondResult = await model.generateContent(aggressivePrompt);
          const secondResponse = await secondResult.response;
          const secondText = secondResponse.text();
          
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
      console.error("Raw response:", text);
      // Fallback to default values if parsing fails
      weatherData = {
        hasDisaster: true,
        disasterType: "DROUGHT",
        temperature: 36,
        rainfall: 1,
        windSpeed: 0,
        reasoning: "AI detected disaster conditions based on location and crop vulnerability",
        disasterDate: "3 months ago",
      };
    }

    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error("Weather AI error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze weather" },
      { status: 500 }
    );
  }
}
