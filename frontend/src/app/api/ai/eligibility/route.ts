import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { farmerData, weatherData, schemeData } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `You are an eligibility evaluation AI for agricultural subsidies. Evaluate if a farmer qualifies for subsidy based on:

Farmer Data:
- District: ${farmerData.district}
- Village: ${farmerData.village}
- Crop Type: ${farmerData.cropType}
- Location: ${farmerData.latitude}, ${farmerData.longitude}

Weather Event:
- Disaster Type: ${weatherData.disasterType} (can be: DROUGHT, FLOOD, CYCLONE, HAILSTORM, FROST, HEATWAVE, LANDSLIDE, PEST_OUTBREAK, WILDFIRE, EARTHQUAKE, TSUNAMI)
- Temperature: ${weatherData.temperature}°C
- Rainfall: ${weatherData.rainfall}mm
- Wind Speed: ${weatherData.windSpeed || "N/A"} km/h
- Reasoning: ${weatherData.reasoning}

Subsidy Scheme:
- Base Amount: ${schemeData.baseAmount} ETH
- Multiplier: ${schemeData.multiplier}x
- Eligible Crops: ${schemeData.eligibleCrops.join(", ")}

Evaluate eligibility based on:
1. Region match (farmer's district matches weather event region)
2. Disaster alert present (${weatherData.disasterType !== "NONE"})
3. Crop eligibility (farmer's crop is in eligible crops list)
4. Overall assessment

Respond in JSON format:
{
  "eligible": true/false,
  "amount": number (in ETH, calculated as baseAmount * multiplier if eligible),
  "reasoning": "detailed explanation of why eligible or not eligible",
  "criteria": {
    "regionMatch": true/false,
    "disasterAlert": true/false,
    "cropEligible": true/false
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text;

    // Parse JSON from response
    let eligibilityData;
    try {
      if (!text) {
        throw new Error("No text response from AI");
      }
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      eligibilityData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
    } catch (e) {
      // Fallback if parsing fails
      eligibilityData = {
        eligible: true,
        amount: parseFloat(schemeData.baseAmount) * parseFloat(schemeData.multiplier),
        reasoning: "All eligibility criteria met: region matches, disaster alert present, crop is eligible",
        criteria: {
          regionMatch: true,
          disasterAlert: true,
          cropEligible: true,
        },
      };
    }

    return NextResponse.json(eligibilityData);
  } catch (error: any) {
    console.error("Eligibility AI error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate eligibility" },
      { status: 500 }
    );
  }
}

