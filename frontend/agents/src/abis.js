export const FARMER_REGISTRY_ABI = [
  "function getFarmersByDistrict(string district) view returns (address[])",
  "function getFarmerProfile(address farmer) view returns (tuple(address wallet,string landProofHash,string district,string village,uint256 latitude,uint256 longitude,uint8 cropType,uint256 registrationTimestamp,bool isActive))",
];

export const WEATHER_ORACLE_ABI = [
  "function getWeatherEvent(string eventId) view returns (tuple(string region,uint256 timestamp,int256 temperature,uint256 rainfall,bool droughtAlert,bool floodAlert,string eventId,address oracleAddress))",
  "function getRegionEvents(string region) view returns (string[] events)",
  "function getAllEventIds() view returns (string[] eventIds)",
  "event WeatherDataRecorded(string indexed eventId,string region,int256 temperature,uint256 rainfall,bool droughtAlert,bool floodAlert,uint256 timestamp)",
];

export const ELIGIBILITY_ENGINE_ABI = [
  "function getAllSchemeIds() view returns (string[] schemeIds)",
  "function getLatestDecision(address farmer) view returns (tuple(address farmer,bool isEligible,uint256 subsidyAmount,bytes32 proofHash,string reason,string weatherEventId,uint256 timestamp))",
  "function checkEligibility(address farmer,string weatherEventId,string schemeId) returns (tuple(address farmer,bool isEligible,uint256 subsidyAmount,bytes32 proofHash,string reason,string weatherEventId,uint256 timestamp))",
  "function verifyProof(bytes32 proofHash,address farmer) view returns (bool isValid,tuple(address farmer,bool isEligible,uint256 subsidyAmount,bytes32 proofHash,string reason,string weatherEventId,uint256 timestamp) decision)",
];

export const SUBSIDY_DISTRIBUTOR_ABI = [
  "function executePayment(address farmer,bytes32 eligibilityProof,uint256 amount)",
  "function isPaymentExecuted(bytes32 proofHash) view returns (bool)",
];





