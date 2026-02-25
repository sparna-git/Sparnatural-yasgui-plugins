import { Geometry } from "geojson";
import { wktToGeoJSON } from "betterknown";

/*
    Callback function for the MapPlugin. 
    Uses betterknown to parse WktLiterals (including MULTIPOLYGON, LINESTRING, LINESTRING Z)
    to GeoJSON geometries.
*/

export const wktToGeoJson = (literal: string): Geometry => {
  // betterknown handles GeoSPARQL-flavored WKT natively,
  // including the <IRI> prefix and all geometry types
  const result = wktToGeoJSON(literal);
  if (!result) {
    throw new Error(`Failed to parse WKT literal: ${literal}`);
  }
  return result;
};
