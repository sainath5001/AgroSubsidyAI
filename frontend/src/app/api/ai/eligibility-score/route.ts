import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { farmerData, weatherData } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an eligibility evaluation AI for agricultural subsidies. A farmer has been registered but no weather disaster was detected in their region.

Farmer Data:
- District: ${farmerData.district}
- Village: ${farmerData.village}
- Crop Type: ${farmerData.cropType}
- Location: ${farmerData.latitude}, ${farmerData.longitude}

Weather Data:
- Temperature: ${weatherData.temperature}°C
- Rainfall: ${weatherData.rainfall}mm
- Disaster Type: ${weatherData.disasterType || "NONE"}
- Reasoning: ${weatherData.reasoning || "No disaster detected"}

Since no natural disaster was detected in the PAST 6-7 MONTHS (180-210 days), calculate an INELIGIBILITY SCORE on a scale of 0-10 (can include decimals like 7.5).

Natural disasters checked (within last 6-7 months) include:
- DROUGHT, FLOOD, CYCLONE/STORM, HAILSTORM, FROST/FREEZE, HEATWAVE
- LANDSLIDE, PEST_OUTBREAK, WILDFIRE, EARTHQUAKE, TSUNAMI

IMPORTANT: Only disasters within the last 6-7 months qualify for subsidies. Disasters older than this timeframe do not make farmers eligible.

Score meaning:
- 0-2: Very low ineligibility (might qualify under special circumstances)
- 3-5: Moderate ineligibility (some factors prevent eligibility)
- 6-8: High ineligibility (significant barriers)
- 9-10: Complete ineligibility (no chance of qualifying)

Consider factors like:
- No disaster alert present in the last 6-7 months (none of the above disasters detected in recent timeframe)
- Crop type compatibility
- Region characteristics
- Weather conditions in the past 6-7 months (even if not a disaster)
- Historical disaster patterns in the region (but only recent ones count)
- Current weather severity (even if not classified as disaster)
- Time since last disaster (if any disaster occurred more than 6-7 months ago, it doesn't qualify)

Respond in JSON format:
{
  "ineligibilityScore": number (0-10, can be decimal like 7.5),
  "reasoning": "detailed explanation of why this score was given",
  "factors": ["factor1", "factor2", "factor3"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let scoreData;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      scoreData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      
      // Validate score is between 0-10
      if (scoreData.ineligibilityScore < 0) scoreData.ineligibilityScore = 0;
      if (scoreData.ineligibilityScore > 10) scoreData.ineligibilityScore = 10;
    } catch (e) {
      // Fallback
      scoreData = {
        ineligibilityScore: 8.5,
        reasoning: "No weather disaster detected in the region. Farmers are only eligible for subsidies when weather disasters occur.",
        factors: ["No disaster alert", "Normal weather conditions"],
      };
    }

    return NextResponse.json(scoreData);
  } catch (error: any) {
    console.error("Eligibility score AI error:", error);
    return NextResponse.json(
      {
        ineligibilityScore: 8.5,
        reasoning: "Unable to calculate eligibility score. No disaster detected.",
        factors: ["No disaster alert"],
      },
      { status: 200 } // Return 200 so frontend can still show the score
    );
  }
}

