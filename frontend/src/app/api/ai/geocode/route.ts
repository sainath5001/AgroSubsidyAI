import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let district = "Unknown";
  let village = "Unknown";
  
  try {
    const body = await request.json();
    district = body.district || "Unknown";
    village = body.village || "Unknown";

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!district || !village) {
      return NextResponse.json(
        { error: "District and village are required" },
        { status: 400 }
      );
    }

    console.log(`Geocoding: ${village}, ${district}`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try gemini-1.5-flash first (faster, cheaper), fallback to gemini-1.5-pro
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (e) {
      console.log("Falling back to gemini-1.5-pro");
      model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    const prompt = `You are a geocoding AI. Given a district "${district}" and village "${village}" in India, provide the approximate latitude and longitude coordinates.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no code blocks, just the JSON object:
{
  "latitude": 28.6139,
  "longitude": 77.1234,
  "location": "village, district"
}

If you cannot find the exact location, provide coordinates for the district center. Make sure the coordinates are valid numbers.`;

    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini response:", text);

    // Parse JSON from response
    let geocodeData;
    try {
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      }
      
      // Extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        geocodeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }

      // Validate coordinates
      if (!geocodeData.latitude || !geocodeData.longitude) {
        throw new Error("Invalid coordinates in response");
      }

      // Ensure coordinates are numbers
      geocodeData.latitude = parseFloat(geocodeData.latitude);
      geocodeData.longitude = parseFloat(geocodeData.longitude);

      console.log("Parsed geocode data:", geocodeData);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);
      
      // Fallback: Try to extract numbers from text
      const latMatch = text.match(/latitude["\s:]+([0-9.]+)/i);
      const lonMatch = text.match(/longitude["\s:]+([0-9.]+)/i);
      
      if (latMatch && lonMatch) {
        geocodeData = {
          latitude: parseFloat(latMatch[1]),
          longitude: parseFloat(lonMatch[1]),
          location: `${village}, ${district}`,
        };
        console.log("Extracted coordinates from text:", geocodeData);
      } else {
        // Final fallback: Use district-based coordinates
        // Ghaziabad is near Delhi, so use approximate coordinates
        const defaultCoords: Record<string, { lat: number; lon: number }> = {
          ghaziabad: { lat: 28.6692, lon: 77.4538 },
          baghpat: { lat: 28.9444, lon: 77.2181 },
          delhi: { lat: 28.6139, lon: 77.2090 },
        };

        const districtLower = district.toLowerCase();
        const coords = defaultCoords[districtLower] || defaultCoords.delhi;
        
        geocodeData = {
          latitude: coords.lat,
          longitude: coords.lon,
          location: `${village}, ${district}`,
        };
        console.log("Using fallback coordinates:", geocodeData);
      }
    }

    return NextResponse.json(geocodeData);
  } catch (error: any) {
    console.error("Geocode AI error:", error);
    console.error("Error stack:", error.stack);
    
    // Return fallback coordinates instead of error
    const defaultCoords: Record<string, { lat: number; lon: number }> = {
      ghaziabad: { lat: 28.6692, lon: 77.4538 },
      baghpat: { lat: 28.9444, lon: 77.2181 },
      delhi: { lat: 28.6139, lon: 77.2090 },
    };

    const districtLower = district.toLowerCase();
    const coords = defaultCoords[districtLower] || defaultCoords.delhi;
    
    return NextResponse.json({
      latitude: coords.lat,
      longitude: coords.lon,
      location: `${village}, ${district}`,
      fallback: true,
    });
  }
}

